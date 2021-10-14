import StreamID from '@ceramicnetwork/streamid'

export interface LinkProof {
  version: number
  message: string
  signature: string
  account: string
  did?: string
  timestamp?: number
  address?: string
  type?: string
  chainId?: number
}

export interface RpcMessage {
  jsonrpc: string
  id: number
  method: string
  params: any
}

export interface ConsentMessage {
  message: string
  timestamp?: number
}

export interface OcapParams {
  did: string
  streams: Array<StreamID>
  domain: string
  statement: string
  nonce: string
  issuedAt: string
  expiresAt?: string
  notBefore?: string
  requestId?: string
}

export interface Ocap {
  message: string // The entire "sign-in with ethereum" message in plaintext
  signature: Uint8Array
}

export interface OcapRequestParams extends OcapParams {
  address: string
  chainId: string
}

export function getConsentMessage(did: string, addTimestamp = true): ConsentMessage {
  const res: any = {
    message: 'Link this account to your identity' + '\n\n' + did,
  }
  if (addTimestamp) {
    res.timestamp = Math.floor(Date.now() / 1000)
    res.message += ' \n' + 'Timestamp: ' + res.timestamp
  }
  return res
}

export function getOcapRequestMessage(opts: OcapRequestParams): string {
  let res = ''

  res += `${opts.domain} wants you to sign in with your Ethereum account: \n`
  res += opts.address + '\n'

  if (opts.statement) {
    res += '\n'
    res += opts.statement
    res += '\n\n'
  }

  res += `URI: ${opts.did} \n`
  res += 'Version: 1 \n'
  res += `Chain ID: ${opts.chainId} \n`

  if (opts.nonce.length < 8) {
    throw new Error(`Nonce must be at least 8 characters`)
  }

  res += `Nonce: ${opts.nonce} \n`
  res += `Issued At: ${opts.issuedAt} \n`

  if (opts.expiresAt) {
    res += `Expiration Time: ${opts.expiresAt} \n`
  }

  if (opts.notBefore) {
    res += `Not Before: ${opts.notBefore} \n`
  }

  if (opts.requestId) {
    res += `Request ID: ${opts.requestId} \n`
  }

  res += 'Resources: \n'

  for (const streamId of opts.streams) {
    res += `- ${streamId.toString()} \n`
  }

  return res
}

export function encodeRpcMessage(method: string, params?: any): any {
  return {
    jsonrpc: '2.0',
    id: 1,
    method,
    params,
  }
}
