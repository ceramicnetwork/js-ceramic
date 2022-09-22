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

  async addModelsToIndex(modelsIDs: Array<StreamID>): Promise<void> {
    this.logger.log(LogStyle.info, `Local Admin Api will add model ids to index ${modelsIDs}`)
    await this.indexApi.indexModels(modelsIDs)
    this.logger.log(LogStyle.info, `Local Admin Api did add model ids to index ${modelsIDs}`)
  }

  getIndexedModels(): Promise<Array<StreamID>> {
    return Promise.resolve(this.indexApi.indexedModels() ?? [])
  }

  removeModelsFromIndex(modelsIDs: Array<StreamID>): Promise<void> {
    throw Error('Removing models from index not implemented in database api')
    return
  }

  replaceModelsInIndex(modelsIDs: Array<StreamID>): Promise<void> {
    throw Error('Replacing models in index not implemented in database api')
    return
  }
}
