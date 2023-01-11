import {
  AnchorServiceAuth,
  CeramicApi,
  DiagnosticsLogger,
  FetchOpts,
  HttpMethods,
  fetchJson,
  FetchRequest
} from "@ceramicnetwork/common"
import { DagJWS } from "dids"

export class DIDAnchorServiceAuth implements AnchorServiceAuth {
  private _ceramic: CeramicApi
  private readonly _anchorServiceUrl: string
  private readonly _logger: DiagnosticsLogger

  constructor(
    anchorServiceUrl: string,
    logger: DiagnosticsLogger,
  ) {
    this._anchorServiceUrl = anchorServiceUrl
    this._logger = logger
  }

  /**
   * Set Ceramic API instance
   *
   * @param ceramic - Ceramic API used for various purposes
   */
  set ceramic(ceramic: CeramicApi) {
    this._ceramic = ceramic
  }

  init = async (): Promise<void> => {
    return
  }

  sendAuthenticatedRequest = async (url: URL | string, opts?: FetchOpts): Promise<any> => {
    if (!this._ceramic) {
      throw new Error('Missing Ceramic instance required by this auth method')
    }
    const { request } = await this.signRequest({url, opts})
    return await this._sendRequest(request)
  }

  async signRequest(request: FetchRequest): Promise<{request: FetchRequest, jws: DagJWS}> {
    const payload: any = { url: request.url, nonce: crypto.randomUUID() }
    if (request.opts) {
      if (request.opts.body) {
        payload.body = request.opts.body
      }
    }
    const jws = await this._ceramic.did.createJWS(payload)
    const authorization = `Bearer ${jws.signatures[0].protected}.${jws.payload}.${jws.signatures[0].signature}`
    request.opts = { ...request.opts, headers: {...request.opts.headers, authorization }}
    return { request, jws }
  }

  private _sendRequest = async (request: FetchRequest): Promise<any> => {
    const data = await fetchJson(request.url, request.opts)
    if (data.error) {
      this._logger.err(data.error)
      return data
    }
    return data
  }
}
