import { AdminApi, ModelData, NodeStatusResponse, PinApi } from '@ceramicnetwork/common'
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
    await this.indexApi.indexModels(modelsIDs)
    await this.syncApi.startModelSync(modelsIDs.map((id) => id.toString()))
  }

  async startIndexingModelData(modelData: Array<ModelData>): Promise<void> {
    await this.startIndexingModels(modelData.map((d) => d.streamID))
  }

  getIndexedModels(): Promise<Array<StreamID>> {
    return Promise.resolve(this.indexApi.indexedModels() ?? [])
  }

  async getIndexedModelData(): Promise<Array<ModelData>> {
    const models = await this.getIndexedModels()
    return models.map((id) => {
      return {
        streamID: id,
      }
    })
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
