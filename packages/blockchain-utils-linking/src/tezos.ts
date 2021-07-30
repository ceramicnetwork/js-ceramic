import { AccountID } from 'caip'
import { AuthProvider } from './auth-provider'
import { getConsentMessage, LinkProof } from './util'
import { hash } from '@stablelib/sha256'
import * as uint8arrays from 'uint8arrays'
import type { Signer, TezosToolkit, Wallet } from '@taquito/taquito'

export const TEZOS_NAMESPACE = 'tezos'
export const TEZOS_CHAIN_REF = 'NetXdQprcVkpaWU' // Tezos mainnet

export type TezosProvider = TezosToolkit & {
  // the below are requried for the TezosProvider interface
  wallet: Wallet
  signer: Signer
}

// should be the same as @taquito/utils char2Bytes()
// exported for testing to ensure above
/**
 * converts a utf8 string to a hex string
 *
 * @internal
 *
 * @param {string} input - the string to convert
 * @returns {string} the converted hex string
 */
function char2Bytes(input: string): string {
  return uint8arrays.toString(uint8arrays.fromString(input, 'utf8'), 'base16')
}

/**
 * signs a message with the active address and returns the signature
 *
 * @param {TezosProvider} provider - the provider to use for signing
 * @param {string} message - the message to sign
 * @returns {Promise<string>} the signature prefixed with the signing method
 */
async function sign(provider: TezosProvider, message: string): Promise<string> {
  const Tezos = provider
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
async function getActiveAddress(provider: TezosProvider): Promise<string> {
  const Tezos = provider
  return Tezos.wallet.pkh({ forceRefetch: true })
}

/**
 * This is an implementation of {AuthProvider} for the Tezos network.
 * It uses the Tezos RPC client to get the active account's address and sign the
 * message with the active account's address.
 *
 * @param {TezosProvider} provider - the provider to use signing the link proof and getting the active account's address
 */
export class TezosAuthProvider implements AuthProvider {
  readonly isAuthProvider = true

  constructor(private readonly provider: TezosProvider) { }

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
      chainId: `${TEZOS_NAMESPACE}:${TEZOS_CHAIN_REF}`,
    })
    // create link proof
    const proof: LinkProof = {
      version: 2,
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
      chainId: `${TEZOS_NAMESPACE}:${TEZOS_CHAIN_REF}`,
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
