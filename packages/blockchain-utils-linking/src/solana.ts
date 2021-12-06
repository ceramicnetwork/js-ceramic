import { AccountID } from 'caip'
import { AuthProvider } from './auth-provider'
import { getConsentMessage, LinkProof } from './util'
import * as uint8arrays from 'uint8arrays'
import * as sha256 from '@stablelib/sha256'

export const SOLANA_TESTNET_CHAIN_REF = '4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z' // Solana testnet
export const SOLANA_DEVNET_CHAIN_REF = 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1' // Solana devnet
export const SOLANA_MAINNET_CHAIN_REF = '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' // Solana mainnet beta



export class SolanaAuthProvider implements AuthProvider {
  readonly isAuthProvider = true

  constructor(
    private readonly provider: any,
    private readonly address: string,
    private readonly chainRef: string
  ) { }

  async accountId(): Promise<AccountID> {
    return new AccountID({
      address: this.address,
      chainId: `solana:${this.chainRef}`,
    })
  }

  async authenticate(message: string): Promise<string> {
    if (!this.provider.signMessage) {
      throw new Error(`Unsupported provider; provider must implement signMessage`)
    }
    const signatureBytes = await this.provider.signMessage(uint8arrays.fromString(message));
    const digest = sha256.hash(signatureBytes)
    return `0x${uint8arrays.toString(digest, 'base16')}`
  }

  async createLink(did: string): Promise<LinkProof> {
    if (!this.provider.signMessage) {
      throw new Error(`Unsupported provider; provider must implement signMessage`)
    }
    const { message, timestamp } = getConsentMessage(did, true)
    const accountID = await this.accountId()
    const signatureBytes = await this.provider.signMessage(uint8arrays.fromString(message));
    const signature = uint8arrays.toString(signatureBytes, 'base64')
    return {
      version: 2,
      type: 'solana',
      message,
      signature,
      account: accountID.toString(),
      timestamp,
    }
  }

  withAddress(address: string): AuthProvider {
    return new SolanaAuthProvider(this.provider, address, this.chainRef)
  }
}
