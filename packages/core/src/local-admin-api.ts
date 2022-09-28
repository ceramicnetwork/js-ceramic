import { AdminApi, DiagnosticsLogger, LogStyle } from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'
import { LocalIndexApi } from './indexing/local-index-api.js'

/**
 * AdminApi for Ceramic core.
 */
export class LocalAdminApi implements AdminApi {
  constructor(
    private readonly indexApi: LocalIndexApi,
    private readonly logger: DiagnosticsLogger
  ) {}

  async startIndexingModels(modelsIDs: Array<StreamID>): Promise<void> {
    this.logger.log(LogStyle.info, `Adding models to index: ${modelsIDs}`)
    await this.indexApi.indexModels(modelsIDs)
  }

  getIndexedModels(): Promise<Array<StreamID>> {
    return Promise.resolve(this.indexApi.indexedModels() ?? [])
  }

  async stopIndexingModels(modelsIDs: Array<StreamID>): Promise<void> {
    this.logger.log(LogStyle.info, `Removing models from index: ${modelsIDs}`)
    await this.indexApi.stopIndexingModels(modelsIDs)
    this.logger.log(LogStyle.info, `Local Admin Api did remove model ids to index ${modelsIDs}`)
  }

  async replaceIndexedModels(modelsIDs: Array<StreamID>): Promise<void> {
    this.logger.log(LogStyle.info, `Replacing models to index. Currently indexed models: ${this.indexApi.indexedModels()}.  Models to index going forward: ${modelsIDs}`)
    // TODO: Is this done in a single transaction? If not, it should be.
    const indexedModels = await this.getIndexedModels()
    const modelsToStartIndexing = modelsIDs.filter( modelID => indexedModels.every( indexedModelID => !modelID.equals(indexedModelID) ) )
    const modelsToStopIndexing = indexedModels.filter( indexedModelID => modelsIDs.every( modelID => !indexedModelID.equals(modelID) ) )
    await this.startIndexingModels(modelsToStartIndexing)
    await  this.stopIndexingModels(modelsToStopIndexing)
    this.logger.log(LogStyle.info, `Local Admin Api did replace model ids to index ${modelsIDs}`)
  }
}
