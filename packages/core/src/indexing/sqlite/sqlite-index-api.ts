import { DataSource } from 'typeorm'
import { StreamID } from '@ceramicnetwork/streamid'
import type { Knex } from 'knex'
import * as uint8arrays from 'uint8arrays'
import type { BaseQuery, DatabaseIndexAPI, IndexStreamArgs, Page, Pagination } from '../types.js'
import { initTables } from './init-tables.js'
import { asTableName } from '../as-table-name.util.js'
import {
  BackwardPaginationQuery,
  ForwardPaginationQuery,
  PaginationKind,
  parsePagination,
} from '../parse-pagination.js'

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

abstract class Cursor {
  static parse(cursor: string): any {
    return JSON.parse(uint8arrays.toString(uint8arrays.fromString(cursor, 'base64url')))
  }

  static stringify(input: any): string | undefined {
    if (input) {
      return uint8arrays.toString(uint8arrays.fromString(JSON.stringify(input)), 'base64url')
    } else {
      return undefined
    }
  }
}

function asChronologicalCursor(
  input: { created_at: number; last_anchored_at: number } | undefined
) {
  if (!input) return undefined
  return { created_at: input.created_at, last_anchored_at: input.last_anchored_at }
}

type Selected = { stream_id: string; last_anchored_at: number; created_at: number }

export class SqliteIndexApi implements DatabaseIndexAPI {
  constructor(
    private readonly dataSource: DataSource,
    private readonly knexConnection: Knex,
    private readonly modelsToIndex: Array<StreamID>
  ) {}

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
      .toSQL()
    await this.dataSource.query(knexQuery.sql, knexQuery.bindings as any[])
  }

  async page(query: BaseQuery & Pagination): Promise<Page<StreamID>> {
    const pagination = parsePagination(query)
    const paginationKind = pagination.kind
    switch (paginationKind) {
      case PaginationKind.FORWARD: {
        const limit = pagination.first
        const response = await this.query<Array<Selected>>(this.forwardQuery(query, pagination))
        const entries = response.slice(0, limit)
        const firstEntry = entries[0]
        const lastEntry = entries[entries.length - 1]
        return {
          entries: entries.map((row) => StreamID.fromString(row.stream_id)),
          pageInfo: {
            hasNextPage: response.length > limit,
            hasPreviousPage: false,
            endCursor: Cursor.stringify(asChronologicalCursor(lastEntry)),
            startCursor: Cursor.stringify(asChronologicalCursor(firstEntry)),
          },
        }
      }
      case PaginationKind.BACKWARD: {
        const limit = pagination.last
        const response = await this.query<Array<Selected>>(this.backwardQuery(query, pagination))
        const entries = response.slice(-limit)
        const firstEntry = entries[0]
        const lastEntry = entries[entries.length - 1]
        return {
          entries: entries.map((row) => StreamID.fromString(row.stream_id)),
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: response.length > limit,
            endCursor: Cursor.stringify(asChronologicalCursor(lastEntry)),
            startCursor: Cursor.stringify(asChronologicalCursor(firstEntry)),
          },
        }
      }
      default:
        throw new UnsupportedOrderingError(paginationKind)
    }
  }

  async init(): Promise<void> {
    if (!this.dataSource.isInitialized) {
      await this.dataSource.initialize()
    }
    await initTables(this.dataSource, this.modelsToIndex)
  }

  private forwardQuery(query: BaseQuery, pagination: ForwardPaginationQuery): Knex.QueryBuilder {
    const tableName = asTableName(query.model)
    const base = this.knexConnection
      .from(tableName)
      .select('stream_id', 'last_anchored_at', 'created_at')
      .orderBy([
        { column: 'last_anchored_at', order: 'DESC', nulls: 'last' }, // (`last_anchored_at` is null) DESC
        { column: 'last_anchored_at', order: 'DESC' },
        { column: 'created_at', order: 'DESC' },
      ])
      .limit(pagination.first + 1)
    if (pagination.after) {
      const after = Cursor.parse(pagination.after)
      if (after.last_anchored_at) {
        return base.where('last_anchored_at', '<', after.last_anchored_at)
      } else {
        return base
          .where((builder) =>
            builder.whereNull('last_anchored_at').andWhere('created_at', '<', after.created_at)
          )
          .orWhereNotNull('last_anchored_at')
      }
    } else {
      return base
    }
  }

  private backwardQuery(query: BaseQuery, pagination: BackwardPaginationQuery): Knex.QueryBuilder {
    const tableName = asTableName(query.model)
    const limit = pagination.last
    const identity = <T>(a: T) => a
    const base = (
      withWhereCallback: (builder: Knex.QueryBuilder) => Knex.QueryBuilder = identity
    ) => {
      return this.knexConnection
        .select('*')
        .from((builder) =>
          withWhereCallback(
            builder
              .from(tableName)
              .select('stream_id', 'last_anchored_at', 'created_at')
              .orderBy([
                { column: 'last_anchored_at', order: 'ASC', nulls: 'last' }, // (`last_anchored_at` is null) ASC
                { column: 'last_anchored_at', order: 'ASC' },
                { column: 'created_at', order: 'ASC' },
              ])
              .limit(limit + 1)
          )
        )
        .orderBy([
          { column: 'last_anchored_at', order: 'DESC', nulls: 'last' }, // (`last_anchored_at` is null) DESC
          { column: 'last_anchored_at', order: 'DESC' },
          { column: 'created_at', order: 'DESC' },
        ])
    }
    if (pagination.before) {
      const before = Cursor.parse(pagination.before)
      if (before.last_anchored_at) {
        return base((builder) =>
          builder
            .whereNull('last_anchored_at')
            .orWhere('last_anchored_at', '>', before.last_anchored_at)
        )
      } else {
        return base((builder) =>
          builder.where({ last_anchored_at: null }).andWhere('created_at', '>', before.created_at)
        )
      }
    } else {
      return base()
    }
  }

  private query<T = any>(queryBuilder: Knex.QueryBuilder): Promise<T> {
    const asSQL = queryBuilder.toSQL()
    return this.dataSource.query(asSQL.sql, asSQL.bindings as any[])
  }
}
