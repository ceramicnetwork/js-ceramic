import { DataSource } from 'typeorm'
import { StreamID } from 'streamid/lib/stream-id.js';
import type { BaseQuery, DatabaseIndexAPI, IndexStreamArgs, Page, Pagination } from '../types.js'
import { initTables } from '../postgres/init-tables.js';
import DeferredKeySelection from "knex";

export class PostgresIndexApi implements DatabaseIndexAPI {
  constructor(
    private readonly dataSource: any,
    private readonly modelsToIndex: Array<StreamID>
  ) {}

  async indexStream(args: IndexStreamArgs): Promise<void> {
    const tableName = `mid_${args.model}`.substring(0, 'mid_'.length + 10)

    console.log("Postgres Index API")
    return await this.dataSource(tableName).insert({
      stream_id: args.streamID,
      controller_did: args.controller,
      created_at: 'NOW()',
      updated_at: 'NOW()',
      last_updated_at: 'NOW()',
    }).then()

    /*return await this.dataSource.query(`
        INSERT INTO ${tableName} (stream_id, controller, created_at, updated_at)
        VALUES (${args.streamID}, ${args.controller}, NOW(), NOW());
    `)*/
  }
  page(query: BaseQuery & Pagination): Promise<Page<StreamID>> {
    throw new Error('Method not implemented.');
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
