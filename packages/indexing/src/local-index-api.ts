import type {
  BaseQuery,
  IndexApi,
  ModelData,
  Page,
  PaginationQuery,
  StreamState,
  DiagnosticsLogger,
  CeramicCoreApi,
} from '@ceramicnetwork/common'
import type { DatabaseIndexApi, IndexModelArgs } from './database-index-api.js'
import { IndexStreamArgs } from './database-index-api.js'
import { StreamID } from '@ceramicnetwork/streamid'
import { IndexingConfig } from './build-indexing.js'
import { makeIndexApi } from './make-index-api.js'
import { Networks } from '@ceramicnetwork/common'
import {
  type LoadingInterfaceImplements,
  type ModelDefinition,
  Model,
  loadAllModelInterfaces,
} from '@ceramicnetwork/stream-model'
import { ISyncQueryApi } from './history-sync/interfaces.js'

/**
 * Takes a ModelData, loads it, and returns the IndexModelArgs necessary to prepare the
 * database for indexing that model.
 */
async function _getIndexModelArgs(
  req: ModelData,
  core: CeramicCoreApi,
  loading: LoadingInterfaceImplements = {}
): Promise<IndexModelArgs> {
  const modelStreamId = req.streamID
  if (modelStreamId.type != Model.STREAM_TYPE_ID && !modelStreamId.equals(Model.MODEL)) {
    throw new Error(`Cannot index ${modelStreamId.toString()}, it is not a Model StreamID`)
  }

  const opts: IndexModelArgs = {
    model: modelStreamId,
  }
  let relationFields = new Set<string>()

  if (modelStreamId.type == Model.STREAM_TYPE_ID) {
    const modelState = await core.loadStream(modelStreamId, {})
    const content: ModelDefinition = modelState.state.next?.content ?? modelState.state.content
    Model.assertVersionValid(content, 'major')
    // Relation fields need to be indexed
    if (content.relations) {
      relationFields = new Set(Object.keys(content.relations))
    }
    if (content.version !== '1.0') {
      if (content.interface) {
        throw new Error(`Model ${modelStreamId.toString()} is an interface and cannot be indexed`)
      }
      // Account relation fields need to be indexed when using the SET account relation
      if (content.accountRelation.type === 'set') {
        for (const field of content.accountRelation.fields) {
          relationFields.add(field)
        }
      }
      if (content.implements) {
        opts.implements = await loadAllModelInterfaces(core, content.implements, loading)
      }
    }
    opts.indices = req.indices
  }

  opts.relationFields = relationFields

  return opts
}

/**
 * API to query an index.
 */
export class LocalIndexApi implements IndexApi {
  private readonly databaseIndexApi: DatabaseIndexApi | undefined
  public readonly enabled: boolean

  constructor(
    indexingConfig: IndexingConfig | undefined,
    private readonly core: CeramicCoreApi,
    private readonly logger: DiagnosticsLogger,
    networkName: Networks
  ) {
    this.databaseIndexApi = makeIndexApi(indexingConfig, networkName, logger)
    this.enabled = indexingConfig != null && !indexingConfig.disableComposedb
  }

  setSyncQueryApi(api: ISyncQueryApi) {
    if (this.databaseIndexApi) {
      this.databaseIndexApi.setSyncQueryApi(api)
    }
  }

  shouldIndexStream(args: StreamID): boolean {
    if (!this.databaseIndexApi) {
      return false
    }

    return this.databaseIndexApi.getIndexedModels().some(function (idx) {
      return idx.streamID.equals(args)
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
    await this.databaseIndexApi!.indexStream(args)
  }

  async count(query: BaseQuery): Promise<number> {
    return this.databaseIndexApi!.count(query)
  }

  /**
   * Query the index. Ask an indexing database for a list of StreamIDs,
   * and convert them to corresponding StreamState instances via `Repository::streamState`.
   *
   * We assume that a state store always contains StreamState for an indexed stream, but we return null iff it's not to avoid throwing errors at DApps
   */
  async query(query: PaginationQuery): Promise<Page<StreamState | null>> {
    if (!this.databaseIndexApi) {
      this.logger.warn(`Indexing is not configured. Unable to serve query ${JSON.stringify(query)}`)
      return {
        edges: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
        },
      }
    }

    const page = await this.databaseIndexApi.page(query)
    const edges = await Promise.all(
      // For database queries we bypass the stream cache and repository loading queue
      page.edges.map(async (edge) => {
        const node = (await this.core.loadStreamState(edge.node)) ?? null
        if (!node) {
          this.logger.warn(`
            Did not find stream state for streamid ${
              edge.node
            } in our state store when serving an indexed query.
            This may indicate a problem with data persistence of your state store, which can result in data loss.
            Please check that your state store is properly configured with strong persistence guarantees.
            This query may have incomplete results. Affected query: ${JSON.stringify(query)}
            `)
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
  }

  indexedModels(): Array<ModelData> {
    return this.databaseIndexApi?.getIndexedModels() ?? []
  }

  async convertModelDataToIndexModelsArgs(
    modelsNoLongerIndexed: Array<ModelData>,
    modelData: ModelData,
    loading: LoadingInterfaceImplements = {}
  ): Promise<IndexModelArgs> {
    const modelStreamId = modelData.streamID
    this.logger.imp(`Starting indexing for Model ${modelStreamId.toString()}`)

    const modelNoLongerIndexed = modelsNoLongerIndexed.some(function (oldIdx) {
      return oldIdx.streamID.equals(modelStreamId)
    })
    // TODO(CDB-2297): Handle a model's historical sync after re-indexing
    if (modelNoLongerIndexed) {
      throw new Error(
        `Cannot re-index model ${modelStreamId.toString()}, data may not be up-to-date`
      )
    }

    return await _getIndexModelArgs(modelData, this.core, loading)
  }

  async indexModels(models: Array<ModelData>): Promise<void> {
    const modelsNoLongerIndexed = (await this.databaseIndexApi?.getModelsNoLongerIndexed()) ?? []
    const loading = {}

    const indexModelsArgs = await Promise.all(
      models.map(async (idx) => {
        return await this.convertModelDataToIndexModelsArgs(modelsNoLongerIndexed, idx, loading)
      })
    )

    await this.databaseIndexApi?.indexModels(indexModelsArgs)
  }

  async stopIndexingModels(models: Array<ModelData>): Promise<void> {
    this.logger.imp(`Stopping indexing for Models: ${models.map(String).join(',')}`)
    await this.databaseIndexApi?.stopIndexingModels(models)
  }

  async init(): Promise<void> {
    if (!this.databaseIndexApi) {
      return
    }
    await this.databaseIndexApi.init()
    // Load the set of indexed models from the database and pass them
    // back to the DatabaseIndexApi so that it can populate its internal state.
    // TODO(CDB-2132):  Fix this fragile and circular DatabaseApi initialization
    const modelsToIndex = this.databaseIndexApi.getIndexedModels()
    await this.indexModels(modelsToIndex)
  }

  async close(): Promise<void> {
    await this.databaseIndexApi?.close()
  }
}
