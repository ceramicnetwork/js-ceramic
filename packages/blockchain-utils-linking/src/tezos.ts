import { AccountId } from 'caip'
import { AuthProvider } from './auth-provider'
import { getConsentMessage, LinkProof } from './util'
import { hash } from '@stablelib/sha256'
import * as uint8arrays from 'uint8arrays'
import type { Signer } from '@taquito/taquito'

export const TEZOS_NAMESPACE = 'tezos'
export const TEZOS_CHAIN_REF = 'NetXdQprcVkpaWU' // Tezos mainnet

export interface TezosProvider {
  // the below is requried from TezosToolkit
  signer: Signer
}

/**
 * Encodes a message to its Micheline string representation
 *
 * @param {string} text - the message to Encode
 * @returns {string} the message encoded to the micheline format
 *
 * References:
 * - https://github.com/Cryptonomic/ConseilJS/blob/fb718632d6ce47718dad5aa77c67fc514afaa0b9/src/chain/tezos/lexer/Micheline.ts#L62L71
 * - https://tezos.gitlab.io/shell/micheline.html
 */
function encodeMessage(text: string): string {
  const michelinePrefix = '05'
  const stringPrefix = '01'
  const len = ('0000000' + text.length.toString(16)).slice(-8)

  text = uint8arrays.toString(uint8arrays.fromString(text, 'utf-8'), 'hex')
  return michelinePrefix + stringPrefix + len + text
}

/**
 * signs a message with the active address and returns the signature
 *
 * @param {TezosProvider} provider - the provider to use for signing
 * @param {string} message - the message to sign
 * @returns {Promise<string>} the signature prefixed with the signing method
 */
async function sign(provider: TezosProvider, message: string): Promise<string> {
  // sign the message with the active address and get the signature with the type prefixed
  message = encodeMessage(message)
  const { prefixSig: signature } = await provider.signer.sign(message)
  return signature
}

/**
 * get the active address from the {TezosProvider}
 *
 * @param {TezosProvider} provider - the provider to use for getting the active account
 * @returns {Promise<string>} - a promise that resolves to the active account's address
 */
async function getActiveAddress(provider: TezosProvider): Promise<string> {
  return provider.signer.publicKeyHash()
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

  constructor(private readonly provider: TezosProvider) {
    if (provider.signer === undefined) {
      throw new Error('a `Signer` is required to use the `TezosAuthProvider`')
    }
  }

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
    const caipAccount = new AccountId({
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
  async accountId(): Promise<AccountId> {
    const address = await getActiveAddress(this.provider)
    return new AccountId({
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
