import { DataSource } from 'typeorm'
import type { StreamID } from '@ceramicnetwork/streamid'
import { NotImplementedError } from './not-implemented-error.js'
import type { BaseQuery, DatabaseIndexAPI, IndexStreamArgs, Page, Pagination } from './types.js'

export class SqliteIndexApi implements DatabaseIndexAPI {
  constructor(readonly dataSource: DataSource) {}

  indexStream(args: IndexStreamArgs): Promise<void> {
    throw new NotImplementedError(`SqliteIndexApi::indexStream`)
  }

  page(query: BaseQuery & Pagination): Promise<Page<StreamID>> {
    throw new NotImplementedError(`SqliteIndexApi::page`)
  }

  async init(): Promise<void> {
    await this.dataSource.initialize()
  }
}
