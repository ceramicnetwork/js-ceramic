import type { BaseQuery, IndexApi, Page, Pagination, StreamState } from '@ceramicnetwork/common'
import { StreamUtils, fetchJson } from '@ceramicnetwork/common'

/**
 * IndexAPI implementation on top of HTTP endpoint.
 */
export class RemoteIndexApi implements IndexApi {
  private readonly _collectionURL: URL

  constructor(apiUrl: URL, private readonly fetchJsonFn: typeof fetchJson = fetchJson) {
    this._collectionURL = new URL('./collection', apiUrl)
  }

  /**
   * Issue a query to `/collection` endpoint.
   */
  async queryIndex(query: BaseQuery & Pagination): Promise<Page<StreamState>> {
    const queryURL = new URL(this._collectionURL)
    for (const key in query) {
      queryURL.searchParams.set(key, query[key])
    }
    const response = await this.fetchJsonFn(queryURL)
    const entries = response.entries.map(StreamUtils.deserializeState)
    return {
      entries: entries,
      pageInfo: response.pageInfo,
    }
  }
}
