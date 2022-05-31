import { DataSource } from 'typeorm'
import type { StreamID } from '@ceramicnetwork/streamid'
import { NotImplementedError } from '../not-implemented-error.js'
import type { BaseQuery, DatabaseIndexAPI, IndexStreamArgs, Page, Pagination } from '../types.js'
import { initTables } from './init-tables.js'
import { asTableName } from '../as-table-name.util.js'

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

  page(query: BaseQuery & Pagination): Promise<Page<StreamID>> {
    throw new NotImplementedError(`SqliteIndexApi::page`)
  }

  async init(): Promise<void> {
    if (!this.dataSource.isInitialized) {
      await this.dataSource.initialize()
    }
    await initTables(this.dataSource, this.modelsToIndex)
  }

  async close(): Promise<void> {
    await this.dataSource.destroy()   
  }
}
