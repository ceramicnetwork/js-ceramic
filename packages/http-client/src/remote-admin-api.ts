import { AdminApi, fetchJson, PinApi, NodeStatusResponse, ModelData } from '@ceramicnetwork/common'
import { RemotePinApi } from './remote-pin-api.js'
import { StreamID } from '@ceramicnetwork/streamid'
import { DID } from 'dids'
import { MissingDIDError } from './utils.js'

/**
 * AdminApi for Ceramic http client.
 */
export class RemoteAdminApi implements AdminApi {
  // Stored as a member to make it easier to inject a mock in unit tests
  private readonly _fetchJson: typeof fetchJson = fetchJson
  private readonly _pinApi: PinApi

  readonly modelsPath = './admin/models'
  readonly modelDataPath = './admin/modelData'
  readonly getCodePath = './admin/getCode'
  readonly nodeStatusPath = './admin/status'

  constructor(private readonly _apiUrl: URL, private readonly _getDidFn: () => DID) {
    this._pinApi = new RemotePinApi(this._apiUrl, this._getDidFn)
  }

  private getCodeUrl(): URL {
    return new URL(this.getCodePath, this._apiUrl)
  }

  private getModelsUrl(): URL {
    return new URL(this.modelsPath, this._apiUrl)
  }

  private getModelDataUrl(): URL {
    return new URL(this.modelDataPath, this._apiUrl)
  }

  private getStatusUrl(): URL {
    return new URL(this.nodeStatusPath, this._apiUrl)
  }

  private async buildJWS(
    actingDid: DID,
    code: string,
    requestPath: string,
    body?: Record<string, any>
  ): Promise<string> {
    if (!actingDid) throw new MissingDIDError()
    const jws = await actingDid.createJWS({
      code: code,
      requestPath,
      requestBody: body,
    })
    return `${jws.signatures[0].protected}.${jws.payload}.${jws.signatures[0].signature}`
  }

  private async generateCode(): Promise<string> {
    return (await this._fetchJson(this.getCodeUrl())).code
  }

  async nodeStatus(): Promise<NodeStatusResponse> {
    const code = await this.generateCode()
    return this._fetchJson(this.getStatusUrl(), {
      headers: {
        Authorization: `Basic ${await this.buildJWS(
          this._getDidFn(),
          code,
          this.getStatusUrl().pathname
        )}`,
      },
    })
  }

  async startIndexingModels(modelsIDs: Array<StreamID>): Promise<void> {
    await this.startIndexingModelData(
      modelsIDs.map((mid) => {
        return {
          streamID: mid,
        }
      })
    )
  }

  async startIndexingModelData(modelData: Array<ModelData>): Promise<void> {
    const code = await this.generateCode()
    const body = {
      indices: modelData.map((idx) => {
        return {
          streamID: idx.streamID.toString(),
          indices: idx.indices,
        }
      })
    }
    await this._fetchJson(this.getModelDataUrl(), {
      method: 'post',
      body: {
        jws: await this.buildJWS(this._getDidFn(), code, this.getModelDataUrl().pathname, body),
      },
    })
  }

  async getIndexedModels(): Promise<Array<StreamID>> {
    const code = await this.generateCode()
    const response = await this._fetchJson(this.getModelsUrl(), {
      headers: {
        Authorization: `Basic ${await this.buildJWS(
          this._getDidFn(),
          code,
          this.getModelsUrl().pathname
        )}`,
      },
    })
    return response.models.map((id) => StreamID.fromString(id))
  }

  async getIndexedModelData(): Promise<Array<ModelData>> {
    const code = await this.generateCode()
    const response = await this._fetchJson(this.getModelDataUrl(), {
      headers: {
        Authorization: `Basic ${await this.buildJWS(
          this._getDidFn(),
          code,
          this.getModelDataUrl().pathname
        )}`,
      },
    })
    return response.modelData
  }

  async stopIndexingModels(modelsIDs: Array<StreamID>): Promise<void> {
    const code = await this.generateCode()
    const body = modelIDsAsRequestBody(modelsIDs)
    await this._fetchJson(this.getModelsUrl(), {
      method: 'delete',
      body: {
        jws: await this.buildJWS(this._getDidFn(), code, this.getModelsUrl().pathname, body),
      },
    })
  }

  get pin(): PinApi {
    return this._pinApi
  }
}

function modelIDsAsRequestBody(modelIDs: Array<StreamID>): Record<string, any> {
  return modelIDs ? { models: modelIDs.map((streamID) => streamID.toString()) } : {}
}
