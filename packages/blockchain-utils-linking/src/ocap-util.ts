import type StreamID from '@ceramicnetwork/streamid'

export enum OcapTypes {
  EIP4361 = 'EIP-4361',
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
  type: OcapTypes
}

export interface Ocap {
  message: string // The entire "sign-in with ethereum" message in plaintext
  signature: Uint8Array
}

export interface OcapRequestParams extends OcapParams {
  address: string
  chainId: string
}

export function buildOcapRequestMessage(opts: OcapRequestParams): string {
  if (opts.type !== OcapTypes.EIP4361) {
    throw new Error('Unsupported type')
  }

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
  res += `Issued At: ${w3cDate(opts.issuedAt)} \n`

  if (opts.expiresAt) {
    res += `Expiration Time: ${w3cDate(opts.expiresAt)} \n`
  }

  if (opts.notBefore) {
    res += `Not Before: ${w3cDate(opts.notBefore)} \n`
  }

  if (opts.requestId) {
    res += `Request ID: ${opts.requestId} \n`
  }

  res += 'Resources: \n'

  for (const streamId of opts.streams) {
    res += `- ${streamId.toUrl()} \n`
  }

  return res
}

export function w3cDate(date?: number | string): string {
  let result = new Date()
  if (typeof date === 'number' || typeof date === 'string') {
    result = new Date(date)
  }
  const str = result.toISOString()
  return str.substr(0, str.length - 5) + 'Z'
}
