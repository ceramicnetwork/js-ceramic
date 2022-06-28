import { StreamID } from 'streamid/lib/stream-id.js'
import type { BaseQuery, Pagination, Page } from '@ceramicnetwork/common'
import type { DatabaseIndexApi, IndexStreamArgs } from '../database-index-api.js'
import { initTables } from '../postgres/init-tables.js'
import { InsertionOrder } from '../postgres/insertion-order.js'
import { asTableName } from '../as-table-name.util.js'
import { Knex } from 'knex'
import { asTimestamp } from '../sqlite/sqlite-index-api'
//import DeferredKeySelection from 'knex'

export class PostgresIndexApi implements DatabaseIndexApi {
  private readonly insertionOrder: InsertionOrder
  constructor(private readonly dbConnection: Knex, readonly modelsToIndex: Array<StreamID>) {
    this.insertionOrder = new InsertionOrder(dbConnection)
  }

  public getActiveModelsToIndex(): Array<StreamID> {
    /**
     * Helper function to return array of active models that are currently being indexed by node
     * as defined in the config file.
     * TODO: extend to runtime check once adminAPI unlocks to add and load models on the fly
     */
    return this.modelsToIndex
  }

  async indexStream(args: IndexStreamArgs & { createdAt?: Date; updatedAt?: Date }): Promise<void> {
    const tableName = asTableName(args.model)

    console.log('Postgres Index API')
    // created_at and last_updated_at set by default default value
    await this.dbConnection(tableName)
      .insert({
        stream_id: args.streamID,
        controller_did: args.controller,
        last_anchored_at: args.lastAnchor,
        created_at: args.createdAt || new Date(),
        updated_at: args.updatedAt || new Date(),
      })
      .onConflict('stream_id')
      .merge({
        last_anchored_at: args.lastAnchor,
        updated_at: args.updatedAt || new Date(),
      })
  }

  async page(query: BaseQuery & Pagination): Promise<Page<StreamID>> {
    return this.insertionOrder.page(query)
  }

  async init(): Promise<void> {
    await initTables(this.dbConnection, this.modelsToIndex)
  }

  async close(): Promise<void> {
    await this.dbConnection.destroy()
  }
}
