import { DataSource } from 'typeorm'
import { StreamID } from '@ceramicnetwork/streamid'
import type { BaseQuery, DatabaseIndexAPI, IndexStreamArgs, Page, Pagination } from '../types.js'
import { initTables } from './init-tables.js'
import { asTableName } from '../as-table-name.util.js'
import { PaginationKind, parsePagination } from '../parse-pagination'
import * as uint8arrays from 'uint8arrays'

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

export class SqliteIndexApi implements DatabaseIndexAPI {
  constructor(
    private readonly dataSource: DataSource,
    private readonly modelsToIndex: Array<StreamID>
  ) {}

  async indexStream(args: IndexStreamArgs & { createdAt?: Date; updatedAt?: Date }): Promise<void> {
    const tableName = asTableName(args.model)
    const now = asTimestamp(new Date())
    const createdAt = asTimestamp(args.createdAt) || now
    const updatedAt = asTimestamp(args.updatedAt) || now
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
        createdAt,
        updatedAt,
        lastAnchoredAt,
        updatedAt,
      ]
    )
  }

  async page(query: BaseQuery & Pagination): Promise<Page<StreamID>> {
    const pagination = parsePagination(query)
    const limit = pagination.kind == PaginationKind.FORWARD ? pagination.first : pagination.last
    const now = new Date()
    const future = new Date(now.getFullYear(), now.getMonth())
    let response: Array<{ stream_id: string; last_anchored_at: number; created_at: number }> = []
    if (pagination.kind === PaginationKind.FORWARD) {
      if (!pagination.after) {
        response = await this.dataSource.query(
          `SELECT stream_id, last_anchored_at, created_at FROM ${asTableName(
            query.model
          )} ORDER BY IFNULL(last_anchored_at, ?) DESC, created_at DESC LIMIT ?`,
          [future.valueOf(), limit + 1]
        )
      } else {
        const after = JSON.parse(
          uint8arrays.toString(uint8arrays.fromString(pagination.after, 'base64url'))
        )
        if (after.last_anchored_at) {
          response = await this.dataSource.query(
            `SELECT stream_id, last_anchored_at, created_at FROM ${asTableName(query.model)}
           WHERE last_anchored_at < ?
           ORDER BY IFNULL(last_anchored_at, ?) DESC, created_at DESC LIMIT ?
          `,
            [after.last_anchored_at, future.valueOf(), limit + 1]
          )
        } else {
          response = await this.dataSource.query(
            `SELECT stream_id, last_anchored_at, created_at FROM ${asTableName(query.model)}
           WHERE (last_anchored_at IS NULL AND created_at < ?) OR (last_anchored_at IS NOT NULL)
           ORDER BY IFNULL(last_anchored_at, ?) DESC, created_at DESC LIMIT ?
          `,
            [after.created_at, future.valueOf(), limit + 1]
          )
        }
      }
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
          endCursor: endCursor
            ? uint8arrays.toString(uint8arrays.fromString(JSON.stringify(endCursor)), 'base64url')
            : undefined,
          startCursor: startCursor
            ? uint8arrays.toString(uint8arrays.fromString(JSON.stringify(startCursor)), 'base64url')
            : undefined,
        },
      }
    }
    if (pagination.kind === PaginationKind.BACKWARD) {
      if (pagination.before) {
        const before = JSON.parse(
          uint8arrays.toString(uint8arrays.fromString(pagination.before, 'base64url'))
        )
        if (before.last_anchored_at) {
          response = await this.dataSource.query(
            `SELECT * FROM (SELECT stream_id, last_anchored_at, created_at FROM ${asTableName(
              query.model
            )}
            WHERE IFNULL(last_anchored_at, ?) > ?
            ORDER BY IFNULL(last_anchored_at, ?) ASC, created_at ASC LIMIT ?) ORDER BY IFNULL(last_anchored_at, ?) DESC, created_at DESC`,
            [
              future.valueOf(),
              before.last_anchored_at,
              future.valueOf(),
              limit + 1,
              future.valueOf(),
            ]
          )
        } else {
          response = await this.dataSource.query(
            `SELECT * FROM (SELECT stream_id, last_anchored_at, created_at FROM ${asTableName(
              query.model
            )}
            WHERE last_anchored_at IS NULL and created_at > ?
            ORDER BY IFNULL(last_anchored_at, ?) ASC, created_at ASC LIMIT ?) ORDER BY IFNULL(last_anchored_at, ?) DESC, created_at DESC`,
            [before.created_at, future.valueOf(), limit + 1, future.valueOf()]
          )
        }
      } else {
        response = await this.dataSource.query(
          `SELECT * FROM (SELECT stream_id, last_anchored_at, created_at FROM ${asTableName(
            query.model
          )} ORDER BY IFNULL(last_anchored_at, ?) ASC, created_at ASC LIMIT ?) ORDER BY IFNULL(last_anchored_at, ?) DESC, created_at DESC`,
          [future.valueOf(), limit + 1, future.valueOf()]
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
          endCursor: endCursor
            ? uint8arrays.toString(uint8arrays.fromString(JSON.stringify(endCursor)), 'base64url')
            : undefined,
          startCursor: startCursor
            ? uint8arrays.toString(uint8arrays.fromString(JSON.stringify(startCursor)), 'base64url')
            : undefined,
        },
      }
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
