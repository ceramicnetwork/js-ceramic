import {
  AnchorServiceAuth,
  CeramicApi,
  DiagnosticsLogger,
  FetchOpts,
  fetchJson
} from "@ceramicnetwork/common"

export class DIDAnchorServiceAuth implements AnchorServiceAuth {
  nonce: string
  ceramic: CeramicApi
  private readonly didApiEndpoint: string
  private readonly nonceApiEndpoint: string
  private readonly _logger: DiagnosticsLogger

  constructor(
    ceramic: CeramicApi,
    readonly anchorServiceUrl: string,
    logger: DiagnosticsLogger,
  ) {
    this.ceramic = ceramic
    this.didApiEndpoint = this.anchorServiceUrl + '/api/v0/auth/did'
    this.nonceApiEndpoint = this.anchorServiceUrl + '/api/v0/auth/nonce'
    this._logger = logger
  }

  async init(): Promise<void> {
    // TODO: error handling here for nonce
    this.nonce = await this.lookupNonce()
  }

  async lookupNonce(): Promise<string> {
    return await this.sendAuthenticatedRequest(this.nonceApiEndpoint)
  }

  async sendAuthenticatedRequest(url: URL | string, opts?: FetchOpts): Promise<any> {
    const jws = this.ceramic.did.createJWS({})
    const headers = {...opts.headers, 'authorization': `Basic ${jws}`}
    return await this._sendRequest(url, { ...opts, headers})
  }

  private async _sendRequest(url: URL| string, opts?: FetchOpts): Promise<any> {
    return await fetchJson(url, opts)
  }
}

/**
 * when implementing an anchor service you can add an auth service to it
 * the auth service will handle all your requests by signing and sending them
 */
