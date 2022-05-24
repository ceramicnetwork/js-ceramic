import { DataSource } from 'typeorm'
import { StreamID } from '@ceramicnetwork/streamid'
import type { BaseQuery, DatabaseIndexAPI, IndexStreamArgs, Page, Pagination } from '../types.js'
import { initTables } from './init-tables.js'
import { asTableName } from '../as-table-name.util.js'
import { PaginationKind, parsePagination } from '../parse-pagination'

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

export class UnsupportedOrderingError extends Error {
  constructor(ordering: never) {
    super(`Unsupported ordering: ${ordering}`)
  }
}

export class SqliteIndexApi implements DatabaseIndexAPI {
  constructor(
    private readonly dataSource: DataSource,
    private readonly modelsToIndex: Array<StreamID>
  ) {}

  async indexStream(args: IndexStreamArgs): Promise<void> {
    const tableName = asTableName(args.model)
    const now = asTimestamp(new Date())
    const lastAnchoredAt = asTimestamp(args.lastAnchor)
    await this.dataSource.query(
      `INSERT INTO ${tableName}
      (stream_id, controller_did, last_anchored_at, created_at, updated_at) VALUES
      (?, ?, ?, ?, ?)
      ON CONFLICT(stream_id) DO UPDATE SET last_anchored_at = ?, updated_at = ?`,
      [
        String(args.streamID),
        String(args.controller),
        lastAnchoredAt,
        now,
        now,
        lastAnchoredAt,
        now,
      ]
    )
  }

  async page(query: BaseQuery & Pagination): Promise<Page<StreamID>> {
    const pagination = parsePagination(query)
    const limit = pagination.kind == PaginationKind.FORWARD ? pagination.first : pagination.last
    const response = await this.dataSource.query(
      `SELECT stream_id FROM ${asTableName(query.model)} LIMIT ?`,
      [limit]
    )
    const streamIds = response.map((row) => StreamID.fromString(row.stream_id))
    return {
      entries: streamIds,
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        endCursor: '',
        startCursor: '',
      },
    }
    // const pagination = parsePagination(query)
    // const order = query.order || Ordering.CHRONOLOGICAL
    // switch (order) {
    //   case Ordering.CHRONOLOGICAL:
    //     return
    //   case Ordering.INSERTION:
    //     return
    //   default:
    //     throw new UnsupportedOrderingError(order)
    // }
  }

  async init(): Promise<void> {
    if (!this.dataSource.isInitialized) {
      await this.dataSource.initialize()
    }
    await initTables(this.dataSource, this.modelsToIndex)
  }
}
