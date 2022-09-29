import { AdminApi, fetchJson } from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'
import { DID } from 'dids'

/**
 * AdminApi for Ceramic http client.
 */
export class RemoteAdminApi implements AdminApi {
  // Stored as a member to make it easier to inject a mock in unit tests
  private readonly _fetchJson: typeof fetchJson = fetchJson

  readonly modelsPath = './admin/models'
  readonly getCodePath = './admin/getCode'

  constructor(
    private readonly _apiUrl: URL
  ) {}

  private getCodeUrl(): URL {
    return new URL(this.getCodePath, this._apiUrl)
  }

  private getModelsUrl(): URL {
    return new URL(this.modelsPath, this._apiUrl)
  }

  private async buildJWS(actingDid: DID, code: string, modelsIDs?: Array<StreamID>): Promise<string> {
    const body = modelsIDs ? { models: modelsIDs.map(streamID => streamID.toString()) } : undefined
    const jws = await actingDid.createJWS({
      code: code,
      requestPath: this._apiUrl.pathname,
      requestBody: body
    })
    return `${jws.signatures[0].protected}.${jws.payload}.${jws.signatures[0].signature}`
  }

  async generateCode(): Promise<string> {
    return (await this._fetchJson(this.getCodeUrl())).code
  }

  async startIndexingModels(actingDid: DID, code: string, modelsIDs: Array<StreamID>): Promise<void> {
    await this._fetchJson(this.getModelsUrl(), {
      method: 'post',
      body: { jws: await this.buildJWS(actingDid, code, modelsIDs)},
    })
  }

  async getIndexedModels(actingDid: DID, code: string): Promise<Array<StreamID>> {
    const response= await this._fetchJson(this.getModelsUrl(), {
      headers: { 'Authorization:': `Basic ${await this.buildJWS(actingDid, code)}` },
    })
    return response.models.map((modelStreamIDString: string) => {
      return StreamID.fromString(modelStreamIDString)
    })
  }

  async stopIndexingModels(actingDid: DID, code: string, modelsIDs: Array<StreamID>): Promise<void> {
    await this._fetchJson(this.getModelsUrl(), {
      method: 'delete',
      body: { jws: await this.buildJWS(actingDid, code, modelsIDs)},
    })
  }
}
