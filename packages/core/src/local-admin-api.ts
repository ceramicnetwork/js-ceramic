import { AdminApi, DiagnosticsLogger, LogStyle } from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'
import { LocalIndexApi } from './indexing/local-index-api.js'

/**
 * AdminApi for Ceramic core.
 */
export class LocalAdminApi implements AdminApi {
  constructor(
    private readonly adminDids: Array<string> | undefined,
    private readonly indexApi: LocalIndexApi,
    private readonly logger: DiagnosticsLogger
  ) {}

  private verifyActingDid(actingDid: string) {
    if (!this.adminDids || !this.adminDids.some( adminDid => actingDid.startsWith(adminDid) )) {
      this.logger.log(LogStyle.warn, `Unauthorized access attempt to Admin Api from did: ${actingDid}`)
      throw Error(`Unauthorized access: DID '${actingDid}' does not have admin access permission to this node`)
    }
  }

  async startIndexingModels(actingDid: string, modelsIDs: Array<StreamID>): Promise<void> {
    this.verifyActingDid(actingDid)
    this.logger.log(LogStyle.info, `Adding models to index: ${modelsIDs}`)
    await this.indexApi.indexModels(modelsIDs)
  }

  getIndexedModels(actingDid: string): Promise<Array<StreamID>> {
    this.verifyActingDid(actingDid)
    return Promise.resolve(this.indexApi.indexedModels() ?? [])
  }

  async stopIndexingModels(actingDid: string, modelsIDs: Array<StreamID>): Promise<void> {
    this.verifyActingDid(actingDid)
    this.logger.log(LogStyle.info, `Removing models from index: ${modelsIDs}`)
    await this.indexApi.stopIndexingModels(modelsIDs)
  }
}
