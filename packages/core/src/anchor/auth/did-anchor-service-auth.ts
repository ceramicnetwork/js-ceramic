import {
  AnchorServiceAuth,
  CeramicApi,
  DiagnosticsLogger,
  FetchOpts,
  fetchJson,
  FetchRequestParams
} from '@ceramicnetwork/common'
import { DagJWS } from 'dids'
import crypto, { createHash } from 'crypto'
import { CARFactory } from 'cartonne'
import * as u8a from 'uint8arrays'

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

  async init(): Promise<void> {
    return
  }

  async sendAuthenticatedRequest(url: URL | string, opts?: FetchOpts): Promise<any> {
    if (!this._ceramic) {
      throw new Error('Missing Ceramic instance required by this auth method')
    }
    const { request } = await this.signRequest({url, opts})
    return await this._sendRequest(request)
  }

  async signRequest(request: FetchRequestParams): Promise<{request: FetchRequestParams, jws: DagJWS}> {
    const payload: any = { url: request.url, nonce: crypto.randomUUID() }
    const payloadDigest = this._buildSignaturePayloadDigest(request.opts)
    if (payloadDigest) {
      payload.digest = payloadDigest
    }

    const jws = await this._ceramic.did.createJWS(payload)
    const authorization = `Bearer ${jws.signatures[0].protected}.${jws.payload}.${jws.signatures[0].signature}`
    let requestOpts: any = { headers: { authorization }}
    if (request.opts) {
      if (request.opts.headers) {
        requestOpts.headers = {headers: { ...request.opts.headers, authorization }}
      }
      requestOpts = { ...request.opts, ...requestOpts}
    }
    request.opts = requestOpts
    return { request, jws }
  }

  /**
   * Returns a hash of the request body data based on the type of request header.
   * @param requestOpts Request options. Should include header and body.
   * @returns Sha256 hash as a hex code
   */
  private _buildSignaturePayloadDigest(requestOpts: FetchOpts): string | undefined {
    if (!requestOpts) return
    if (requestOpts.body == undefined) return

    let hash: crypto.Hash

    if (requestOpts.headers) {
      const contentType = requestOpts.headers['Content-Type'] as string
      if (contentType.includes('application/vnd.ipld.car')) {
        const carFactory = new CARFactory()
        const car = carFactory.fromBytes(u8a.fromString(requestOpts.body, 'binary'))
        return car.roots[0].toString()
      } else if (contentType.includes('application/json')) {
        hash = createHash('sha256').update(JSON.stringify(requestOpts.body))
      }
    }

    if (!hash) {
      // Default to hashing stringified body
      hash = createHash('sha256').update(JSON.stringify(requestOpts.body))
    }

    return hash.digest('hex')
  }

  private async _sendRequest(request: FetchRequestParams): Promise<any> {
    const data = await fetchJson(request.url, request.opts)
    if (data.error) {
      this._logger.err(data.error)
      return data
    }
    return data
  }
}
