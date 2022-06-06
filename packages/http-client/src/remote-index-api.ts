import type { BaseQuery, IndexApi, Page, Pagination, StreamState } from '@ceramicnetwork/common'

export class RemoteIndexApi implements IndexApi {
  constructor(private readonly _apiUrl: string) {}

  async queryIndex(query: BaseQuery & Pagination): Promise<Page<StreamState>> {
    throw new Error(`NotImplemented: RemoteIndexApi::queryIndex`)
  }
}
