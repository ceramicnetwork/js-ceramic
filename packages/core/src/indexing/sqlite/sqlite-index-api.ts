import { DataSource } from 'typeorm'
import type { StreamID } from '@ceramicnetwork/streamid'
import { NotImplementedError } from '../not-implemented-error.js'
import type { BaseQuery, DatabaseIndexAPI, IndexStreamArgs, Page, Pagination } from '../types.js'
import { initTables } from './init-tables.js'

export class SqliteIndexApi implements DatabaseIndexAPI {
  constructor(readonly dataSource: DataSource, readonly modelsToIndex: Array<StreamID>) {}

  indexStream(args: IndexStreamArgs): Promise<void> {
    throw new NotImplementedError(`SqliteIndexApi::indexStream`)
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
}
