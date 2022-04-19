import type { AccountId } from "caip"

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

export interface CapabilityOpts {
  domain?: string
  statement?: string
  version?: string
  nonce?: string
  requestId?: string
  expirationTime?: string
  resources?: Array<string>
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

export function encodeRpcMessage(method: string, params?: any): any {
  return {
    jsonrpc: '2.0',
    id: 1,
    method,
    params,
  }
}

export function asOldCaipString(input: AccountId): string {
  return `${input.address}@${input.chainId.namespace}:${input.chainId.reference}`
}
