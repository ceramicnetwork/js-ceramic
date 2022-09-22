import { AdminApi, fetchJson, Stream, StreamState, StreamUtils, Context } from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'
import { Document } from './document.js'
import { Model } from '@ceramicnetwork/stream-model'
import { DEFAULT_CLIENT_CONFIG } from './ceramic-http-client.js'

/**
 * AdminApi for Ceramic http client.
 */
export class RemoteAdminApi implements AdminApi {
  readonly baseURL = './admin/models'

  constructor(
    private readonly _context: Context,
    private readonly _apiUrl: URL,

  ) {}

  private getUrl(): URL {
    return new URL(this.baseURL, this._apiUrl)
  }

  async addModelsToIndex(modelsIDs: Array<StreamID>): Promise<void> {
    await fetchJson(this.getUrl(), {
      method: 'post',
      body: { models: modelsIDs },
    })
  }

  async getIndexedModels(): Promise<Array<StreamID>> {
    // TODO: Is this the simplest way to deserialize and return a stream id?
    const response= await fetchJson(this.getUrl())
    return response.models.map((modelStreamIDString: string) => {
      return StreamID.fromString(modelStreamIDString)
    })
  }

  async removeModelsFromIndex(modelsIDs: Array<StreamID>): Promise<void> {
    await fetchJson(this.getUrl(), {
      method: 'delete',
      body: { models: modelsIDs },
    })
  }

  async replaceModelsInIndex(modelsIDs: Array<StreamID>): Promise<void> {
    await fetchJson(this.getUrl(), {
      method: 'put',
      body: { models: modelsIDs },
    })
  }
}
