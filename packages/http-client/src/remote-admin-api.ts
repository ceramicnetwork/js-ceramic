import { AdminApi, fetchJson } from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'
import { DID } from 'dids'

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

  private async buildAuthorizationHeader(actingDid: DID, modelsIDs?: Array<StreamID>): Promise<string> {
    const body = modelsIDs ? { models: modelsIDs.map(streamID => streamID.toString()) } : undefined
    const jws = await actingDid.createJWS({
      timestamp: new Date().getTime(),
      requestPath: this._apiUrl.pathname,
      requestBody: body
    })
    return `${jws.signatures[0].protected}.${jws.payload}.${jws.signatures[0].signature}`
  }

  async startIndexingModels(actingDid: DID, modelsIDs: Array<StreamID>): Promise<void> {
    await this._fetchJson(this.getUrl(), {
      headers: { 'Authorization:': `Basic ${await this.buildAuthorizationHeader(actingDid, modelsIDs)}` },
      method: 'post',
      body: { models: modelsIDs.map(modelID => modelID.toString()) },
    })
  }

  async getIndexedModels(actingDid: DID): Promise<Array<StreamID>> {
    const response= await this._fetchJson(this.getUrl(), {
      headers: { 'Authorization:': `Basic ${await this.buildAuthorizationHeader(actingDid)}` },
    })
    return response.models.map((modelStreamIDString: string) => {
      return StreamID.fromString(modelStreamIDString)
    })
  }

  async stopIndexingModels(actingDid: DID, modelsIDs: Array<StreamID>): Promise<void> {
    await this._fetchJson(this.getUrl(), {
      headers: { 'Authorization:': `Basic ${await this.buildAuthorizationHeader(actingDid, modelsIDs)}` },
      method: 'delete',
      body: { models: modelsIDs.map(modelID => modelID.toString()) },
    })
  }
}
