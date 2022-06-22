import { AccountId } from 'caip'
import { AuthProvider } from './auth-provider.js'
import { asOldCaipString, getConsentMessage, LinkProof } from './util.js'
import * as uint8arrays from 'uint8arrays'

const stringHex = (str: string): string =>
  `0x${uint8arrays.toString(uint8arrays.fromString(str), 'base16')}`

const CHAIN_ID = 'polkadot:b0a8d493285c2df73290dfb7e61f870f'

export class PolkadotAuthProvider implements AuthProvider {
  readonly isAuthProvider = true

  constructor(private readonly provider: any, private readonly address: string) {
    console.warn(
      'WARN: PolkadotAuthProvider is not fully supported. You may encounter issues using this.'
    )
  }

  async authenticate(message: string): Promise<string> {
    throw new Error(`Not Implemented: PolkadotAuthProvider#authenticate, ${message}`)
  }

  async createLink(did: string): Promise<LinkProof> {
    const { message, timestamp } = getConsentMessage(did)
    const linkMessageHex = stringHex(message)
    const account = await this.accountId()
    const res = await this.provider.signRaw({
      address: this.address,
      data: linkMessageHex,
      type: 'bytes',
    })
    return {
      version: 2,
      type: 'eoa',
      message: message,
      signature: res.signature,
      account: asOldCaipString(account),
      timestamp: timestamp,
    }
  }

  async accountId(): Promise<AccountId> {
    return new AccountId({ address: this.address, chainId: CHAIN_ID })
  }

  withAddress(address: string): AuthProvider {
    return new PolkadotAuthProvider(this.provider, address)
  }
}
