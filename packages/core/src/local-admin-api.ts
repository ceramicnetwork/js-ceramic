import { AdminApi, ModelFieldsIndex, NodeStatusResponse, PinApi } from '@ceramicnetwork/common'
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

  async startIndexingModels(
    modelsIDs: Array<StreamID>,
    indices?: Array<ModelFieldsIndex>
  ): Promise<void> {
    let models = modelsIDs.map((id) => {
      return {
        streamID: id,
        indices: undefined,
      } as ModelFieldsIndex
    })
    if (indices) {
      models = models.concat(indices)
    }
    await this.indexApi.indexModels(models)
    await this.syncApi.startModelSync(models.map((idx) => idx.streamID.toString()))
  }

  async getIndexedModels(): Promise<Array<StreamID>> {
    const models = await this.getIndexedModelsWithFieldIndices()
    return models.map((idx) => idx.streamID)
  }

  async getIndexedModelsWithFieldIndices(): Promise<Array<ModelFieldsIndex>> {
    return (await this.indexApi.indexedModels()) ?? []
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
