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

  constructor(apiUrl: URL) {
    this._collectionURL = new URL('./collection', apiUrl)
  }

  async count(query: BaseQuery): Promise<number> {
    throw new Error('Not implemented')
  }

  /**
   * Issue a query to `/collection` endpoint.
   */
  async query(query: PaginationQuery): Promise<Page<StreamState | null>> {
    const queryURL = new URL(this._collectionURL)
    serializeObjectToSearchParams(queryURL, { ...query, model: query.model.toString() }) // todo why did this become necessary?

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
