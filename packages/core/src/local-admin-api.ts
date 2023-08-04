import {
  AdminApi,
  convertModelIdsToModelData,
  ModelData,
  NodeStatusResponse,
  PinApi,
  LoadOpts,
} from '@ceramicnetwork/common'
import { Model } from '@ceramicnetwork/stream-model'
import { StreamID, CommitID } from '@ceramicnetwork/streamid'
import { LocalIndexApi } from './indexing/local-index-api.js'
import { ISyncApi, ModelSyncOptions } from './sync/interfaces.js'
import { convertCidToEthHash } from '@ceramicnetwork/anchor-utils'

type NodeStatusFn = () => Promise<NodeStatusResponse>
type LoadStreamFn<T> = (streamId: StreamID | CommitID | string, opts?: LoadOpts) => Promise<T>

/**
 * AdminApi for Ceramic core.
 */
export class LocalAdminApi implements AdminApi {
  constructor(
    private readonly indexApi: LocalIndexApi,
    private readonly syncApi: ISyncApi,
    private readonly nodeStatusFn: NodeStatusFn, // TODO(CDB-2293): circular dependency back into Ceramic
    private readonly pinApi: PinApi,
    private readonly loadStream: LoadStreamFn<Model>
  ) {}

  async nodeStatus(): Promise<NodeStatusResponse> {
    return this.nodeStatusFn()
  }

  async startIndexingModels(modelsIDs: Array<StreamID>): Promise<void> {
    await this.startIndexingModelData(convertModelIdsToModelData(modelsIDs))
  }

  async startIndexingModelData(modelData: Array<ModelData>): Promise<void> {
    await this.indexApi.indexModels(modelData)

    if (this.syncApi.enabled) {
      const models = await Promise.all(modelData.map(({ streamID }) => this.loadStream(streamID)))

      const oldestModel = models.reduce((oldestModel, currentModel) => {
        const oldestModelTimestamp = oldestModel.state.log[0].timestamp || Infinity
        const currentModelTimestamp = currentModel.state.log[0].timestamp || Infinity

        if (currentModelTimestamp < oldestModelTimestamp) {
          return currentModel
        }

        return oldestModel
      })

      const syncOptions: ModelSyncOptions = {
        startTxHash: oldestModel.state.anchorProof
          ? convertCidToEthHash(oldestModel.state.anchorProof.txHash)
          : undefined,
      }
      await this.syncApi.startModelSync(
        modelData.map((idx) => idx.streamID.toString()),
        syncOptions
      )
    }
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
