import { AuthProvider } from './auth-provider'
import { AccountID } from 'caip'
import { getConsentMessage, LinkProof } from './util'
import { normalizeAccountId } from './ethereum'
import * as sha256Stable from '@stablelib/sha256'
import * as uint8arrays from 'uint8arrays'

const maxWordLength = 12

export class EosioAuthProvider implements AuthProvider {
  readonly isAuthProvider = true

  constructor(private readonly provider: any, private readonly address: string) {}

  async accountId(): Promise<AccountID> {
    const chainId = toCAIPChainId(await this.provider.getChainId())
    return new AccountID({
      address: this.address,
      chainId: `eosio:${chainId}`,
    })
  }

  async authenticate(message: string): Promise<string> {
    const accountID = await this.accountId()
    const signedPayload = await toSignedPayload(message, accountID, this.provider)
    const signatureBytes = uint8arrays.fromString(signedPayload)
    const digest = sha256Stable.hash(signatureBytes)
    return `0x${uint8arrays.toString(digest, 'base16')}`
  }

  async createLink(did: string): Promise<LinkProof> {
    const consentMessage = getConsentMessage(did)
    const accountID = await this.accountId()
    const signedPayload = await toSignedPayload(consentMessage.message, accountID, this.provider)
    return {
      version: 1,
      type: 'eosio',
      message: consentMessage.message,
      signature: signedPayload,
      account: accountID.toString(),
      timestamp: consentMessage.timestamp,
    }
  }

  withAddress(address: string): AuthProvider {
    return new EosioAuthProvider(this.provider, address)
  }
}

function toCAIPChainId(chainId: string): string {
  return chainId.substr(0, 32)
}

function sanitize(str: string, size: number): string {
  return str.replace(/\s/g, ' ').replace(new RegExp(`(\\S{${size}})`, 'g'), '$1 ')
}

export function toPayload(message: string, accountID: AccountID): string {
  const { address, chainId } = accountID
  const payload = `${message} [For: ${address} on chain: ${chainId}]`
  return sanitize(payload, maxWordLength)
}

export async function toSignedPayload(
  message: string,
  accountID: AccountID,
  provider: any
): Promise<string> {
  accountID = normalizeAccountId(accountID)
  const {
    chainId: { reference: requestedChainId },
    address,
  } = accountID
  const accountName = await provider.getAccountName()
  const chainId = toCAIPChainId(await provider.getChainId())

  if (chainId !== requestedChainId) {
    throw new Error(
      `Provider returned a different chainId than requested [returned: ${chainId}, requested: ${requestedChainId}]`
    )
  }
  if (accountName !== address) {
    throw new Error(
      `Provider returned a different account than requested [returned: ${accountName}, requested: ${address}]`
    )
  }
  const payload = toPayload(message, accountID)
  const [key] = await provider.getKeys()
  return provider.signArbitrary(key, payload)
}
