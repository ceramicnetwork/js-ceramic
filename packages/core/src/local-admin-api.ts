import { AdminApi, PinApi } from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'
import { LocalIndexApi } from './indexing/local-index-api.js'
import { SyncApi } from './sync/sync-api.js'
import { LocalPinApi } from './local-pin-api.js'

/**
 * AdminApi for Ceramic core.
 */

export class LocalAdminApi implements AdminApi {
  constructor(
    private readonly indexApi: LocalIndexApi,
    private readonly syncApi: SyncApi,
    private readonly pinApi: PinApi
  ) {}

  async startIndexingModels(modelsIDs: Array<StreamID>): Promise<void> {
    await Promise.all([
      this.indexApi.indexModels(modelsIDs),
      this.syncApi.startModelSync(modelsIDs.map((id) => id.toString())),
    ])
  }

  getIndexedModels(): Promise<Array<StreamID>> {
    return Promise.resolve(this.indexApi.indexedModels() ?? [])
  }

  async stopIndexingModels(modelsIDs: Array<StreamID>): Promise<void> {
    await this.indexApi.stopIndexingModels(modelsIDs)
  }

  get pin(): PinApi {
    return this.pinApi
  }
}
