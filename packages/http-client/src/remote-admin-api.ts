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

  constructor(private readonly _apiUrl: URL, private readonly _getDidFn: () => DID) {}
  private getCodeUrl(): URL {
    return new URL(this.getCodePath, this._apiUrl)
  }

  private getModelsUrl(): URL {
    return new URL(this.modelsPath, this._apiUrl)
  }

  private async buildJWS(
    actingDid: DID,
    code: string,
    modelsIDs?: Array<StreamID>
  ): Promise<string> {
    const body = modelsIDs
      ? { models: modelsIDs.map((streamID) => streamID.toString()) }
      : undefined
    const jws = await actingDid.createJWS({
      code: code,
      requestPath: this.getModelsUrl().pathname,
      requestBody: body,
    })
    return `${jws.signatures[0].protected}.${jws.payload}.${jws.signatures[0].signature}`
  }

  private async generateCode(): Promise<string> {
    return (await this._fetchJson(this.getCodeUrl())).code
  }

  async startIndexingModels(modelsIDs: Array<StreamID>): Promise<void> {
    const code = await this.generateCode()
    await this._fetchJson(this.getModelsUrl(), {
      method: 'post',
      body: { jws: await this.buildJWS(this._getDidFn(), code, modelsIDs) },
    })
  }

  async getIndexedModels(): Promise<Array<StreamID>> {
    const code = await this.generateCode()
    const response = await this._fetchJson(this.getModelsUrl(), {
      headers: { Authorization: `Basic ${await this.buildJWS(this._getDidFn(), code)}` },
    })
    return response.models.map((modelStreamIDString: string) => {
      return StreamID.fromString(modelStreamIDString)
    })
  }

  async stopIndexingModels(modelsIDs: Array<StreamID>): Promise<void> {
    const code = await this.generateCode()
    await this._fetchJson(this.getModelsUrl(), {
      method: 'delete',
      body: { jws: await this.buildJWS(this._getDidFn(), code, modelsIDs) },
    })
  }
}
