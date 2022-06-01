import type {
  BaseQuery,
  IndexClientApi,
  Page,
  Pagination,
  StreamState,
} from '@ceramicnetwork/common'
import type { DatabaseIndexApi } from './database-index-api.js'
import { NotImplementedError } from './not-implemented-error.js'

export class IndexApi implements IndexClientApi {
  constructor(private readonly databaseIndexApi: DatabaseIndexApi | undefined) {}

  queryIndex(query: BaseQuery & Pagination): Promise<Page<StreamState>> {
    throw new NotImplementedError('IndexApi::queryIndex')
  }
}
