import {
  AdminApi,
  fetchJson,
  PinApi,
  NodeStatusResponse,
  ModelData,
  FieldsIndex,
  convertModelIdsToModelData,
} from '@ceramicnetwork/common'
import { RemotePinApi } from './remote-pin-api.js'
import { StreamID } from '@ceramicnetwork/streamid'
import { DID } from 'dids'
import { MissingDIDError } from './utils.js'

type RemoteModelData = {
  streamID: string
  indices?: Array<FieldsIndex>
}

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
    const code = await this.generateCode()
    const body = {
      models: modelsIDs.map((idx) => idx.toString()),
    }
    await this._fetchJson(this.getModelsUrl(), {
      method: 'post',
      body: {
        jws: await this.buildJWS(this._getDidFn(), code, this.getModelsUrl().pathname, body),
      },
    })
  }

  async startIndexingModelData(modelData: Array<ModelData>): Promise<void> {
    const code = await this.generateCode()
    const body = {
      modelData: modelData.map((idx) => {
        return {
          streamID: idx.streamID.toString(),
          indices: idx.indices,
        }
      }),
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
    return response.models.map((data) => {
      return {
        streamID: StreamID.fromString(data),
      }
    })
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
    return response.modelData.map((data: RemoteModelData) => {
      return {
        streamID: StreamID.fromString(data.streamID),
        indices: data.indices,
      }
    })
  }

  async stopIndexingModels(modelsIDs: Array<StreamID>): Promise<void> {
    const code = await this.generateCode()
    const body = {
      models: modelsIDs.map((data) => data.toString()),
    }
    await this._fetchJson(this.getModelsUrl(), {
      method: 'delete',
      body: {
        jws: await this.buildJWS(this._getDidFn(), code, this.getModelsUrl().pathname, body),
      },
    })
  }

  async stopIndexingModelData(modelData: Array<ModelData>): Promise<void> {
    const code = await this.generateCode()
    const body = {
      modelData: modelData.map((data) => {
        return {
          streamID: data.streamID.toString(),
        }
      }),
    }
    await this._fetchJson(this.getModelDataUrl(), {
      method: 'delete',
      body: {
        jws: await this.buildJWS(this._getDidFn(), code, this.getModelDataUrl().pathname, body),
      },
    })
  }

  get pin(): PinApi {
    return this._pinApi
  }
}
