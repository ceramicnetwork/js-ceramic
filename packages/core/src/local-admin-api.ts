import {
  AdminApi,
  convertModelIdsToModelData,
  ModelData,
  NodeStatusResponse,
  PinApi,
  LoadOpts,
  DiagnosticsLogger,
} from '@ceramicnetwork/common'
import { Model } from '@ceramicnetwork/stream-model'
import { StreamID, CommitID } from '@ceramicnetwork/streamid'
import { convertCidToEthHash } from '@ceramicnetwork/anchor-utils'
import type { LocalIndexApi, ISyncApi } from '@ceramicnetwork/indexing'
import { ProvidersCache } from './providers-cache.js'
import { Provider } from '@ethersproject/providers'

type NodeStatusFn = () => Promise<NodeStatusResponse>
type LoadStreamFn<T> = (streamId: StreamID | CommitID | string, opts?: LoadOpts) => Promise<T>

export const NUMBER_OF_BLOCKS_BEFORE_TX_TO_START_SYNC = 7200 // 24 hours at 1 block every 12 seconds
/**
 * AdminApi for Ceramic core.
 */
export class LocalAdminApi implements AdminApi {
  #provider: Provider

  constructor(
    private readonly logger: DiagnosticsLogger,
    private readonly indexApi: LocalIndexApi,
    private readonly syncApi: ISyncApi,
    private readonly nodeStatusFn: NodeStatusFn, // TODO(CDB-2293): circular dependency back into Ceramic
    private readonly pinApi: PinApi,
    private readonly providersCache: ProvidersCache,
    private readonly loadStream: LoadStreamFn<Model> // TODO(CDB-2293): circular dependency back into Ceramic
  ) {}

  async nodeStatus(): Promise<NodeStatusResponse> {
    return this.nodeStatusFn()
  }

  async startIndexingModels(modelsIDs: Array<StreamID>): Promise<void> {
    await this.startIndexingModelData(convertModelIdsToModelData(modelsIDs))
  }

  private async _getStartBlock(modelData: Array<ModelData>): Promise<number | null> {
    const models = await Promise.all(modelData.map(({ streamID }) => this.loadStream(streamID)))

    // If a model does not have a timestamp, it either has not been anchored, or we have not received the anchor commit yet
    // In this case we must use the default start block (when our anchoring contract has launched)
    const unachoredModel = models.find((model) => {
      return !model.state.log[0].timestamp
    })

    if (unachoredModel) {
      this.logger.warn(
        `Detected an indexed Model without an anchor timestamp ${unachoredModel.id}. Starting historical sync at ethereum block representing the beginning of time for indexable ComposeDB Models`
      )
      return null
    }

    const oldestModel = models.reduce((oldestModel, currentModel) => {
      const oldestModelTimestamp = oldestModel.state.log[0].timestamp || Infinity
      const currentModelTimestamp = currentModel.state.log[0].timestamp || Infinity

      if (currentModelTimestamp < oldestModelTimestamp) {
        return currentModel
      }

      return oldestModel
    })

    this.logger.imp(
      `Oldest indexed Model (${oldestModel}) was indexed at time ${oldestModel.state.log[0].timestamp}. Starting Historical Data Sync 24 hours earlier.`
    )

    if (!this.#provider) {
      const nodeStatus = await this.nodeStatus()
      this.#provider = await this.providersCache.getProvider(nodeStatus.anchor.chainId)
    }

    const startTx = await this.#provider.getTransaction(
      convertCidToEthHash(oldestModel.state.anchorProof.txHash)
    )

    if (!startTx.blockNumber) {
      return null
    }

    return startTx.blockNumber - NUMBER_OF_BLOCKS_BEFORE_TX_TO_START_SYNC
  }

  async startIndexingModelData(modelData: Array<ModelData>): Promise<void> {
    await this.indexApi.indexModels(modelData)

    if (!this.syncApi.enabled) {
      return
    }

    const startBlock = await this._getStartBlock(modelData)

    await this.syncApi.startModelSync(
      modelData.map((idx) => idx.streamID.toString()),
      { startBlock }
    )
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
