import { AdminApi, NodeStatusResponse, PinApi } from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'
import { LocalIndexApi } from './indexing/local-index-api.js'
import { SyncApi } from './sync/sync-api.js'

type NodeStatusFn = () => Promise<NodeStatusResponse>

/**
 * AdminApi for Ceramic core.
 */
export class LocalAdminApi implements AdminApi {
  constructor(
    private readonly indexApi: LocalIndexApi,
    private readonly syncApi: SyncApi,
    private readonly nodeStatusFn: NodeStatusFn, // TODO(CDB-2293): circular dependency back into Ceramic
    private readonly pinApi: PinApi
  ) {}

  async nodeStatus(): Promise<NodeStatusResponse> {
    return this.nodeStatusFn()
  }

  async startIndexingModels(modelsIDs: Array<StreamID>): Promise<void> {
    await Promise.all([
      this.indexApi.indexModels(modelsIDs),
      this.syncApi.startModelSync(modelsIDs.map((id) => id.toString())),
    ])
  }

  getIndexedModels(): Promise<Array<StreamID>> {
    return Promise.resolve(this.indexApi.indexedModels() ?? [])
  }

  async stopIndexingModels(modelsIDs: Array<StreamID>): Promise<void> {
    await Promise.all([
      this.indexApi.stopIndexingModels(modelsIDs),
      this.syncApi.stopModelSync(modelsIDs.map((id) => id.toString())),
    ])
  }

  get pin(): PinApi {
    return this.pinApi
  }
}
