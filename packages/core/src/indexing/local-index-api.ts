import type {
  BaseQuery,
  IndexApi,
  Page,
  PaginationQuery,
  StreamState,
  DiagnosticsLogger,
} from '@ceramicnetwork/common'
import type { DatabaseIndexApi } from './database-index-api.js'
import type { Repository } from '../state-management/repository.js'
import { IndexStreamArgs } from './database-index-api.js'
import { StreamID } from '@ceramicnetwork/streamid'
import { IndexingConfig } from './build-indexing.js'
import { makeIndexApi } from '../initialization/make-index-api.js'
import { Networks } from '@ceramicnetwork/common'

/**
 * API to query an index.
 */
export class LocalIndexApi implements IndexApi {
  private readonly databaseIndexApi: DatabaseIndexApi | undefined

  constructor(
    private readonly indexingConfig: IndexingConfig,
    private readonly repository: Repository,
    private readonly logger: DiagnosticsLogger,
    networkName: Networks
  ) {
    this.databaseIndexApi = makeIndexApi(indexingConfig, networkName, logger)
  }

  shouldIndexStream(args: StreamID): boolean {
    if (!this.databaseIndexApi) {
      return false
    }

    return this.databaseIndexApi.getActiveModelsToIndex().some(function (streamId) {
      return String(streamId) === String(args)
    })
  }

  /**
   * Add stream to index in appropriate model table
   * @param args
   */
  async indexStream(args: IndexStreamArgs): Promise<void> {
    // only index streams with active models in config
    if (!this.shouldIndexStream(args.model)) {
      return
    }
    await this.databaseIndexApi.indexStream(args)
  }

  async count(query: BaseQuery): Promise<number> {
    throw new Error('Not implemented')
  }

  /**
   * Query the index. Ask an indexing database for a list of StreamIDs,
   * and convert them to corresponding StreamState instances via `Repository::streamState`.
   *
   * We assume that a state store always contains StreamState for an indexed stream, but we return null iff it's not to avoid throwing errors at DApps
   */
  async query(query: PaginationQuery): Promise<Page<StreamState | null>> {
    if (this.databaseIndexApi) {
      const page = await this.databaseIndexApi.page(query)
      const edges = await Promise.all(
        // For database queries we bypass the stream cache and repository loading queue
        page.edges.map(async (edge) => {
          let node: StreamState = await this.repository.streamState(edge.node)
          if (node === undefined) {
            this.logger.warn(`
            Did not find stream state in our state store when serving an indexed query.
            This may indicate a problem with data persistence of your state store, which can result in data loss.
            Please check that your state store is properly configured with strong persistence guarantees.
            This query may have incomplete results. Affected query: ${JSON.stringify(query)}
            `)
            node = null
          }

          return {
            cursor: edge.cursor,
            node: node,
          }
        })
      )
      return {
        edges: edges,
        pageInfo: page.pageInfo,
      }
    } else {
      this.logger.warn(`Indexing is not configured. Unable to serve query ${JSON.stringify(query)}`)
      return {
        edges: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
        },
      }
    }
  }

  async indexModels(models: Array<StreamID>): Promise<void> {
    // TODO: Load model StreamIDs, extract relations and pass those arguments down into the
    //  DatabaseIndexAPI so the necessary columns get built for the relations
    const indexModelArgs = []
    for (const model of models) {
      const args = { model }
      indexModelArgs.push(args)
    }
    await this.databaseIndexApi?.indexModels(indexModelArgs)
  }

  async init(): Promise<void> {
    return this.indexModels(this.indexingConfig.models)
  }

  async close(): Promise<void> {
    await this.databaseIndexApi?.close()
  }
}
