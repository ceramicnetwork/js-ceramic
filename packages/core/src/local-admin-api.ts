import {
  AdminApi,
  convertModelIdsToModelData,
  ModelData,
  NodeStatusResponse,
  PinApi,
} from '@ceramicnetwork/common'
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
    await this.startIndexingModelData(convertModelIdsToModelData(modelsIDs))
  }

  async startIndexingModelData(modelData: Array<ModelData>): Promise<void> {
    await this.indexApi.indexModels(modelData)
    await this.syncApi.startModelSync(modelData.map((idx) => idx.streamID.toString()))
  }

  async getIndexedModels(): Promise<Array<StreamID>> {
    const models = await this.getIndexedModelData()
    return models.map((m) => m.streamID)
  }

  async getIndexedModelData(): Promise<Array<ModelData>> {
    return Promise.resolve(this.indexApi?.indexedModels() || [])
  }

  async stopIndexingModels(modelsIDs: Array<StreamID>): Promise<void> {
    await this.stopIndexingModelData(convertModelIdsToModelData(modelsIDs))
  }

  async stopIndexingModelData(modelData: Array<ModelData>): Promise<void> {
    await Promise.all([
      this.indexApi.stopIndexingModels(modelData),
      this.syncApi.stopModelSync(modelData.map((data) => data.streamID.toString())),
    ])
  }

  get pin(): PinApi {
    return this.pinApi
  }
}
