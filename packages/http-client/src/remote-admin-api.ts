import { AdminApi, fetchJson, Stream, StreamState, StreamUtils, Context } from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'
import { Document } from './document.js'
import { Model } from '@ceramicnetwork/stream-model'

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

  async getModelsFromIndex(): Promise<Array<Stream>> {
    // TODO: Is this the simplest way to deserialize and return a stream? Should this operate on StreamStates rather than streams?
    const response= await fetchJson(this.getUrl())
    return response.models.map((modelStreamState: StreamState) => {
      return new Model(
        new Document(StreamUtils.deserializeState(modelStreamState), this._apiUrl, 1000000),
        this._context) as Stream
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
