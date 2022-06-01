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
   * Query the index. Ask an indexing database for a list of StreamIDs,
   * and convert them to corresponding StreamState instances via `Repository::load`.
   */
  async queryIndex(query: BaseQuery & Pagination): Promise<Page<StreamState>> {
    if (this.databaseIndexApi) {
      const page = await this.databaseIndexApi.page(query)
      const streamStates = await Promise.all(
        page.entries.map(async (streamId) => {
          const running = await this.repository.load(streamId, { sync: SyncOptions.NEVER_SYNC })
          return running.state
        })
      )
      return {
        ...page,
        entries: streamStates,
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
}
