import type { BaseQuery, IndexApi, Page, Pagination, StreamState } from '@ceramicnetwork/common'
import type { DatabaseIndexApi } from './database-index-api.js'
import { NotImplementedError } from './not-implemented-error.js'

export class LocalIndexApi implements IndexApi {
  constructor(private readonly databaseIndexApi: DatabaseIndexApi | undefined) {}

  queryIndex(query: BaseQuery & Pagination): Promise<Page<StreamState>> {
    throw new NotImplementedError('IndexApi::queryIndex')
  }

  async init(): Promise<void> {
    await this.databaseIndexApi.init()
  }
}
