import type { BaseQuery, IndexApi, Page, Pagination, StreamState } from '@ceramicnetwork/common'

export class RemoteIndexApi implements IndexApi {
  queryIndex(query: BaseQuery & Pagination): Promise<Page<StreamState>> {
    throw new Error(`NotImplemented: RemoteIndexApi::queryIndex`)
  }
}
