function encodeRpcCall (method: string, params: any): any {
  return {
    jsonrpc: '2.0',
    id: 1,
    method,
    params
  }
}

const cborSortCompareFn = (a: string, b: string): number => a.length - b.length || a.localeCompare(b)

function sortPropertiesDeep(obj: any, compareFn: (a: any, b: any) => number = cborSortCompareFn): any {
  if (typeof obj !== 'object' || Array.isArray(obj)) {
    return obj
  }
  return Object.keys(obj).sort(compareFn).reduce<Record<string, any>>((acc, prop) => {
    acc[prop] = sortPropertiesDeep(obj[prop], compareFn)
    return acc
  }, {})
}


class User {
  private _pubkeys: any;
  private _did: string;

  constructor (private didProvider: any) {}

  async auth (): Promise<void> {
    const response = await this._callRpc('3id_authenticate', { mgmtPub: true })
    this._pubkeys = response.main
  }

  get publicKeys (): any {
    // TODO - encode keys using multicodec
    return this._pubkeys
  }

  get DID (): string {
    return this._did
  }

  set DID (did: string) {
    this._did = did
  }

  async sign (payload: any, opts: any = {}): Promise<string> {
    // hack to get around timestamp before we have proper signing method in provider
    payload.iat = undefined
    payload.content = sortPropertiesDeep(payload.content)
    const jwt = await this._callRpc('3id_signClaim', { payload, did: this._did, useMgmt: opts.useMgmt })
    return jwt
  }

  //async encrypt (payload: any): Promise<any> {
  //}

  //async decrypt (ciphertext: any): Promise<any> {
  //}

  async _callRpc (method: string, params: any = {}): Promise<any> {
    const respose = await this.didProvider.send(encodeRpcCall(method, params))
    // TODO - check for errors
    return respose.result
  }
}

export default User
