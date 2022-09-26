import { AdminApi, fetchJson, Stream, StreamState, StreamUtils, Context } from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'

/**
 * AdminApi for Ceramic http client.
 */
export class RemoteAdminApi implements AdminApi {
  // Stored as a member to make it easier to inject a mock in unit tests
  private readonly _fetchJson: typeof fetchJson = fetchJson
  readonly baseURL = './admin/models'

  constructor(
    private readonly _apiUrl: URL
  ) {}

  private getUrl(): URL {
    return new URL(this.baseURL, this._apiUrl)
  }

  async addModelsToIndex(modelsIDs: Array<StreamID>): Promise<void> {
    await this._fetchJson(this.getUrl(), {
      method: 'post',
      body: { models: modelsIDs.map(modelID => modelID.toString()) },
    })
  }

  async getIndexedModels(): Promise<Array<StreamID>> {
    
    const response= await this._fetchJson(this.getUrl())
    return response.models.map((modelStreamIDString: string) => {
      return StreamID.fromString(modelStreamIDString)
    })
  }

  async removeModelsFromIndex(modelsIDs: Array<StreamID>): Promise<void> {
    await this._fetchJson(this.getUrl(), {
      method: 'delete',
      body: { models: modelsIDs.map(modelID => modelID.toString()) },
    })
  }

  async replaceModelsInIndex(modelsIDs: Array<StreamID>): Promise<void> {
    await this._fetchJson(this.getUrl(), {
      method: 'put',
      body: { models: modelsIDs.map(modelID => modelID.toString()) },
    })
  }
}
