import type {
  BaseQuery,
  IndexApi,
  Page,
  Pagination,
  StreamState,
  DiagnosticsLogger,
} from '@ceramicnetwork/common'
import { SyncOptions } from '@ceramicnetwork/common'
import type { DatabaseIndexApi } from './database-index-api.js'
import type { Repository } from '../state-management/repository.js'
import {IndexStreamArgs} from "./database-index-api.js";

/**
 * API to query an index.
 */
export class LocalIndexApi implements IndexApi {
  constructor(
    private readonly databaseIndexApi: DatabaseIndexApi | undefined,
    private readonly repository: Repository,
    private readonly logger: DiagnosticsLogger
  ) {}

  /**
   * Add stream to index in appropriate model table
   * @param args
   */
  async indexStream(args: IndexStreamArgs): Promise<void> {
      this.databaseIndexApi.indexStream(args)
  }

  /**
   * Query the index. Ask an indexing database for a list of StreamIDs,
   * and convert them to corresponding StreamState instances via `Repository::streamState`.
   *
   * We assume that a state store always contains StreamState for an indexed stream.
   */
  async queryIndex(query: BaseQuery & Pagination): Promise<Page<StreamState>> {
    if (this.databaseIndexApi) {
      const page = await this.databaseIndexApi.page(query)
      const streamStates = await Promise.all(
        // For database queries we bypass the stream cache and repository loading queue
        page.entries.map((streamId) => this.repository.streamState(streamId))
      )
      return {
        entries: streamStates,
        pageInfo: page.pageInfo,
      }
    } else {
      this.logger.warn(`Indexing is not configured. Unable to serve query ${JSON.stringify(query)}`)
      return {
        entries: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
        },
      }
    }
  }

  async init(): Promise<void> {
    await this.databaseIndexApi?.init()
  }

  async close(): Promise<void> {
    await this.databaseIndexApi?.close()
  }
}
