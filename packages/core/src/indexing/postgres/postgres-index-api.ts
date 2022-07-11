import { StreamID } from 'streamid/lib/stream-id.js'
import type { BaseQuery, Pagination, Page } from '@ceramicnetwork/common'
import type { DatabaseIndexApi, IndexStreamArgs } from '../database-index-api.js'
import { initTables } from './init-tables.js'
import { InsertionOrder } from './insertion-order.js'
import { asTableName } from '../as-table-name.util.js'
import { Knex } from 'knex'
import { IndexQueryNotAvailableError } from '../index-query-not-available.error.js'

export class PostgresIndexApi implements DatabaseIndexApi {
  readonly insertionOrder: InsertionOrder
  constructor(
    private readonly dbConnection: Knex,
    readonly modelsToIndex: Array<StreamID>,
    private readonly allowQueriesBeforeHistoricalSync: boolean
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
        stream_id: String(args.streamID),
        controller_did: String(args.controller),
        last_anchored_at: args.lastAnchor,
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

  async init(): Promise<void> {
    await initTables(this.dbConnection, this.modelsToIndex)
  }

  async close(): Promise<void> {
    await this.dbConnection.destroy()
  }
}
