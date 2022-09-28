import type {
  BaseQuery,
  IndexApi,
  Page,
  PaginationQuery,
  StreamState,
} from '@ceramicnetwork/common'
import { StreamUtils, fetchJson } from '@ceramicnetwork/common'
import { serializeObjectToSearchParams } from './utils.js'

/**
 * IndexAPI implementation on top of HTTP endpoint.
 */
export class RemoteIndexApi implements IndexApi {
  // Stored as a member to make it easier to inject a mock in unit tests
  private readonly _fetchJson: typeof fetchJson = fetchJson
  private readonly _collectionURL: URL
  private readonly _countURL: URL

  constructor(apiUrl: URL) {
    this._collectionURL = new URL('./collection', apiUrl)
    this._countURL = new URL('./collection/count', apiUrl)
  }

  async count(query: BaseQuery): Promise<number> {
    const queryURL = serializeObjectToSearchParams(this._countURL, query)
    const response = await this._fetchJson(queryURL)
    return response.count
  }

  /**
   * Issue a query to `/collection` endpoint.
   */
  async query(query: PaginationQuery): Promise<Page<StreamState | null>> {
    const queryURL = serializeObjectToSearchParams(this._collectionURL, query)

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
