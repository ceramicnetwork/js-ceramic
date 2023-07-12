import { type Knex } from 'knex'
import * as uint8arrays from 'uint8arrays'
import { StreamID } from '@ceramicnetwork/streamid'
import type { BaseQuery, Page, Pagination, SortOrder } from '@ceramicnetwork/common'
import {
  BackwardPaginationQuery,
  ForwardPaginationQuery,
  PaginationKind,
  parsePagination,
} from './parse-pagination.js'
import { asTableName } from './as-table-name.util.js'
import { UnsupportedOrderingError } from './unsupported-ordering-error.js'
import { addColumnPrefix } from './column-name.util.js'
import { contentKey, convertQueryFilter, DATA_FIELD } from './query-filter-converter.js'
import { parseQueryFilters } from './query-filter-parser.js'

type SelectedRequired = { stream_id: string; last_anchored_at: number; created_at: number }
type SelectedOptional = Record<string, boolean | number | string>
type Selected = SelectedRequired & SelectedOptional
type QueryFunc = (bldr: Knex.QueryBuilder<any, any>) => Knex.QueryBuilder<any, any>

/**
 * Contains functions to transform (parse and stringify) GraphQL cursors
 * as per [GraphQL Cursor Connections Spec](https://relay.dev/graphql/connections.htm).
 *
 * A cursor for insertion order is a JSON having `created_at` field as number.
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

const REVERSE_ORDER: Record<SortOrder, SortOrder> = {
  ASC: 'DESC',
  DESC: 'ASC',
}

/**
 * Reverse ASC to DESC, and DESC to ASC in an order clause.
 */
function reverseOrder<T extends { order: string }>(entries: Array<T>): Array<T> {
  return entries.map((entry) => ({ ...entry, order: REVERSE_ORDER[entry.order] }))
}

const INSERTION_ORDER = [{ column: 'created_at', order: 'ASC' as const }]

/**
 * Insertion order: created_at DESC.
 */
export class InsertionOrder {
  constructor(private readonly dbConnection: Knex) {}

  async page(query: BaseQuery & Pagination): Promise<Page<StreamID>> {
    const pagination = parsePagination(query)
    const paginationKind = pagination.kind
    switch (paginationKind) {
      case PaginationKind.FORWARD: {
        const limit = pagination.first
        const response: Array<Selected> = await this.forwardQuery(query, pagination)
        const entries = response.slice(0, limit)
        const firstEntry = entries[0]
        const lastEntry = entries[entries.length - 1]
        return {
          edges: entries.map((row) => {
            return {
              cursor: Cursor.stringify(asInsertionCursor(row)),
              node: StreamID.fromString(row.stream_id),
            }
          }),
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
        const response: Array<Selected> = await this.backwardQuery(query, pagination)
        const entries = response.slice(-limit)
        const firstEntry = entries[0]
        const lastEntry = entries[entries.length - 1]
        return {
          edges: entries.map((row) => {
            return {
              cursor: Cursor.stringify(asInsertionCursor(row)),
              node: StreamID.fromString(row.stream_id),
            }
          }),
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

  /**
   * Forward query: traverse from the most recent to the last.
   */
  private forwardQuery(
    query: BaseQuery,
    pagination: ForwardPaginationQuery
  ): Knex.QueryBuilder<unknown, Array<Selected>> {
    const tableName = asTableName(query.model)
    const queryFunc = this.query(query, false)
    let base = queryFunc(this.dbConnection.from(tableName)).limit(pagination.first + 1)
    if (pagination.after) {
      const after = Cursor.parse(pagination.after)
      base = base.where('created_at', '>', after.created_at)
    }
    return base
  }

  /**
   * Backward query: traverse from the last to the most recent.
   */
  private backwardQuery(
    query: BaseQuery,
    pagination: BackwardPaginationQuery
  ): Knex.QueryBuilder<unknown, Array<Selected>> {
    const tableName = asTableName(query.model)
    const queryFunc = this.query(query, true)
    return this.dbConnection
      .select('*')
      .from((bldr) => {
        let subquery = queryFunc(bldr.from(tableName)).limit(pagination.last + 1)
        if (pagination.before) {
          const before = Cursor.parse(pagination.before)
          subquery = subquery.where('created_at', '<', before.created_at)
        }
        return subquery.as('T')
      })
      .orderBy(INSERTION_ORDER)
  }

  private query(query: BaseQuery, isReverseOrder: boolean): QueryFunc {
    let converted = null
    if (query.queryFilters) {
      const parsed = parseQueryFilters(query.queryFilters)
      converted = convertQueryFilter(parsed)
    }
    return (bldr) => {
      let base = bldr.columns(['stream_id', 'last_anchored_at', 'created_at', DATA_FIELD]).select()

      if (converted) {
        base = base.where(converted.where)
      }

      for (const [field, order] of Object.entries(query.sorting ?? {})) {
        const applyOrder = isReverseOrder ? REVERSE_ORDER[order] : order
        base = base.orderByRaw(`${contentKey(field)} ${applyOrder}`)
      }
      base = base.orderBy(isReverseOrder ? reverseOrder(INSERTION_ORDER) : INSERTION_ORDER)

      if (query.account) {
        base = base.where({ controller_did: query.account })
      }
      if (query.filter) {
        for (const [key, value] of Object.entries(query.filter)) {
          const filterObj = {}
          filterObj[addColumnPrefix(key)] = value
          base = base.andWhere(filterObj)
        }
      }

      return base
    }
  }
}
