import { AccountId } from 'caip'
import { AuthProvider } from './auth-provider.js'
import { asOldCaipString, CapabilityOpts, getConsentMessage, LinkProof } from './util.js'
import * as uint8arrays from 'uint8arrays'
import * as sha256 from '@stablelib/sha256'
import { StreamID } from 'streamid/lib/stream-id.js'
import { Cacao, SiwsMessage } from 'ceramic-cacao'
import { randomString } from '@stablelib/random'

export const SOLANA_TESTNET_CHAIN_REF = '4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z' // Solana testnet
export const SOLANA_DEVNET_CHAIN_REF = 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1' // Solana devnet
export const SOLANA_MAINNET_CHAIN_REF = '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' // Solana mainnet beta

export class SolanaAuthProvider implements AuthProvider {
  readonly isAuthProvider = true

  constructor(
    private readonly provider: any,
    private readonly address: string,
    private readonly chainRef: string
  ) {
    console.warn(
      'WARN: SolanaAuthProvider is not fully supported. You may encounter issues using this.'
    )
  }

  async accountId(): Promise<AccountId> {
    return new AccountId({
      address: this.address,
      chainId: `solana:${this.chainRef}`,
    })
  }

  async authenticate(message: string): Promise<string> {
    if (!this.provider.signMessage) {
      throw new Error(`Unsupported provider; provider must implement signMessage`)
    }
    const signatureBytes = await this.provider.signMessage(uint8arrays.fromString(message))
    const digest = sha256.hash(signatureBytes)
    return `0x${uint8arrays.toString(digest, 'base16')}`
  }

  async createLink(did: string): Promise<LinkProof> {
    if (!this.provider.signMessage) {
      throw new Error(`Unsupported provider; provider must implement signMessage`)
    }
    const { message, timestamp } = getConsentMessage(did, true)
    const accountID = await this.accountId()
    const signatureBytes = await this.provider.signMessage(uint8arrays.fromString(message))
    const signature = uint8arrays.toString(signatureBytes, 'base64')
    return {
      version: 2,
      type: 'solana',
      message,
      signature,
      account: asOldCaipString(accountID),
      timestamp,
    }
  }

  async requestCapability(
    sessionDID: string,
    streams: Array<StreamID | string>,
    opts: CapabilityOpts = {}
  ): Promise<Cacao> {
    if (!this.provider.signMessage) {
      throw new Error(`Unsupported provider; provider must implement signMessage`)
    }

    console.warn(
      'WARN: requestCapability is an experimental API, that is subject to change at any time.'
    )

    const domain = typeof window !== 'undefined' ? window.location.hostname : opts.domain
    if (!domain) throw new Error("Missing parameter 'domain'")

    // NOTE: To allow proper customization of the expiry date, we need a solid library to represent
    // time durations that includes edge cases. We should not try dealing with timestamps ourselves.
    const now = new Date()
    const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    const siwsMessage = new SiwsMessage({
      domain: domain,
      address: this.address,
      statement: opts.statement ?? 'Give this application access to some of your data on Ceramic',
      uri: sessionDID,
      version: opts.version ?? '1',
      nonce: opts.nonce ?? randomString(10),
      issuedAt: now.toISOString(),
      expirationTime: opts.expirationTime ?? oneDayLater.toISOString(),
      chainId: (await this.accountId()).chainId.reference,
      resources: (opts.resources ?? []).concat(
        streams.map((s) => (typeof s === 'string' ? StreamID.fromString(s) : s).toUrl())
      ),
    })

    if (opts.requestId) siwsMessage.requestId = opts.requestId

    const signatureBytes = await this.provider.signMessage(siwsMessage.signMessage())
    const signature = uint8arrays.toString(signatureBytes, 'base58btc')
    siwsMessage.signature = signature
    const cacao = Cacao.fromSiwsMessage(siwsMessage)
    return cacao
  }

  withAddress(address: string): AuthProvider {
    return new SolanaAuthProvider(this.provider, address, this.chainRef)
  }
}
