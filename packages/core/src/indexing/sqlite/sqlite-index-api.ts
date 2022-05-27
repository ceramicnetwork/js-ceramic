import { DataSource } from 'typeorm'
import { StreamID } from '@ceramicnetwork/streamid'
import type { Knex } from 'knex'
import type { BaseQuery, DatabaseIndexAPI, IndexStreamArgs, Page, Pagination } from '../types.js'
import { initTables } from './init-tables.js'
import { asTableName } from '../as-table-name.util.js'
import { UnsupportedOrderingError, Ordering } from '../ordering.js'
import { NotImplementedError } from '../not-implemented-error.js'
import { ChronologicalOrder } from './chronological-order.js'

/**
 * Convert `Date` to SQLite `INTEGER`.
 */
export function asTimestamp(input: Date | null | undefined): number | null {
  if (input) {
    return Math.floor(input.valueOf() / 1000)
  } else {
    return undefined
  }
}

export class SqliteIndexApi implements DatabaseIndexAPI {
  private readonly chronologicalOrder: ChronologicalOrder
  constructor(
    private readonly dataSource: DataSource,
    private readonly knexConnection: Knex,
    private readonly modelsToIndex: Array<StreamID>
  ) {
    this.chronologicalOrder = new ChronologicalOrder(dataSource, knexConnection)
  }

  async indexStream(args: IndexStreamArgs & { createdAt?: Date; updatedAt?: Date }): Promise<void> {
    const tableName = asTableName(args.model)
    const now = asTimestamp(new Date())
    const knexQuery = this.knexConnection(tableName)
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
    await this.query(knexQuery)
  }

  async page(query: BaseQuery & Pagination): Promise<Page<StreamID>> {
    const order = query.order || Ordering.CHRONOLOGICAL
    switch (order) {
      case Ordering.CHRONOLOGICAL:
        return this.chronologicalOrder.page(query)
      case Ordering.INSERTION:
        throw new NotImplementedError(`SqliteIndexAPI::page for insertion order`)
      default:
        throw new UnsupportedOrderingError(order)
    }
  }

  async init(): Promise<void> {
    if (!this.dataSource.isInitialized) {
      await this.dataSource.initialize()
    }
    await initTables(this.dataSource, this.modelsToIndex)
  }

  private query<T = any>(queryBuilder: Knex.QueryBuilder): Promise<T> {
    const asSQL = queryBuilder.toSQL()
    return this.dataSource.query(asSQL.sql, asSQL.bindings as any[])
  }
}
