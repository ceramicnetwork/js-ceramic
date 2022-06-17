import type { StreamID } from '@ceramicnetwork/streamid'
import type { BaseQuery, Pagination, Page } from '@ceramicnetwork/common'
import type { Knex } from 'knex'
import type { DatabaseIndexApi, IndexStreamArgs } from '../database-index-api.js'
import { initTables } from './init-tables.js'
import { asTableName } from '../as-table-name.util.js'
import { InsertionOrder } from './insertion-order.js'

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

export class SqliteIndexApi implements DatabaseIndexApi {
  private readonly insertionOrder: InsertionOrder
  constructor(
    private readonly dbConnection: Knex,
    private readonly modelsToIndex: Array<StreamID>
  ) {
    this.insertionOrder = new InsertionOrder(dbConnection)
  }

  async indexStream(args: IndexStreamArgs & { createdAt?: Date; updatedAt?: Date }): Promise<void> {
    const tableName = asTableName(args.model)
    const now = asTimestamp(new Date())
    await this.dbConnection(tableName)
      .insert({
        stream_id: String(args.streamID),
        controller_did: String(args.controller),
        last_anchored_at: asTimestamp(args.lastAnchor),
        created_at: asTimestamp(args.createdAt) || now,
        updated_at: asTimestamp(args.updatedAt) || now,
      })
      .onConflict('stream_id')
      .merge({
        last_anchored_at: asTimestamp(args.lastAnchor),
        updated_at: asTimestamp(args.updatedAt) || now,
      })
  }

  async page(query: BaseQuery & Pagination): Promise<Page<StreamID>> {
    return this.insertionOrder.page(query)
  }

  async init(): Promise<void> {
    await initTables(this.dbConnection, this.modelsToIndex)
  }
}
