import {
  AnchorServiceAuth,
  CeramicApi,
  DiagnosticsLogger,
  FetchOpts,
  HttpMethods,
  fetchJson
} from "@ceramicnetwork/common"
import { DagJWS } from "dids"

export class DIDAnchorServiceAuth implements AnchorServiceAuth {
  private _ceramic: CeramicApi
  private _nonce: number
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

  get nonce(): number {
    return this._nonce
  }

  init = async (): Promise<void> => {
    this._nonce = await this.lookupLastNonce() ?? 0
  }

  lookupLastNonce = async (): Promise<number | undefined> => {
    if (!this._ceramic) {
      throw new Error('Missing Ceramic instance required by this auth method')
    }
    let nonce
    const { authorization } = await this.signRequest(this._getNonceEndpoint())
    const data = await this._sendRequest(this._getNonceEndpoint(), {
      method: HttpMethods.POST,
      headers: { authorization },
      body: {did: this._ceramic.did.id}
    })
    if (data) {
      if (data.nonce) {
        nonce = Number(data.nonce)
        if (!isNaN(nonce)) {
          return nonce
        }
      }
    }
    this._logger.debug('Could not get nonce from anchor service')
    return
  }

  sendAuthenticatedRequest = async (url: URL | string, opts?: FetchOpts): Promise<any> => {
    if (!this._ceramic) {
      throw new Error('Missing Ceramic instance required by this auth method')
    }
    this._updateNonce()
    const { authorization } = await this.signRequest(url, opts?.body, this._nonce)
    let headers: any = { authorization }
    opts?.headers && (headers = {...opts.headers, headers })
    return await this._sendRequest(url, { ...opts, headers})
  }

  signRequest = async (url: URL | string, body?: any, nonce?: number): Promise<{jws: DagJWS, authorization: string}> => {
    let payload: any = { url }
    body && (payload = { ...payload, body})
    nonce && (payload = { ...payload, nonce})
    const jws = await this._ceramic.did.createJWS(payload)
    const authorization = `Basic ${jws.signatures[0].protected}.${jws.payload}.${jws.signatures[0].signature}`
    return { jws, authorization }
  }

  /**
   * Increments nonce in memory.
   */
  private _updateNonce = async (): Promise<void> => {
    this._nonce = this._nonce + 1
  }

  private _sendRequest = async (url: URL| string, opts?: FetchOpts): Promise<any> => {
    const data = await fetchJson(url, opts)
    if (data.error) {
      this._logger.err(data.error)
      return data
    }
    return data
  }

  private _getNonceEndpoint = (): string => {
    return this._anchorServiceUrl + `/api/v0/auth/did/${this._ceramic.did.id}/nonce`
  }

}
