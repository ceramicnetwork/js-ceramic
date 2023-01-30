import { StreamID } from '@ceramicnetwork/streamid'
import type {
  BaseQuery,
  Pagination,
  Page,
  DiagnosticsLogger,
  Networks,
} from '@ceramicnetwork/common'
import { Knex } from 'knex'
import type { CID } from 'multiformats/cid'
import { ModelRelationsDefinition } from '@ceramicnetwork/stream-model'
import { InsertionOrder } from './insertion-order.js'
import { asTableName } from './as-table-name.util.js'
import { IndexQueryNotAvailableError } from './index-query-not-available.error.js'
import { TablesManager, PostgresTablesManager, SqliteTablesManager } from './tables-manager.js'
import { addColumnPrefix } from './column-name.util.js'

export const INDEXED_MODEL_CONFIG_TABLE_NAME = 'ceramic_models'

export interface IndexStreamArgs {
  readonly streamID: StreamID
  readonly model: StreamID
  readonly controller: string
  readonly streamContent: Record<string, any>
  readonly tip: CID
  readonly lastAnchor: Date | null
  readonly firstAnchor: Date | null
}

/**
 * Arguments for telling the index database that it should be ready to index streams of a new model.
 * Should include everything necessary for the database to start receiving `indexStream` calls with
 * MIDs belonging to the model.  This likely involves setting up the necessary database tables with
 * whatever columns, indexes, etc are needed.
 */
export interface IndexModelArgs {
  readonly model: StreamID
  readonly relations?: ModelRelationsDefinition
}

type IndexedData<DateType> = {
  stream_id: string
  controller_did: string
  stream_content: any
  tip: string
  last_anchored_at: DateType
  first_anchored_at: DateType
  created_at: DateType
  updated_at: DateType
}

/**
 * Base class for an index backend.
 */
export class DatabaseIndexApi<DateType = Date | number> {
  private readonly insertionOrder: InsertionOrder
  private modelsToIndex: Array<StreamID> = []
  // Maps Model streamIDs to the list of fields in the content of MIDs in that model that should be
  // indexed
  private readonly modelsIndexedFields = new Map<string, Array<string>>()
  tablesManager: TablesManager

  constructor(
    private readonly dbConnection: Knex,
    private readonly allowQueriesBeforeHistoricalSync: boolean,
    private readonly logger: DiagnosticsLogger,
    private readonly network: Networks
  ) {
    this.insertionOrder = new InsertionOrder(dbConnection)
  }

  now(): DateType {
    throw new Error('Must be implemented in extending class')
  }

  /**
   * Prepare the database to begin indexing the given models.  This generally involves creating
   * the necessary database tables and indexes.
   * @param models
   */
  async indexModels(models: Array<IndexModelArgs>): Promise<void> {
    await this.indexModelsInDatabase(models)
    for (const modelArgs of models) {
      this.modelsToIndex.push(modelArgs.model)
      if (modelArgs.relations) {
        this.modelsIndexedFields.set(modelArgs.model.toString(), Object.keys(modelArgs.relations))
      }
    }
  }

  private async indexModelsInDatabase(models: Array<IndexModelArgs>): Promise<void> {
    if (models.length === 0) return
    await this.tablesManager.initMidTables(models)
    await this.tablesManager.verifyTables(models)
    //
    // : CDB-1866 - populate the updated_by field properly when auth is implemented
    await this.dbConnection(INDEXED_MODEL_CONFIG_TABLE_NAME)
      .insert(
        models.map((indexModelArgs) => {
          return {
            model: indexModelArgs.model.toString(),
            updated_by: '<FIXME: PUT ADMIN DID WHEN AUTH IS IMPLEMENTED>',
          }
        })
      )
      .onConflict('model')
      .merge({
        updated_at: this.now(),
        is_indexed: true,
        updated_by: '<FIXME: PUT ADMIN DID WHEN AUTH IS IMPLEMENTED>',
      })
  }

  /**
   * Update the database to mark a list of models as no longer indexed.
   *
   * @param models
   */
  async stopIndexingModels(models: Array<StreamID>): Promise<void> {
    await this.stopIndexingModelsInDatabase(models)
    const modelsAsStrings = models.map((streamID) => streamID.toString())
    this.modelsToIndex = this.modelsToIndex.filter(
      (modelStreamID) => !modelsAsStrings.includes(modelStreamID.toString())
    )
  }

  private async stopIndexingModelsInDatabase(models: Array<StreamID>): Promise<void> {
    if (models.length === 0) return
    // FIXME: CDB-1866 - populate the updated_by field properly when auth is implemented
    await this.dbConnection(INDEXED_MODEL_CONFIG_TABLE_NAME)
      .insert(
        models.map((model) => {
          return {
            model: model.toString(),
            is_indexed: false,
            updated_by: '<FIXME: PUT ADMIN DID WHEN AUTH IS IMPLEMENTED>',
          }
        })
      )
      .onConflict('model')
      .merge({
        updated_at: this.now(),
        is_indexed: false,
        updated_by: '<FIXME: PUT ADMIN DID WHEN AUTH IS IMPLEMENTED>',
      })
  }

  /**
   * This method inserts the stream if it is not present in the index, or updates
   * the 'content' if the stream already exists in the index.
   * @param args
   */
  async indexStream(args: IndexStreamArgs & { createdAt?: Date; updatedAt?: Date }): Promise<void> {
    const tableName = asTableName(args.model)
    await this.indexDocumentInDatabase(tableName, args)
  }

  private async indexDocumentInDatabase(
    tableName: string,
    indexingArgs: IndexStreamArgs & { createdAt?: Date; updatedAt?: Date }
  ): Promise<void> {
    const indexedData = this.getIndexedData(indexingArgs)
    for (const field of this.modelsIndexedFields.get(indexingArgs.model.toString()) ?? []) {
      indexedData[addColumnPrefix(field)] = indexingArgs.streamContent[field]
    }

    await this.dbConnection(tableName).insert(indexedData).onConflict('stream_id').merge({
      last_anchored_at: indexedData.last_anchored_at,
      updated_at: indexedData.updated_at,
    })
  }

  getIndexedData(
    indexingArgs: IndexStreamArgs & { createdAt?: Date; updatedAt?: Date }
  ): IndexedData<DateType> {
    throw new Error('Must be implemented in extending class')
  }

  /**
   * Get all models to be actively indexed by node
   */
  public getActiveModelsToIndex(): Array<StreamID> {
    /**
     * Helper function to return array of active models that are currently being indexed.
     * This variable is automatically populated during node startup & updated with Admin API
     * add & delete operations.
     */
    return this.modelsToIndex
  }

  private async getIndexedModelsFromDatabase(): Promise<Array<StreamID>> {
    return (
      await this.dbConnection(INDEXED_MODEL_CONFIG_TABLE_NAME).select('model').where({
        is_indexed: true,
      })
    ).map((result) => {
      return StreamID.fromString(result.model)
    })
  }

  /**
   * Ensures that the given model StreamID can be queried and throws if not.
   */
  assertModelQueryable(modelStreamId: StreamID | string): void {
    // TODO(NET-1630) Throw if historical indexing is in progress
    if (!this.allowQueriesBeforeHistoricalSync) {
      throw new IndexQueryNotAvailableError(modelStreamId)
    }

    const model = modelStreamId.toString()
    if (this.modelsToIndex.find((indexedModel) => indexedModel.toString() == model) == undefined) {
      const err = new Error(`Query failed: Model ${model} is not indexed on this node`)
      this.logger.debug(err)
      throw err
    }
  }

  getCountFromResult(response: Array<Record<string, string | number>>): number {
    throw new Error('Must be implemented in extending class')
  }

  /**
   * Return number of suitable indexed records.
   */
  async count(query: BaseQuery): Promise<number> {
    this.assertModelQueryable(query.model)

    const tableName = asTableName(query.model)
    let dbQuery = this.dbConnection(tableName).count('*')
    if (query.account) {
      dbQuery = dbQuery.where({ controller_did: query.account })
    }
    if (query.filter) {
      for (const [key, value] of Object.entries(query.filter)) {
        const filterObj = {}
        filterObj[addColumnPrefix(key)] = value
        dbQuery = dbQuery.andWhere(filterObj)
      }
    }
    return dbQuery.then((response) => this.getCountFromResult(response))
  }

  /**
   * Query the index.
   */
  async page(query: BaseQuery & Pagination): Promise<Page<StreamID>> {
    this.assertModelQueryable(query.model)
    return this.insertionOrder.page(query)
  }

  /**
   * Run Compose DB config/startup operations
   */
  async init(): Promise<void> {
    await this.tablesManager.initConfigTables(this.network)
    this.modelsToIndex = await this.getIndexedModelsFromDatabase()
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
    return Number(response[0]['count'])
  }

  getIndexedData(
    indexingArgs: IndexStreamArgs & { createdAt?: Date; updatedAt?: Date }
  ): IndexedData<Date> {
    const now = this.now()
    return {
      stream_id: indexingArgs.streamID.toString(),
      controller_did: indexingArgs.controller.toString(),
      stream_content: indexingArgs.streamContent,
      tip: indexingArgs.tip.toString(),
      last_anchored_at: indexingArgs.lastAnchor,
      first_anchored_at: indexingArgs.firstAnchor,
      created_at: indexingArgs.createdAt || now,
      updated_at: indexingArgs.updatedAt || now,
    }
  }
}

/**
 * Convert `Date` to SQLite `INTEGER`.
 */
export function asTimestamp(input: Date | null | undefined): number | null {
  if (input) {
    return input.valueOf()
  } else {
    return undefined
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

  getCountFromResult(response: Array<Record<string, string | number>>): number {
    return Number(response[0]['count(*)'])
  }

  getIndexedData(
    indexingArgs: IndexStreamArgs & { createdAt?: Date; updatedAt?: Date }
  ): IndexedData<number> {
    const now = this.now()
    return {
      stream_id: indexingArgs.streamID.toString(),
      controller_did: indexingArgs.controller.toString(),
      stream_content: JSON.stringify(indexingArgs.streamContent),
      tip: indexingArgs.tip.toString(),
      last_anchored_at: asTimestamp(indexingArgs.lastAnchor),
      first_anchored_at: asTimestamp(indexingArgs.firstAnchor),
      created_at: asTimestamp(indexingArgs.createdAt) || now,
      updated_at: asTimestamp(indexingArgs.updatedAt) || now,
    }
  }
}
