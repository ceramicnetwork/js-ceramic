import { AdminApi, DiagnosticsLogger, LogStyle } from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'
import { LocalIndexApi } from './indexing/local-index-api.js'

/**
 * AdminApi for Ceramic core.
 */
export class LocalAdminApi implements AdminApi {
  constructor(
    private readonly adminDids: Array<string>,
    private readonly indexApi: LocalIndexApi,
    private readonly logger: DiagnosticsLogger
  ) {}

  async addModelsToIndex(actingDid: string, modelsIDs: Array<StreamID>): Promise<void> {
    // FIXME: verify that actingDid in an adminDID
    this.logger.log(LogStyle.info, `Local Admin Api will add model ids to index ${modelsIDs}`)
    await this.indexApi.indexModels(modelsIDs)
    this.logger.log(LogStyle.info, `Local Admin Api did add model ids to index ${modelsIDs}`)
  }

  getIndexedModels(actingDid: string): Promise<Array<StreamID>> {
    // FIXME: verify that actingDid in an adminDID
    return Promise.resolve(this.indexApi.indexedModels() ?? [])
  }

  async removeModelsFromIndex(actingDid: string, modelsIDs: Array<StreamID>): Promise<void> {
    // FIXME: verify that actingDid in an adminDID
    this.logger.log(LogStyle.info, `Local Admin Api will remove model ids to index ${modelsIDs}`)
    await this.indexApi.stopIndexingModels(modelsIDs)
    this.logger.log(LogStyle.info, `Local Admin Api did remove model ids to index ${modelsIDs}`)
  }

  async replaceModelsInIndex(actingDid: string, modelsIDs: Array<StreamID>): Promise<void> {
    // FIXME: verify that actingDid in an adminDID
    this.logger.log(LogStyle.info, `Local Admin Api will replace model ids to index ${modelsIDs}`)
    // TODO: Is this done in a single transaction? If not, it should be.
    await this.indexApi.stopIndexingModels(this.indexApi.indexedModels())
    await this.indexApi.indexModels(modelsIDs)
    this.logger.log(LogStyle.info, `Local Admin Api did replace model ids to index ${modelsIDs}`)
  }
}
