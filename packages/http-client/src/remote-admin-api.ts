import { AdminApi, fetchJson, Context } from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'

/**
 * AdminApi for Ceramic http client.
 */
export class RemoteAdminApi implements AdminApi {
  // Stored as a member to make it easier to inject a mock in unit tests
  private readonly _fetchJson: typeof fetchJson = fetchJson

  readonly baseURL = './admin/models'

  constructor(
    private readonly _apiUrl: URL,
    private readonly _context: Context
  ) {}

  private getUrl(): URL {
    return new URL(this.baseURL, this._apiUrl)
  }

  private async buildAuthorizationHeader(modelsIDs?: Array<StreamID>): Promise<string> {
    const body = modelsIDs ? { models: modelsIDs.map(streamID => streamID.toString()) } : undefined
    const jws = await this._context.did.createJWS({
      timestamp: Date.now(),
      requestPath: this._apiUrl.pathname,
      requestBody: body
    })
    return `${jws.signatures[0].protected}.${jws.payload}.${jws.signatures[0].signature}`
  }

  async addModelsToIndex(modelsIDs: Array<StreamID>): Promise<void> {
    await this._fetchJson(this.getUrl(), {
      headers: { 'Authorization:': `Basic ${await this.buildAuthorizationHeader(modelsIDs)}` },
      method: 'post',
      body: { models: modelsIDs.map(modelID => modelID.toString()) },
    })
  }

  async getIndexedModels(): Promise<Array<StreamID>> {
    const response= await this._fetchJson(this.getUrl(), {
      headers: { 'Authorization:': `Basic ${await this.buildAuthorizationHeader()}` },
    })
    return response.models.map((modelStreamIDString: string) => {
      return StreamID.fromString(modelStreamIDString)
    })

  }

  async removeModelsFromIndex(modelsIDs: Array<StreamID>): Promise<void> {
    await this._fetchJson(this.getUrl(), {
      headers: { 'Authorization:': `Basic ${await this.buildAuthorizationHeader(modelsIDs)}` },
      method: 'delete',
      body: { models: modelsIDs.map(modelID => modelID.toString()) },
    })
  }

  async replaceModelsInIndex(modelsIDs: Array<StreamID>): Promise<void> {
    await this._fetchJson(this.getUrl(), {
      headers: { 'Authorization:': `Basic ${await this.buildAuthorizationHeader(modelsIDs)}` },
      method: 'put',
      body: { models: modelsIDs.map(modelID => modelID.toString()) },
    })
  }
}
