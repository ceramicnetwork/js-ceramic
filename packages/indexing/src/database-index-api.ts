import { StreamID } from '@ceramicnetwork/streamid'
import type {
  BaseQuery,
  Pagination,
  Page,
  DiagnosticsLogger,
  Networks,
  FieldsIndex,
  ModelData,
} from '@ceramicnetwork/common'
import { Knex } from 'knex'
import type { CID } from 'multiformats/cid'
import { ModelRelationsDefinition } from '@ceramicnetwork/stream-model'
import { InsertionOrder } from './insertion-order.js'
import { asTableName } from './as-table-name.util.js'
import { IndexQueryNotAvailableError } from './index-query-not-available.error.js'
import { TablesManager, PostgresTablesManager, SqliteTablesManager } from './tables-manager.js'
import { addColumnPrefix } from './column-name.util.js'
import { ISyncQueryApi } from './history-sync/interfaces.js'
import cloneDeep from 'lodash.clonedeep'
import { indexNameFromTableName } from './migrations/1-create-model-table.js'
import type { QueryBuilder } from './insertion-order.js'

export const INDEXED_MODEL_CONFIG_TABLE_NAME = 'ceramic_models'
export const MODEL_IMPLEMENTS_TABLE_NAME = 'ceramic_model_implements'

export interface IndexStreamArgs {
  readonly streamID: StreamID
  readonly model: StreamID
  readonly controller: string
  readonly streamContent: Record<string, any> | null
  readonly tip: CID
  readonly lastAnchor: Date | null
  readonly firstAnchor: Date | null
  readonly shouldIndex?: boolean
}

/**
 * Create a valid name for a fields index. The index name cannot exceed 64 characters
 * @param idx Index to create a name for
 * @param table Table to add index to
 */
export function fieldsIndexName(idx: FieldsIndex, table: string): string {
  const fieldPath = idx.fields
    .flatMap((f) => f.path)
    .map((p) => p.slice(0, 5))
    .join('_')
  return `${indexNameFromTableName(table)}_${fieldPath}`.slice(0, 64)
}

/**
 * Arguments for telling the index database that it should be ready to index streams of a new model.
 * Should include everything necessary for the database to start receiving `indexStream` calls with
 * MIDs belonging to the model.  This likely involves setting up the necessary database tables with
 * whatever columns, indexes, etc are needed.
 */
export interface IndexModelArgs {
  readonly model: StreamID
  relations?: ModelRelationsDefinition
  indices?: Array<FieldsIndex>
  implements?: Array<string>
}

type IndexedData<DateType> = {
  stream_id: string
  controller_did: string
  stream_content: Record<string, any> | string
  tip: string
  last_anchored_at: DateType | null
  first_anchored_at: DateType | null
  created_at?: DateType
  updated_at: DateType
}

/**
 * Base class for an index backend.
 */
export abstract class DatabaseIndexApi<DateType = Date | number> {
  private readonly insertionOrder: InsertionOrder
  private indexedModels: Array<ModelData> = []
  // Maps Model streamIDs to the list of fields in the content of MIDs that the model has a relation
  // to
  private readonly modelRelations = new Map<string, Array<string>>()
  #interfacesModels: Record<string, Set<string>> = {}
  tablesManager!: TablesManager
  syncApi!: ISyncQueryApi

  protected constructor(
    protected readonly dbConnection: Knex,
    private readonly allowQueriesBeforeHistoricalSync: boolean,
    private readonly logger: DiagnosticsLogger,
    private readonly network: Networks
  ) {
    this.insertionOrder = new InsertionOrder(dbConnection)
  }

  abstract getIndexedData(
    indexingArgs: IndexStreamArgs & { createdAt?: Date; updatedAt?: Date }
  ): IndexedData<DateType>
  abstract now(): DateType
  abstract parseIndices(indices: unknown): Array<FieldsIndex>

  setSyncQueryApi(api: ISyncQueryApi) {
    this.syncApi = api
  }

  addModelImplements(modelID: string, interfaceID: string): void {
    const models = this.#interfacesModels[interfaceID] ?? new Set()
    models.add(modelID)
    this.#interfacesModels[interfaceID] = models
  }

  /**
   * Prepare the database to begin indexing the given models. This generally involves creating
   * the necessary database tables and indexes.
   * @param models
   */
  async indexModels(models: Array<IndexModelArgs>): Promise<void> {
    await this.indexModelsInDatabase(models)
    for (const modelArgs of models) {
      await this.assertNoOngoingSyncForModel(modelArgs.model)
      const foundModelToIndex = this.indexedModels.find((indexedModel) =>
        indexedModel.streamID.equals(modelArgs.model)
      )
      if (!foundModelToIndex) {
        this.indexedModels.push({
          streamID: modelArgs.model,
          indices: modelArgs.indices,
        })
      }
      if (modelArgs.relations) {
        this.modelRelations.set(modelArgs.model.toString(), Object.keys(modelArgs.relations))
      }
    }
  }

  private async indexModelsInDatabase(models: Array<IndexModelArgs>): Promise<void> {
    if (models.length === 0) return
    await this.tablesManager.initMidTables(models)
    await this.tablesManager.verifyTables(models)

    await this.dbConnection.transaction(async (trx) => {
      // : CDB-1866 - populate the updated_by field properly when auth is implemented
      await trx(INDEXED_MODEL_CONFIG_TABLE_NAME)
        .insert(
          models.map((indexModelArgs) => {
            return {
              model: indexModelArgs.model.toString(),
              ...(indexModelArgs.indices && { indices: JSON.stringify(indexModelArgs.indices) }),
              is_indexed: true,
              updated_by: '0', // TODO: FIXME: CDB-1866 - <FIXME: PUT ADMIN DID WHEN AUTH IS IMPLEMENTED>',
              updated_at: this.now(),
            }
          })
        )
        .onConflict('model')
        .merge({
          updated_at: this.now(),
          is_indexed: true,
          updated_by: '0', // TODO: FIXME: CDB-1866 - <FIXME: PUT ADMIN DID WHEN AUTH IS IMPLEMENTED>',
        })

      const modelImplements = models.flatMap((args) => {
        const modelID = args.model.toString()
        return (args.implements ?? []).map((interfaceID) => {
          this.addModelImplements(modelID, interfaceID)
          return { interface_id: interfaceID, implemented_by_id: modelID }
        })
      })
      if (modelImplements.length) {
        await trx(MODEL_IMPLEMENTS_TABLE_NAME).insert(modelImplements).onConflict().ignore()
      }
    })
  }

  /**
   * Update the database to mark a list of models as no longer indexed.
   *
   * @param models
   */
  async stopIndexingModels(models: Array<ModelData>): Promise<void> {
    await this.stopIndexingModelsInDatabase(models)
    this.indexedModels = this.indexedModels.filter(
      (idx) => !models.some((data) => data.streamID.equals(idx.streamID))
    )
  }

  private async stopIndexingModelsInDatabase(models: Array<ModelData>): Promise<void> {
    if (models.length === 0) return
    // FIXME: CDB-1866 - populate the updated_by field properly when auth is implemented
    await this.dbConnection(INDEXED_MODEL_CONFIG_TABLE_NAME)
      .insert(
        models.map((model) => {
          return {
            model: model.streamID.toString(),
            is_indexed: false,
            updated_by: '0', // TODO: FIXME: CDB-1866 - <FIXME: PUT ADMIN DID WHEN AUTH IS IMPLEMENTED>',
            updated_at: this.now(),
          }
        })
      )
      .onConflict('model')
      .merge({
        updated_at: this.now(),
        is_indexed: false,
        updated_by: '0', // TODO: FIXME: CDB-1866 - <FIXME: PUT ADMIN DID WHEN AUTH IS IMPLEMENTED>',
      })
  }

  /**
   * This method inserts the stream if it is not present in the index, updates
   * the 'content' if the stream already exists in the index, or deletes the
   * stream from the index if the 'shouldIndex' arg is set to false.
   * @param indexingArgs
   */
  async indexStream(
    indexingArgs: IndexStreamArgs & { createdAt?: Date; updatedAt?: Date }
  ): Promise<void> {
    if (indexingArgs.streamContent == null) {
      // Don't index streams with no content (deterministic streams created from genesis)
      return
    }
    const tableName = asTableName(indexingArgs.model)
    if (indexingArgs.shouldIndex === false) {
      await this.dbConnection(tableName)
        .where('stream_id', indexingArgs.streamID.toString())
        .delete()
      return
    }
    const indexedData = this.getIndexedData(indexingArgs) as Record<string, unknown>
    const relations = this.modelRelations.get(indexingArgs.model.toString()) ?? []
    for (const relation of relations) {
      indexedData[addColumnPrefix(relation)] = indexingArgs.streamContent?.[relation]
    }
    const toMerge = cloneDeep(indexedData)
    delete toMerge['created_at']
    await this.dbConnection(tableName).insert(indexedData).onConflict('stream_id').merge(toMerge)
  }

  /**
   * Get all models actively indexed by node
   */
  public getIndexedModels(): Array<ModelData> {
    /**
     * Helper function to return array of active models that are currently being indexed.
     * This variable is automatically populated during node startup & updated with Admin API
     * add & delete operations.
     */
    return this.indexedModels
  }

  private async getIndexedModelsFromDatabase(): Promise<Array<ModelData>> {
    return (
      await this.dbConnection(INDEXED_MODEL_CONFIG_TABLE_NAME).select('model', 'indices').where({
        is_indexed: true,
      })
    ).map((result) => {
      return {
        streamID: StreamID.fromString(result.model),
        indices: this.parseIndices(result.indices),
      }
    })
  }

  async _getInterfacesModelsFromDataBase(): Promise<Record<string, Set<string>>> {
    const interfacesModels: Record<string, Set<string>> = {}
    const results = await this.dbConnection(MODEL_IMPLEMENTS_TABLE_NAME).select(
      'interface_id',
      'implemented_by_id'
    )
    for (const result of results) {
      const interfaceID = result.interface_id
      if (interfacesModels[interfaceID] == null) {
        interfacesModels[interfaceID] = new Set()
      }
      interfacesModels[interfaceID]!.add(result.implemented_by_id)
    }
    return interfacesModels
  }

  async getModelsNoLongerIndexed(): Promise<Array<ModelData>> {
    return (
      await this.dbConnection(INDEXED_MODEL_CONFIG_TABLE_NAME).select('model', 'indices').where({
        is_indexed: false,
      })
    ).map((result) => {
      return {
        streamID: StreamID.fromString(result.model),
        indices: result.indices,
      }
    })
  }

  /**
   * Ensures that the given model StreamID can be queried and throws if not.
   */
  async assertModelQueryable(modelStreamId: StreamID) {
    await this.assertModelIsIndexed(modelStreamId)
    await this.assertNoOngoingSyncForModel(modelStreamId)
  }

  _getIndexedModel(id: StreamID): ModelData | undefined {
    return this.indexedModels.find((indexedModel) => id.equals(indexedModel.streamID))
  }

  /**
   * Assert that a model has been indexed
   * @param modelStreamId
   */
  async assertModelIsIndexed(modelStreamId: StreamID) {
    const foundModelToIndex = this._getIndexedModel(modelStreamId)
    if (foundModelToIndex == undefined) {
      const err = new Error(
        `Query failed: Model ${modelStreamId.toString()} is not indexed on this node`
      )
      this.logger.debug(err)
      throw err
    }
  }

  /**
   * Assert that there is no ongoing historical sync for a model
   * @param modelStreamId
   */
  async assertNoOngoingSyncForModel(modelStreamId: StreamID): Promise<void> {
    if (
      !this.allowQueriesBeforeHistoricalSync &&
      !(await this.syncApi.syncComplete(modelStreamId.toString()))
    ) {
      throw new IndexQueryNotAvailableError(modelStreamId)
    }
  }

  abstract getCountFromResult(response: Array<Record<string, string | number>>): number

  async getQueryModels(query: BaseQuery): Promise<Set<string>> {
    let ids: Array<StreamID | string> = []
    // Use models array by default, but may not be provided by older clients
    if (Array.isArray(query.models) && query.models.length !== 0) {
      ids = query.models
    } else if (query.model != null) {
      // Fallback to single model
      ids = [query.model]
    } else {
      // As neither the models or model values are required, it's possible no model is provided
      throw new Error(`Missing "models" values to execute query`)
    }

    // Collect all models implementing interfaces
    const models = new Set<string>()
    for (const modelID of ids) {
      const id = modelID.toString()
      const interfaceModels = this.#interfacesModels[id]
      if (interfaceModels == null) {
        // Assume non-interface model
        models.add(id)
      } else {
        // Add all indexed models implementing the interface
        for (const model of interfaceModels) {
          if (this._getIndexedModel(StreamID.fromString(model)) != null) {
            models.add(model)
          }
        }
      }
    }
    // Check models are queryable
    await Promise.all(
      Array.from(models).map(async (id) => {
        await this.assertModelQueryable(StreamID.fromString(id))
      })
    )
    return models
  }

  /**
   * Return number of suitable indexed records.
   */
  async count(query: BaseQuery): Promise<number> {
    const models = await this.getQueryModels(query)
    if (models.size === 0) {
      return 0
    }

    return this.dbConnection
      .count('*')
      .from((qb: QueryBuilder) => {
        const subQueries = Array.from(models).map((model) => {
          return this.insertionOrder.applyFilters(
            this.dbConnection.from(asTableName(model)).select('stream_id'),
            query
          )
        })
        return qb.unionAll(subQueries).as('models')
      })
      .then((response) => this.getCountFromResult(response as any))
  }

  /**
   * Query the index.
   */
  async page(query: BaseQuery & Pagination): Promise<Page<StreamID>> {
    const models = await this.getQueryModels(query)
    if (models.size === 0) {
      return { edges: [], pageInfo: { hasNextPage: false, hasPreviousPage: false } }
    }
    return this.insertionOrder.page(models, query)
  }

  /**
   * Run ComposeDB config/startup operations
   */
  async init(): Promise<void> {
    await this.tablesManager.initConfigTables(this.network)
    const [indexedModels, interfacesModels] = await Promise.all([
      this.getIndexedModelsFromDatabase(),
      this._getInterfacesModelsFromDataBase(),
    ])
    this.indexedModels = indexedModels
    this.#interfacesModels = interfacesModels
  }

  /**
   * Stop connection to a database.
   */
  async close(): Promise<void> {
    await this.dbConnection.destroy()
  }
}

export class PostgresIndexApi extends DatabaseIndexApi<Date> {
  constructor(
    dbConnection: Knex,
    allowQueriesBeforeHistoricalSync: boolean,
    logger: DiagnosticsLogger,
    network: Networks
  ) {
    super(dbConnection, allowQueriesBeforeHistoricalSync, logger, network)
    this.tablesManager = new PostgresTablesManager(dbConnection, logger)
  }

  now(): Date {
    // we don't use this.dbConnection.fn.now(), because postgres datetime may have higher precision than js date; TODO: CDB-2006: set postgres created_at and updated_at precision to 3
    return new Date()
  }

  getCountFromResult(response: Array<Record<string, string | number>>): number {
    return Number(response[0]!['count'])
  }

  getIndexedData(
    indexingArgs: IndexStreamArgs & { createdAt?: Date; updatedAt?: Date }
  ): IndexedData<Date> {
    const now = this.now()
    return {
      stream_id: indexingArgs.streamID.toString(),
      controller_did: indexingArgs.controller.toString(),
      stream_content: indexingArgs.streamContent ?? {},
      tip: indexingArgs.tip.toString(),
      last_anchored_at: indexingArgs.lastAnchor,
      first_anchored_at: indexingArgs.firstAnchor,
      created_at: indexingArgs.createdAt || now,
      updated_at: indexingArgs.updatedAt || now,
    }
  }

  parseIndices(indices: Array<FieldsIndex>): Array<FieldsIndex> {
    return indices ?? undefined // postgres automatically parses the result into a js object
  }
}

/**
 * Convert `Date` to SQLite `INTEGER`.
 */
export function asTimestamp(input: Date | null | undefined): number | null {
  if (input) {
    return input.valueOf()
  } else {
    return null
  }
}

export class SqliteIndexApi extends DatabaseIndexApi<number> {
  constructor(
    dbConnection: Knex,
    allowQueriesBeforeHistoricalSync: boolean,
    logger: DiagnosticsLogger,
    network: Networks
  ) {
    super(dbConnection, allowQueriesBeforeHistoricalSync, logger, network)
    this.tablesManager = new SqliteTablesManager(dbConnection, logger)
  }

  now(): number {
    return new Date().valueOf()
  }

  getCountFromResult(response: [Record<string, string | number>]): number {
    return Number(response[0]['count(*)'])
  }

  getIndexedData(
    indexingArgs: IndexStreamArgs & { createdAt?: Date; updatedAt?: Date }
  ): IndexedData<number> {
    const now = this.now()
    return {
      stream_id: indexingArgs.streamID.toString(),
      controller_did: indexingArgs.controller.toString(),
      stream_content: JSON.stringify(indexingArgs.streamContent ?? {}),
      tip: indexingArgs.tip.toString(),
      last_anchored_at: asTimestamp(indexingArgs.lastAnchor),
      first_anchored_at: asTimestamp(indexingArgs.firstAnchor),
      created_at: asTimestamp(indexingArgs.createdAt) || now,
      updated_at: asTimestamp(indexingArgs.updatedAt) || now,
    }
  }

  parseIndices(indices: string): Array<FieldsIndex> {
    return indices ? JSON.parse(indices) : undefined // sqlite returns indices as a string
  }
}
