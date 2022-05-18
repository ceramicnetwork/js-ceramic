import type { BaseQuery, DatabaseIndexAPI, IndexStreamArgs, Page, Pagination } from './types'
import type { StreamID } from '@ceramicnetwork/streamid'

export class NotImplementedError extends Error {
  constructor(name: string) {
    super(`NOT IMPLEMENTED: ${name}`)
  }
}

export class SqliteIndexApi implements DatabaseIndexAPI {
  indexStream(args: IndexStreamArgs): Promise<void> {
    throw new NotImplementedError(`SqliteIndexApi::indexStream`)
  }

  page(query: BaseQuery & Pagination): Promise<Page<StreamID>> {
    throw new NotImplementedError(`SqliteIndexApi::page`)
  }
}
