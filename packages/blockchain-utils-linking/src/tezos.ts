import { AccountID } from 'caip'
import { AuthProvider } from './auth-provider'
import { getConsentMessage, LinkProof } from './util'
import { hash } from '@stablelib/sha256'
import * as uint8arrays from 'uint8arrays'
import { SetProviderOptions, TezosToolkit } from '@taquito/taquito'
import { char2Bytes } from '@taquito/utils'

export type TezosProvider = SetProviderOptions

/**
 * initializes the TezosToolkit with the given {TezosProvider} and returns the {TezosToolkit}
 *
 * @param {TezosProvider} provider - the provider to use for initializing the TezosToolkit
 * @returns {TezosToolkit} the initialized TezosToolkit
 */
function getTezosToolkit(provider: TezosProvider) {
  // initialize the Tezos RPC client
  const Tezos = new TezosToolkit('https://mainnet-tezos.giganode.io')
  Tezos.setProvider(provider)
  return Tezos
}

/**
 * signs a message with the active address and returns the signature
 *
 * @param {TezosProvider} provider - the provider to use for signing
 * @param {string} message - the message to sign
 * @returns {Promise<string>} the signature prefixed with the signing method
 */
async function sign(provider: TezosProvider, message: string): Promise<string> {
  const Tezos = getTezosToolkit(provider)
  // sign the message with the active address and get the signature with the type prefixed
  const { prefixSig: signature } = await Tezos.signer.sign(char2Bytes(message))
  return signature
}

/**
 * get the active address from the {TezosProvider}
 *
 * @param {TezosProvider} provider - the provider to use for getting the active account
 * @returns {Promise<string>} - a promise that resolves to the active account's address
 */
async function getActiveAddress(provider: TezosProvider) {
  const Tezos = getTezosToolkit(provider)
  const activeAddress = await Tezos.wallet.pkh({ forceRefetch: true })
  return activeAddress
}

/**
 * This is an implementation of {AuthProvider} for the Tezos network.
 * It uses the Tezos RPC client to get the active account's address and sign the
 * message with the active account's address.
 *
 * @param {TezosProvider} provider - the provider to use signing the link proof
 * @param {string} address - the address to sign the link proof with
 * @param {string} chainRef - the chain reference to link to
 */
export class TezosAuthProvider implements AuthProvider {
  readonly isAuthProvider = true

  constructor(private readonly provider: TezosProvider, private readonly chainRef: string) {}

  /**
   * @inheritdoc
   */
  async authenticate(message: string): Promise<string> {
    const signature = await sign(this.provider, message)
    const digest = hash(uint8arrays.fromString(signature))
    return `0x${uint8arrays.toString(digest, 'base16')}`
  }

  /**
   * @inheritdoc
   */
  async createLink(did: string): Promise<LinkProof> {
    // get consent message
    const { message, timestamp } = getConsentMessage(did)
    // sign the message with the active address
    const signature = await sign(this.provider, message)
    const address = await getActiveAddress(this.provider)
    // generate account ID
    const caipAccount = new AccountID({
      address,
      chainId: `tezos:${this.chainRef}`,
    })
    // create link proof
    const proof: LinkProof = {
      version: 1,
      message,
      signature,
      account: caipAccount.toString(),
      timestamp,
    }
    return proof
  }

  /**
   * @inheritdoc
   */
  async accountId(): Promise<AccountID> {
    const address = await getActiveAddress(this.provider)
    return new AccountID({
      address,
      chainId: `tezos:${this.chainRef}`,
    })
  }

  /**
   * This is unsupported
   *
   * @throws {Error} - always throws an error
   */
  withAddress(_address: string): AuthProvider {
    throw new Error('TezosAuthProvider does not support withAddress')
  }
}
