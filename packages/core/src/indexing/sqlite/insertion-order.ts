import type { Knex } from 'knex'
import type { DataSource } from 'typeorm'
import * as uint8arrays from 'uint8arrays'
import { StreamID } from '@ceramicnetwork/streamid'
import type { BaseQuery, Page, Pagination } from '@ceramicnetwork/common'
import {
  BackwardPaginationQuery,
  ForwardPaginationQuery,
  PaginationKind,
  parsePagination,
} from '../parse-pagination.js'
import { asTableName } from '../as-table-name.util.js'
import { UnsupportedOrderingError } from '../unsupported-ordering-error.js'

type Selected = { stream_id: string; last_anchored_at: number; created_at: number }

/**
 * Contains functions to transform (parse and stringify) GraphQL cursors
 * as per [GraphQL Cursor Connections Spec](https://relay.dev/graphql/connections.htm).
 *
 * A cursor for SQLite insertion order is a JSON having `created_at` field as number.
 */
abstract class Cursor {
  /**
   * Decode cursor from base64url as JSON.
   */
  static parse(cursor: string): any {
    return JSON.parse(uint8arrays.toString(uint8arrays.fromString(cursor, 'base64url')))
  }

  /**
   * base64url-encode cursor from +input+ object.
   * Return `undefined` if +input+ object is `undefined` or `null`.
   */
  static stringify(input: any): string | undefined {
    if (input) {
      return uint8arrays.toString(uint8arrays.fromString(JSON.stringify(input)), 'base64url')
    } else {
      return undefined
    }
  }
}

/**
 * Prepare insertion cursor.
 */
function asInsertionCursor(input: { created_at: number } | undefined) {
  if (!input) return undefined
  return { created_at: input.created_at }
}

const REVERSE_ORDER = {
  ASC: 'DESC',
  DESC: 'ASC',
}

/**
 * Reverse ASC to DESC, and DESC to ASC in an order clause.
 */
function reverseOrder<T extends { order: string }>(entries: Array<T>): Array<T> {
  return entries.map((entry) => ({ ...entry, order: REVERSE_ORDER[entry.order] }))
}

const INSERTION_ORDER = [{ column: 'created_at', order: 'DESC' }]

/**
 * Insertion order: created_at DESC.
 */
export class InsertionOrder {
  constructor(private readonly dataSource: DataSource, private readonly knexConnection: Knex) {}

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
            endCursor: Cursor.stringify(asInsertionCursor(lastEntry)),
            startCursor: Cursor.stringify(asInsertionCursor(firstEntry)),
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
            endCursor: Cursor.stringify(asInsertionCursor(lastEntry)),
            startCursor: Cursor.stringify(asInsertionCursor(firstEntry)),
          },
        }
      }
      default:
        throw new UnsupportedOrderingError(paginationKind)
    }
  }

  private forwardQuery(query: BaseQuery, pagination: ForwardPaginationQuery): Knex.QueryBuilder {
    const tableName = asTableName(query.model)
    let base = this.knexConnection
      .from(tableName)
      .select('stream_id', 'last_anchored_at', 'created_at')
      .orderBy(INSERTION_ORDER)
      .limit(pagination.first + 1)
    if (query.account) {
      base = base.where({ controller_did: query.account })
    }
    if (pagination.after) {
      const after = Cursor.parse(pagination.after)
      return base.where('created_at', '<', after.created_at)
    }
    return base
    // throw new NotImplementedError('forwardQuery')
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
        .from((builder) => {
          let subquery = builder
            .from(tableName)
            .select('stream_id', 'last_anchored_at', 'created_at')
            .orderBy(reverseOrder(INSERTION_ORDER))
            .limit(limit + 1) // To know if we have more entries to query
          if (query.account) {
            subquery = subquery.where({ controller_did: query.account })
          }
          return withWhereCallback(subquery)
        })
        .orderBy(INSERTION_ORDER)
    }
    if (pagination.before) {
      const before = Cursor.parse(pagination.before)
      return base((builder) => builder.where('created_at', '>', before.created_at))
    } else {
      return base()
    }
  }

  /**
   * Execute a query against a database.
   */
  private query<T = any>(queryBuilder: Knex.QueryBuilder): Promise<T> {
    const asSQL = queryBuilder.toSQL()
    return this.dataSource.query(asSQL.sql, asSQL.bindings as any[])
  }
}
