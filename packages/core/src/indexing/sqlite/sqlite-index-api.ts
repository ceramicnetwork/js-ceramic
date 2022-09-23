import { StreamID } from '@ceramicnetwork/streamid'
import type { BaseQuery, Pagination, Page, DiagnosticsLogger } from '@ceramicnetwork/common'
import type { Knex } from 'knex'
import type { DatabaseIndexApi, IndexModelArgs, IndexStreamArgs } from '../database-index-api.js'
import { initConfigTables, initMidTables, verifyTables } from './init-tables.js'
import { asTableName } from '../as-table-name.util.js'
import { InsertionOrder } from './insertion-order.js'
import { IndexQueryNotAvailableError } from '../index-query-not-available.error.js'
import { INDEXED_MODEL_CONFIG_TABLE_NAME } from '../database-index-api.js'

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

  async verifyTables(models: Array<IndexModelArgs>): Promise<void> {
    await verifyTables(this.dbConnection, models)
  }

  async indexModels(models: Array<IndexModelArgs>): Promise<void> {
    await initMidTables(this.dbConnection, models, this.logger)
    await this.verifyTables(models)
    const now = asTimestamp(new Date())
    // FIXME: populate the updated_by field properly when auth is implemented
    this.dbConnection(INDEXED_MODEL_CONFIG_TABLE_NAME)
      .insert(models.map(indexModelArgs => {
        return {
          model: indexModelArgs.model,
          updated_by: "<FIXME: PUT ADMIN DID WHEN AUTH IS IMPLEMENTED>"
        }
      }))
      .onConflict('model')
      .merge({
        updated_at: now,
      })
    const modelStreamIDs = models.map((args) => args.model)
    this.modelsToIndex.push(...modelStreamIDs)
  }

  async stopIndexingModels(models: Array<StreamID>): Promise<void> {
    const now = asTimestamp(new Date())
    // FIXME: populate the updated_by field properly when auth is implemented
    this.dbConnection(INDEXED_MODEL_CONFIG_TABLE_NAME)
      .insert(models.map(model => {
        return {
          model: model.toString(),
          is_indexed: false,
          updated_by: "<FIXME: PUT ADMIN DID WHEN AUTH IS IMPLEMENTED>"
        }
      }))
      .onConflict('model')
      .merge({
        updated_at: now,
        updated_by: "<FIXME: PUT ADMIN DID WHEN AUTH IS IMPLEMENTED>"
      })
    for (let i = this.modelsToIndex.length - 1; i >= 0; i--) {
      if (models.includes(this.modelsToIndex[i])) {
        this.modelsToIndex.splice(i, 1)
      }
    }
  }

  async init(): Promise<void> {
    await initConfigTables(this.dbConnection, this.logger)
    this.modelsToIndex.concat(
      (await this.dbConnection(INDEXED_MODEL_CONFIG_TABLE_NAME)
        .select('model')
        .where({
          is_indexed: true
        }) as Array<string>
      ).map(modelIDString => { return StreamID.fromString(modelIDString) })
    )
  }

  async close(): Promise<void> {
    await this.dbConnection.destroy()
  }
}
