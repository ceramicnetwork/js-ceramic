import { AuthProvider } from './auth-provider.js'
import { AccountId } from 'caip'
import { asOldCaipString, getConsentMessage, LinkProof } from './util.js'
import type { MessageParams } from '@zondax/filecoin-signing-tools'
import * as uint8arrays from 'uint8arrays'

export class FilecoinAuthProvider implements AuthProvider {
  readonly isAuthProvider = true

  constructor(private readonly provider: any, private readonly address: string) {
    console.warn(
      'WARN: FilecoinAuthProvider is not fully supported. You may encounter issues using this.'
    )
  }

  async accountId(): Promise<AccountId> {
    const prefix = this.address[0]
    const chainId = `fil:${prefix}`
    return new AccountId({ address: this.address, chainId })
  }

  async authenticate(message: string): Promise<string> {
    const payload = asTransaction(this.address, JSON.stringify(message))
    const signatureResponse = await this.provider.sign(this.address, payload)
    return signatureResponse.Signature.Data
  }

  async createLink(did: string): Promise<LinkProof> {
    const { message, timestamp } = getConsentMessage(did, true)
    const payload = asTransaction(this.address, message)
    const signatureResponse = await this.provider.sign(this.address, payload)
    const accountId = await this.accountId()
    return {
      version: 2,
      type: 'eoa-tx',
      message: message,
      signature: signatureResponse.Signature.Data,
      account: asOldCaipString(accountId),
      timestamp: timestamp,
    }
  }

  withAddress(address: string): AuthProvider {
    return new FilecoinAuthProvider(this.provider, address)
  }
}

export function asTransaction(address: string, message: string): MessageParams {
  const messageParams = uint8arrays.toString(uint8arrays.fromString(message), 'base64')
  return {
    From: address,
    To: address,
    Value: '0',
    Method: 0,
    GasPrice: '1',
    GasLimit: 1000,
    Nonce: 0,
    Params: messageParams,
    GasFeeCap: '1',
    GasPremium: '1',
  }
}
