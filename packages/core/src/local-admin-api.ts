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
  }
}
