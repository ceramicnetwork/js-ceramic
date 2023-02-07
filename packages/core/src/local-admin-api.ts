import { AdminApi } from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'
import { LocalIndexApi } from './indexing/local-index-api.js'
import { SyncApi } from './sync/sync-api.js'

/**
 * AdminApi for Ceramic core.
 */
export class LocalAdminApi implements AdminApi {
  constructor(private readonly indexApi: LocalIndexApi, private readonly syncApi: SyncApi) {}

  async startIndexingModels(modelsIDs: Array<StreamID>): Promise<void> {
    await this.indexApi.indexModels(modelsIDs)
    await this.syncApi.startModelSync(modelsIDs)
  }

  getIndexedModels(): Promise<Array<StreamID>> {
    return Promise.resolve(this.indexApi.indexedModels() ?? [])
  }

  async stopIndexingModels(modelsIDs: Array<StreamID>): Promise<void> {
    await this.indexApi.stopIndexingModels(modelsIDs)
  }
}
