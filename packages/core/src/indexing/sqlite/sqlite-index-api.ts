import { DataSource } from 'typeorm'
import { StreamID } from '@ceramicnetwork/streamid'
import type { BaseQuery, DatabaseIndexAPI, IndexStreamArgs, Page, Pagination } from '../types.js'
import { initTables } from './init-tables.js'
import { asTableName } from '../as-table-name.util.js'
import {
  ForwardPaginationQuery,
  PaginationKind,
  PaginationQuery,
  parsePagination,
} from '../parse-pagination'
import * as uint8arrays from 'uint8arrays'
import type { Knex } from 'knex'

export class UnavailablePlaceholderError extends Error {
  constructor(variableName: string) {
    super(`Can not find variable ${variableName} for a placeholder`)
  }
}
export function withPlaceholder(
  query: string,
  variables: Record<string, any>
): [string, Array<any>] {
  const entries = query.match(/:\w+/g)
  const placeholders: Array<any> = []
  let resultQuery = query
  for (const entry of entries) {
    resultQuery = resultQuery.replace(entry, '?')
    const variableName = entry.replace(/^:/, '')
    if (!(variableName in variables)) {
      throw new UnavailablePlaceholderError(variableName)
    }
    const variableValue = variables[variableName]
    placeholders.push(variableValue)
  }
  return [resultQuery, placeholders]
}

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

class Cursor {
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
    const tableName = asTableName(query.model)
    const pagination = parsePagination(query)
    const now = new Date()
    const future = new Date(now.getFullYear(), now.getMonth())
    let response: Array<{ stream_id: string; last_anchored_at: number; created_at: number }> = []
    if (pagination.kind === PaginationKind.FORWARD) {
      const limit = pagination.first
      response = await this.knexQuery(this.forwardQuery(query, pagination))
      const [init, last] = [response.slice(0, limit), response.slice(limit, limit + 1)]
      const streamIds = init.map((row) => StreamID.fromString(row.stream_id))
      const lastEntry = init[init.length - 1]
      const endCursor = lastEntry
        ? { created_at: lastEntry.created_at, last_anchored_at: lastEntry.last_anchored_at }
        : undefined
      const startEntry = init[0]
      const startCursor = startEntry
        ? { created_at: startEntry.created_at, last_anchored_at: startEntry.last_anchored_at }
        : undefined
      return {
        entries: streamIds,
        pageInfo: {
          hasNextPage: last.length > 0,
          hasPreviousPage: false,
          endCursor: Cursor.stringify(endCursor),
          startCursor: Cursor.stringify(startCursor),
        },
      }
    }
    if (pagination.kind === PaginationKind.BACKWARD) {
      const limit = pagination.last
      if (pagination.before) {
        const before = Cursor.parse(pagination.before)
        if (before.last_anchored_at) {
          response = await this.query(
            `
          SELECT * FROM (SELECT stream_id, last_anchored_at, created_at FROM ${tableName}
          WHERE IFNULL(last_anchored_at, :last_anchored_at_max) > :last_anchored_at
          ORDER BY IFNULL(last_anchored_at, :last_anchored_at_max) ASC, created_at ASC LIMIT :limit) ORDER BY IFNULL(last_anchored_at, :last_anchored_at_max) DESC, created_at DESC`,
            {
              last_anchored_at_max: future.valueOf(),
              last_anchored_at: before.last_anchored_at,
              limit: limit + 1,
            }
          )
        } else {
          response = await this.query(
            `
          SELECT * FROM
            (SELECT stream_id, last_anchored_at, created_at FROM ${tableName}
            WHERE last_anchored_at IS NULL and created_at > :created_at
            ORDER BY IFNULL(last_anchored_at, :last_anchored_at_max) ASC, created_at ASC
            LIMIT :limit)
          ORDER BY IFNULL(last_anchored_at, :last_anchored_at_max) DESC, created_at DESC`,
            {
              created_at: before.created_at,
              last_anchored_at_max: future.valueOf(),
              limit: limit + 1,
            }
          )
        }
      } else {
        response = await this.query(
          `
        SELECT * FROM
          (SELECT stream_id, last_anchored_at, created_at FROM ${tableName}
          ORDER BY IFNULL(last_anchored_at, :last_anchored_at_max) ASC, created_at ASC
          LIMIT :limit)
        ORDER BY IFNULL(last_anchored_at, :last_anchored_at_max) DESC, created_at DESC`,
          {
            last_anchored_at_max: future.valueOf(),
            limit: limit + 1,
          }
        )
      }
      const [first, tail] = [response.slice(-limit - 1, -limit), response.slice(-limit)]
      const streamIds = tail.map((row) => StreamID.fromString(row.stream_id))
      const lastEntry = tail[tail.length - 1]
      const endCursor = lastEntry
        ? { created_at: lastEntry.created_at, last_anchored_at: lastEntry.last_anchored_at }
        : undefined
      const startEntry = tail[0]
      const startCursor = startEntry
        ? { created_at: startEntry.created_at, last_anchored_at: startEntry.last_anchored_at }
        : undefined
      return {
        entries: streamIds,
        pageInfo: {
          hasPreviousPage: first.length > 0,
          hasNextPage: false,
          endCursor: Cursor.stringify(endCursor),
          startCursor: Cursor.stringify(startCursor),
        },
      }
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
      .select(['stream_id', 'last_anchored_at', 'created_at'])
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

  private knexQuery<T = any>(queryBuilder: Knex.QueryBuilder): Promise<T> {
    const asSQL = queryBuilder.toSQL()
    return this.dataSource.query(asSQL.sql, asSQL.bindings as any[])
  }

  private query<T = any>(query: string, variables: Record<string, any>): Promise<T> {
    return this.dataSource.query(...withPlaceholder(query, variables)) as Promise<T>
  }
}
