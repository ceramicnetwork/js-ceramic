import type { BaseQuery, IndexApi, Page, Pagination, StreamState } from '@ceramicnetwork/common'
import { StreamUtils, fetchJson } from '@ceramicnetwork/common'

/**
 * IndexAPI implementation on top of HTTP endpoint.
 */
export class RemoteIndexApi implements IndexApi {
  // Stored as a member to make it easier to inject a mock in unit tests
  private readonly _fetchJson: typeof fetchJson = fetchJson
  private readonly _collectionURL: URL

  constructor(apiUrl: URL) {
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
    const str = queryURL.toString()
    console.log(str)
    const response = await this._fetchJson(queryURL)
    const edges = response.edges.map((e) => {
      return {
        cursor: e.cursor,
        node: StreamUtils.deserializeState(e.node),
      }
    })
    return {
      edges: edges,
      pageInfo: response.pageInfo,
    }
  }
}
