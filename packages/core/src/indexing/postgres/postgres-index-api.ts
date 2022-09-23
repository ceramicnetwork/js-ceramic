import { StreamID } from '@ceramicnetwork/streamid'
import type { BaseQuery, Pagination, Page, DiagnosticsLogger } from '@ceramicnetwork/common'
import type { DatabaseIndexApi, IndexModelArgs, IndexStreamArgs } from '../database-index-api.js'
import { initConfigTables, initMidTables, verifyTables } from './init-tables.js'
import { InsertionOrder } from './insertion-order.js'
import { asTableName } from '../as-table-name.util.js'
import { Knex } from 'knex'
import { IndexQueryNotAvailableError } from '../index-query-not-available.error.js'
import { INDEXED_MODEL_CONFIG_TABLE_NAME } from '../database-index-api.js'

export class PostgresIndexApi implements DatabaseIndexApi {
  readonly insertionOrder: InsertionOrder
  private modelsToIndex: Array<StreamID> = []

  constructor(
    private readonly dbConnection: Knex,
    private readonly allowQueriesBeforeHistoricalSync: boolean,
    private readonly logger: DiagnosticsLogger
  ) {
    this.insertionOrder = new InsertionOrder(dbConnection)
  }

  public getActiveModelsToIndex(): Array<StreamID> {
    /**
     * Helper function to return array of active models that are currently being indexed by node
     * as defined in the config file.
     * TODO (NET-1634): extend to runtime check once adminAPI unlocks to add and load models on the fly
     */
    return this.modelsToIndex
  }

  async indexStream(args: IndexStreamArgs & { createdAt?: Date; updatedAt?: Date }): Promise<void> {
    const tableName = asTableName(args.model)

    // created_at and last_updated_at set by default value
    await this.dbConnection(tableName)
      .insert({
        stream_id: args.streamID.toString(),
        controller_did: args.controller.toString(),
        stream_content: args.streamContent,
        tip: args.tip.toString(),
        last_anchored_at: args.lastAnchor,
        first_anchored_at: args.firstAnchor,
        created_at: args.createdAt || this.dbConnection.fn.now(),
        updated_at: args.updatedAt || this.dbConnection.fn.now(),
      })
      .onConflict('stream_id')
      .merge({
        last_anchored_at: args.lastAnchor,
        updated_at: args.updatedAt || this.dbConnection.fn.now(),
      })
  }

  async page(query: BaseQuery & Pagination): Promise<Page<StreamID>> {
    // TODO(NET-1630) Throw if historical indexing is in progress
    if (!this.allowQueriesBeforeHistoricalSync) {
      throw new IndexQueryNotAvailableError(query.model)
    }
    return this.insertionOrder.page(query)
  }

  async verifyTables(models: Array<IndexModelArgs>): Promise<void> {
    await verifyTables(this.dbConnection, models)
  }

  async indexModels(models: Array<IndexModelArgs>): Promise<void> {
    if (models.length === 0) return

    await initMidTables(this.dbConnection, models, this.logger)
    await this.verifyTables(models)
    // FIXME: populate the updated_by field properly when auth is implemented
    await this.dbConnection(INDEXED_MODEL_CONFIG_TABLE_NAME)
      .insert(models.map(indexModelArgs => {
        return {
          model: indexModelArgs.model.toString(),
          updated_by: "<FIXME: PUT ADMIN DID WHEN AUTH IS IMPLEMENTED>"
        }
      }))
      .onConflict('model')
      .merge({
        updated_at: this.dbConnection.fn.now(),
        is_indexed: true,
        updated_by: "<FIXME: PUT ADMIN DID WHEN AUTH IS IMPLEMENTED>"
      })

    const modelStreamIDs = models.map((args) => args.model)
    this.modelsToIndex.push(...modelStreamIDs)
  }

  async stopIndexingModels(models: Array<StreamID>): Promise<void> {
    if (models.length === 0) return

    // FIXME: populate the updated_by field properly when auth is implemented
    await this.dbConnection(INDEXED_MODEL_CONFIG_TABLE_NAME)
      .insert(models.map(model => {
        return {
          model: model.toString(),
          is_indexed: false,
          updated_by: "<FIXME: PUT ADMIN DID WHEN AUTH IS IMPLEMENTED>"
        }
      }))
      .onConflict('model')
      .merge({
        updated_at: this.dbConnection.fn.now(),
        is_indexed: false,
        updated_by: "<FIXME: PUT ADMIN DID WHEN AUTH IS IMPLEMENTED>"
      })
    this.modelsToIndex = this.modelsToIndex.filter(modelStreamID => !models.includes(modelStreamID))
  }

  async init(): Promise<void> {
    await initConfigTables(this.dbConnection, this.logger)
    this.modelsToIndex = (await this.dbConnection(INDEXED_MODEL_CONFIG_TABLE_NAME)
        .select('model')
        .where({
          is_indexed: true
        })
    ).map(result => {
      return StreamID.fromString(result.model)
    })
  }

  async close(): Promise<void> {
    await this.dbConnection.destroy()
  }
}
