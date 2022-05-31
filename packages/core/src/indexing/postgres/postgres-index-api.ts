import { DataSource } from 'typeorm'
import { StreamID } from 'streamid/lib/stream-id.js';
import type { BaseQuery, DatabaseIndexAPI, IndexStreamArgs, Page, Pagination } from '../types.js'
import { initTables } from '../postgres/init-tables.js';

export class PostgresIndexApi implements DatabaseIndexAPI {
  constructor(
    private readonly dataSource: DataSource,
    private readonly modelsToIndex: Array<StreamID>
  ) {}

  indexStream(args: IndexStreamArgs): Promise<void> {
    throw new Error('Method not implemented.');
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
