import { AdminApi } from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'
import { LocalIndexApi } from './indexing/local-index-api.js'

/**
 * AdminApi for Ceramic core.
 */
export class LocalAdminApi implements AdminApi {
  constructor(
    private readonly indexApi: LocalIndexApi
  ) {}

  async startIndexingModels(modelsIDs: Array<StreamID>): Promise<void> {
    await this.indexApi.indexModels(modelsIDs)
  }

  getIndexedModels(): Promise<Array<StreamID>> {
    return Promise.resolve(this.indexApi.indexedModels() ?? [])
  }

  async stopIndexingModels(modelsIDs: Array<StreamID>): Promise<void> {
    await this.indexApi.stopIndexingModels(modelsIDs)
  }
}
