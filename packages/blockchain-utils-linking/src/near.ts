import { AccountId } from 'caip'
import { AuthProvider } from './auth-provider.js'
import { getConsentMessage, LinkProof } from './util.js'
import * as uint8arrays from 'uint8arrays'
import * as nearApiJs from 'near-api-js'
import * as sha256 from '@stablelib/sha256'

const getSignature = async (
  signer: nearApiJs.Signer,
  accountId: string,
  message: any,
  networkId: string
): Promise<string> => {
  const signed = await signer.signMessage(message, accountId, networkId)
  return uint8arrays.toString(signed.signature, 'base64')
}

export class NearAuthProvider implements AuthProvider {
  readonly isAuthProvider = true

  constructor(
    private readonly near: any,
    private readonly accountName: string,
    private readonly chainRef: string
  ) {}

  async authenticate(message: string): Promise<string> {
    const key = await this.near.connection.signer.keyStore.getKey(this.chainRef, this.accountName)
    const signer = await nearApiJs.InMemorySigner.fromKeyPair(this.chainRef, this.accountName, key)
    const digest = sha256.hash(uint8arrays.fromString(message))
    const { signature } = await signer.signMessage(digest, this.accountName, this.chainRef)
    return uint8arrays.toString(signature, 'base16')
  }

  async createLink(did: string): Promise<LinkProof> {
    const key = await this.near.connection.signer.keyStore.getKey(this.chainRef, this.accountName)
    const signer = await nearApiJs.InMemorySigner.fromKeyPair(this.chainRef, this.accountName, key)
    const { message, timestamp } = getConsentMessage(did, true)
    const signature = await getSignature(signer, this.accountName, message, this.chainRef)
    const account = await this.accountId()
    return {
      version: 2,
      type: 'near',
      message,
      signature,
      account: account.toString(),
      timestamp,
    }
  }

  async accountId(): Promise<AccountId> {
    const key = await this.near.connection.signer.keyStore.getKey(this.chainRef, this.accountName)
    const signer = await nearApiJs.InMemorySigner.fromKeyPair(this.chainRef, this.accountName, key)
    const publicKey = await signer.getPublicKey(this.accountName, this.chainRef)
    const address = uint8arrays.toString(publicKey.data, 'base58btc')
    return new AccountId({
      address: address,
      chainId: `near:${this.chainRef}`,
    })
  }

  withAddress(address: string): AuthProvider {
    return new NearAuthProvider(this.near, address, this.chainRef)
  }
}
