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

type StreamContent = Record<string, boolean | number | string>
type QueryResult = {
  stream_id: string
  last_anchored_at: number
  created_at: number
  stream_content: string
}
type QueryFunc = (bldr: Knex.QueryBuilder<any, any>) => Knex.QueryBuilder<any, any>
type CursorData<Content extends StreamContent = StreamContent> = { id: string } & (
  | { type: 'timestamp'; value: number }
  | { type: 'content'; value: Content }
)

/**
 * Contains functions to transform (parse and stringify) GraphQL cursors
 * as per [GraphQL Cursor Connections Spec](https://relay.dev/graphql/connections.htm).
 *
 * A cursor for insertion order is a JSON having `created_at` field as number.
 */
abstract class Cursor {
  /**
   * Decode cursor from base64url as JSON.
   * Return `undefined` if +cursor+ is `undefined` or `null`.
   */
  static parse<Content extends StreamContent = StreamContent>(
    cursor: string | undefined
  ): CursorData<Content> {
    return cursor
      ? JSON.parse(uint8arrays.toString(uint8arrays.fromString(cursor, 'base64url')))
      : undefined
  }

  /**
   * base64url-encode cursor from +input+ object.
   * Return `undefined` if +input+ object is `undefined` or `null`.
   */
  static stringify(
    input: QueryResult | undefined,
    orderByKeys: Array<string> = []
  ): string | undefined {
    if (input == null) {
      return undefined
    }

    let cursor: CursorData
    if (orderByKeys.length === 0) {
      // Use `created_at` field
      cursor = { type: 'timestamp', id: input.stream_id, value: input.created_at }
    } else {
      // Use custom content fields
      const content = JSON.parse(input.stream_content)
      cursor = orderByKeys.reduce(
        (acc, key) => {
          if (content[key] != null) {
            acc.value[key] = content[key]
          }
          return acc
        },
        { type: 'content', id: input.stream_id, value: {} }
      )
    }

    return uint8arrays.toString(uint8arrays.fromString(JSON.stringify(cursor)), 'base64url')
  }
}

const REVERSE_ORDER: Record<SortOrder, SortOrder> = {
  ASC: 'DESC',
  DESC: 'ASC',
}

type ComparisonSign = '>' | '<'

function getComparisonSign(order: SortOrder = 'ASC', reverse: boolean = false): ComparisonSign {
  return order === 'ASC' ? (reverse ? '<' : '>') : reverse ? '>' : '<'
}

/**
 * Reverse ASC to DESC, and DESC to ASC in an order clause.
 */
function reverseOrder<T extends { order: SortOrder }>(entries: Array<T>): Array<T> {
  return entries.map((entry) => ({ ...entry, order: REVERSE_ORDER[entry.order] }))
}

const INSERTION_ORDER = [{ column: 'created_at', order: 'ASC' as const }]

/**
 * Insertion order: created_at DESC.
 */
export class InsertionOrder {
  constructor(private readonly dbConnection: Knex) {}

  async page(query: BaseQuery & Pagination): Promise<Page<StreamID>> {
    const orderByKeys = Object.keys(query.sorting ?? {})
    const pagination = parsePagination(query)
    const paginationKind = pagination.kind
    switch (paginationKind) {
      case PaginationKind.FORWARD: {
        const limit = pagination.first
        const response: Array<QueryResult> = await this.forwardQuery(query, pagination)
        const entries = response.slice(0, limit)
        const firstEntry = entries[0]
        const lastEntry = entries[entries.length - 1]
        return {
          edges: entries.map((row) => {
            return {
              cursor: Cursor.stringify(row, orderByKeys),
              node: StreamID.fromString(row.stream_id),
            }
          }),
          pageInfo: {
            hasNextPage: response.length > limit,
            hasPreviousPage: false,
            endCursor: Cursor.stringify(lastEntry, orderByKeys),
            startCursor: Cursor.stringify(firstEntry, orderByKeys),
          },
        }
      }
      case PaginationKind.BACKWARD: {
        const limit = pagination.last
        const response: Array<QueryResult> = await this.backwardQuery(query, pagination)
        // Reverse response as results are returned in descending order
        response.reverse()
        const entries = response.slice(-limit)
        const firstEntry = entries[0]
        const lastEntry = entries[entries.length - 1]
        return {
          edges: entries.map((row) => {
            return {
              cursor: Cursor.stringify(row, orderByKeys),
              node: StreamID.fromString(row.stream_id),
            }
          }),
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: response.length > limit,
            endCursor: Cursor.stringify(lastEntry, orderByKeys),
            startCursor: Cursor.stringify(firstEntry, orderByKeys),
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
  ): Knex.QueryBuilder<unknown, Array<QueryResult>> {
    const tableName = asTableName(query.model)
    const queryFunc = this.query(query, false, Cursor.parse(pagination.after))
    return queryFunc(this.dbConnection.from(tableName)).limit(pagination.first + 1)
  }

  /**
   * Backward query: traverse from the last to the most recent.
   */
  private backwardQuery(
    query: BaseQuery,
    pagination: BackwardPaginationQuery
  ): Knex.QueryBuilder<unknown, Array<QueryResult>> {
    const tableName = asTableName(query.model)
    const queryFunc = this.query(query, true, Cursor.parse(pagination.before))
    return queryFunc(this.dbConnection.from(tableName)).limit(pagination.last + 1)
  }

  private query(query: BaseQuery, isReverseOrder: boolean, cursor?: CursorData): QueryFunc {
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

      // Handle cursor if present
      if (cursor != null) {
        if (cursor.type === 'timestamp') {
          // Paginate using the `created_at` field when no custom field ordering is provided
          base = base.where((qb) => {
            qb.where('created_at', isReverseOrder ? '<' : '>', cursor.value) // strict next value
              .orWhere('created_at', '=', cursor.value) // or current value
              .andWhere('stream_id', '>', cursor.id) // with stream ID tie-breaker
          })
        } else {
          // Paginate using previous values of custom fields
          for (const [key, prevValue] of Object.entries(cursor.value)) {
            const field = contentKey(key)
            const sign = getComparisonSign(query.sorting?.[key], isReverseOrder)
            const value = JSON.stringify(prevValue)
            base = base.where((qb) => {
              qb.whereRaw(`${field} ${sign} ${value}`) // strict next value
                .orWhereRaw(`${field} = ${value}`) // or current value
                .andWhere('stream_id', '>', cursor.id) // with stream ID tie-breaker
            })
          }
        }
      }

      // Handle ordering
      const sortingEntries = Object.entries(query.sorting ?? {})
      if (sortingEntries.length === 0) {
        // Order by insertion order (`created_at` field) as fallback
        base = base.orderBy(isReverseOrder ? reverseOrder(INSERTION_ORDER) : INSERTION_ORDER)
      } else {
        // Order by custom fields
        for (const [field, order] of sortingEntries) {
          const orderBy = isReverseOrder ? REVERSE_ORDER[order] : order
          base = base.orderByRaw(`${contentKey(field)} ${orderBy}`)
        }
      }
      // Always order by stream ID as tie-breaker
      base = base.orderBy('stream_id', 'asc')

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
