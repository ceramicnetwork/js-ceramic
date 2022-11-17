import { StreamID } from '@ceramicnetwork/streamid'
import type {
  BaseQuery,
  Pagination,
  Page,
  DiagnosticsLogger,
  Networks,
} from '@ceramicnetwork/common'
import type { DatabaseIndexApi, IndexModelArgs, IndexStreamArgs } from '../database-index-api.js'
import { initConfigTables, initMidTables, verifyTables } from './init-tables.js'
import { InsertionOrder } from './insertion-order.js'
import { asTableName } from '../as-table-name.util.js'
import { Knex } from 'knex'
import { IndexQueryNotAvailableError } from '../index-query-not-available.error.js'
import { INDEXED_MODEL_CONFIG_TABLE_NAME } from '../database-index-api.js'

export class PostgresIndexApi implements DatabaseIndexApi {
  private readonly insertionOrder: InsertionOrder
  private modelsToIndex: Array<StreamID> = []
  // Maps Model streamIDs to the list of fields in the content of MIDs in that model that should be
  // indexed
  private readonly modelsIndexedFields = new Map<string, Array<string>>()

  constructor(
    private readonly dbConnection: Knex,
    private readonly allowQueriesBeforeHistoricalSync: boolean,
    private readonly logger: DiagnosticsLogger,
    private readonly network: Networks
  ) {
    this.insertionOrder = new InsertionOrder(dbConnection)
  }

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

  private async indexDocumentInDatabase(
    tableName: string,
    indexingArgs: IndexStreamArgs & { createdAt?: Date; updatedAt?: Date }
  ): Promise<void> {
    // created_at and last_updated_at set by default value
    const indexedData = {
      stream_id: indexingArgs.streamID.toString(),
      controller_did: indexingArgs.controller.toString(),
      stream_content: indexingArgs.streamContent,
      tip: indexingArgs.tip.toString(),
      last_anchored_at: indexingArgs.lastAnchor,
      first_anchored_at: indexingArgs.firstAnchor,
      created_at: indexingArgs.createdAt || new Date(), // we don't use this.dbConnection.fn.now(), because postgres datetime may have higher precision than js date; TODO: CDB-2006: set postgres created_at and updated_at precision to 3
      updated_at: indexingArgs.updatedAt || new Date(), // we don't use this.dbConnection.fn.now(), because postgres datetime may have higher precision than js date; TODO: CDB-2006: set postgres created_at and updated_at precision to 3
    }
    for (const field of this.modelsIndexedFields.get(indexingArgs.model.toString()) ?? []) {
      indexedData[field] = indexingArgs.streamContent[field]
    }

    await this.dbConnection(tableName)
      .insert(indexedData)
      .onConflict('stream_id')
      .merge({
        last_anchored_at: indexingArgs.lastAnchor,
        updated_at: indexingArgs.updatedAt || new Date(), // we don't use this.dbConnection.fn.now(), because postgres datetime may have higher precision than js date; TODO: CDB-2006: set postgres created_at and updated_at precision to 3
      })
  }

  private async indexModelsInDatabase(models: Array<IndexModelArgs>): Promise<void> {
    if (models.length === 0) return
    await initMidTables(this.dbConnection, models, this.logger)
    await this.verifyTables(models)
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
        updated_at: new Date(), // we don't use this.dbConnection.fn.now(), because postgres datetime may have higher precision than js date; TODO: CDB-2006: set postgres created_at and updated_at precision to 3
        is_indexed: true,
        updated_by: '<FIXME: PUT ADMIN DID WHEN AUTH IS IMPLEMENTED>',
      })
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
        updated_at: new Date(), // we don't use this.dbConnection.fn.now(), because postgres datetime may have higher precision than js date; TODO: CDB-2006: set postgres created_at and updated_at precision to 3
        is_indexed: false,
        updated_by: '<FIXME: PUT ADMIN DID WHEN AUTH IS IMPLEMENTED>',
      })
  }

  async indexStream(args: IndexStreamArgs & { createdAt?: Date; updatedAt?: Date }): Promise<void> {
    const tableName = asTableName(args.model)
    await this.indexDocumentInDatabase(tableName, args)
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

  async page(query: BaseQuery & Pagination): Promise<Page<StreamID>> {
    this.assertModelQueryable(query.model)
    return this.insertionOrder.page(query)
  }

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
        filterObj[key] = value
        dbQuery = dbQuery.andWhere(filterObj)
      }
    }
    return dbQuery.then((response) => Number(response[0]['count']))
  }

  async verifyTables(models: Array<IndexModelArgs>): Promise<void> {
    await verifyTables(this.dbConnection, models)
  }

  async indexModels(models: Array<IndexModelArgs>): Promise<void> {
    await this.indexModelsInDatabase(models)
    for (const modelArgs of models) {
      this.modelsToIndex.push(modelArgs.model)
      if (modelArgs.relations) {
        this.modelsIndexedFields.set(modelArgs.model.toString(), Object.keys(modelArgs.relations))
      }
    }
  }

  async stopIndexingModels(models: Array<StreamID>): Promise<void> {
    await this.stopIndexingModelsInDatabase(models)
    const modelsAsStrings = models.map((streamID) => streamID.toString())
    this.modelsToIndex = this.modelsToIndex.filter(
      (modelStreamID) => !modelsAsStrings.includes(modelStreamID.toString())
    )
  }

  async init(): Promise<void> {
    await initConfigTables(this.dbConnection, this.logger, this.network)
    this.modelsToIndex = await this.getIndexedModelsFromDatabase()
  }

  async close(): Promise<void> {
    await this.dbConnection.destroy()
  }
}
