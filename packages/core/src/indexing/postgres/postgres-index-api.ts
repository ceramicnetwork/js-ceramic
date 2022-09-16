import { StreamID } from 'streamid/lib/stream-id.js'
import type { BaseQuery, Pagination, Page, DiagnosticsLogger } from '@ceramicnetwork/common'
import type { DatabaseIndexApi, IndexModelArgs, IndexStreamArgs } from '../database-index-api.js'
import { initTables, verifyTables } from './init-tables.js'
import { InsertionOrder } from './insertion-order.js'
import { asTableName } from '../as-table-name.util.js'
import { Knex } from 'knex'
import { IndexQueryNotAvailableError } from '../index-query-not-available.error.js'
import { validTableStructure } from './migrations/mid-schema-verification.js'

export class PostgresIndexApi implements DatabaseIndexApi {
  readonly insertionOrder: InsertionOrder
  readonly modelsToIndex: Array<StreamID> = []

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

  async verifyTables(models: Array<StreamID>, tableStructure = validTableStructure): Promise<void> {
    await verifyTables(this.dbConnection, models, tableStructure)
  }

  async indexModels(models: Array<IndexModelArgs>): Promise<void> {
    const modelStreamIDs = models.map((args) => args.model)
    await initTables(this.dbConnection, modelStreamIDs, this.logger)
    await this.verifyTables(modelStreamIDs)
    this.modelsToIndex.push(...modelStreamIDs)
  }

  async close(): Promise<void> {
    await this.dbConnection.destroy()
  }
}
