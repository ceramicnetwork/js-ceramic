import type { StreamID } from '@ceramicnetwork/streamid'
import type { BaseQuery, Pagination, Page, DiagnosticsLogger } from '@ceramicnetwork/common'
import type { Knex } from 'knex'
import type { DatabaseIndexApi, IndexStreamArgs } from '../database-index-api.js'
import { initTables, verifyTables } from './init-tables.js'
import { asTableName } from '../as-table-name.util.js'
import { InsertionOrder } from './insertion-order.js'
import { IndexQueryNotAvailableError } from '../index-query-not-available.error.js'
import { validTableStructure } from './migrations/mid-schema-verfication.js'

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
  readonly insertionOrder: InsertionOrder

  constructor(
    private readonly dbConnection: Knex,
    readonly modelsToIndex: Array<StreamID>,
    private readonly allowQueriesBeforeHistoricalSync: boolean,
    private logger: DiagnosticsLogger
  ) {
    this.insertionOrder = new InsertionOrder(dbConnection)
  }

  public getActiveModelsToIndex(): Array<StreamID> {
    /**
     * Helper function to return array of active models that are currently being indexed by node
     * as defined in the config file.
     * TODO: extend to runtime check once adminAPI unlocks to add and load models on the fly
     */
    return this.modelsToIndex
  }

  async indexStream(args: IndexStreamArgs & { createdAt?: Date; updatedAt?: Date }): Promise<void> {
    const tableName = asTableName(args.model)
    const now = asTimestamp(new Date())

    await this.dbConnection(tableName)
      .insert({
        stream_id: String(args.streamID),
        controller_did: String(args.controller),
        last_anchored_at: asTimestamp(args.lastAnchor),
        first_anchored_at: asTimestamp(args.firstAnchor),
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
    // TODO(NET-1630) Throw if historical indexing is in progress
    if (!this.allowQueriesBeforeHistoricalSync) {
      throw new IndexQueryNotAvailableError(query.models[0])
    }
    return this.insertionOrder.page(query)
  }

  async verify(validTableStructure: object): Promise<void> {
    await verifyTables(this.dbConnection, this.modelsToIndex, validTableStructure)
  }

  async init(): Promise<void> {
    await initTables(this.dbConnection, this.modelsToIndex, this.logger)
    await this.verify(validTableStructure)
  }

  async close(): Promise<void> {
    await this.dbConnection.destroy()
  }
}
