import type { StreamID } from '@ceramicnetwork/streamid'
import type { BaseQuery, Pagination, Page, DiagnosticsLogger } from '@ceramicnetwork/common'
import type { Knex } from 'knex'
import type { DatabaseIndexApi, IndexModelArgs, IndexStreamArgs } from '../database-index-api.js'
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
  readonly modelsToIndex: Array<StreamID> = []

  constructor(
    private readonly dbConnection: Knex,
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
        stream_id: args.streamID.toString(),
        controller_did: args.controller.toString(),
        stream_content: args.streamContent.toString(),
        tip: args.tip.toString(),
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
      throw new IndexQueryNotAvailableError(query.model)
    }
    return this.insertionOrder.page(query)
  }

  async verifyTables(models: Array<StreamID>, tableStructure = validTableStructure): Promise<void> {
    await verifyTables(this.dbConnection, models, tableStructure)
  }

  async indexModels(models: Array<IndexModelArgs>): Promise<void> {
    const modelStreamIDs = models.map((args) => args.model)
    await initTables(this.dbConnection, modelStreamIDs, this.logger)
    await this.verifyTables(modelStreamIDs)
    this.modelsToIndex.push(...modelStreamIDs)
  }

  async close(): Promise<void> {
    await this.dbConnection.destroy()
  }
}
