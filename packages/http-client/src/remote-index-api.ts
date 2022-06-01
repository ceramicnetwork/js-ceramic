import type {
  BaseQuery,
  IndexClientApi,
  Page,
  Pagination,
  StreamState,
} from '@ceramicnetwork/common'

export class RemoteIndexApi implements IndexClientApi {
  queryIndex(query: BaseQuery & Pagination): Promise<Page<StreamState>> {
    throw new Error(`NotImplemented: RemoteIndexApi::queryIndex`)
  }
}
