import { AccountId, ChainId } from 'caip'
import { RemoteSigner } from '@taquito/remote-signer'
import { BlockchainHandler } from '../blockchain-handler'
import { LinkProof, tezos } from '@ceramicnetwork/blockchain-utils-linking'
import fetch from 'cross-fetch'
import * as uint8arrays from 'uint8arrays'

export const ADDRESS_NOT_FOUND_ERROR = new Error(`Address not found on the Tezos blockchain`)
export const PUBLIC_KEY_NOT_PUBLISHED_ERROR = new Error(
  `Public key not published to the Tezos blockchain`
)

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore TS can't resolve these, but they are there and tests pass
const { TEZOS_NAMESPACE, TEZOS_CHAIN_REF } = tezos

const FAKE_API_ENDPOINT = 'https://fake-api.example.com' // this enpoint is never actually called

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
 * creates a function which attempts to resolve the public key associated with the wallet address
 *
 * @param {string} address - a Tezos wallet address to lookup
 * @returns {() => Promise<string>} - the fetching function for the public key of the address
 * @throws {Error} - if the address is not found on the blockchain
 * @throws {Error} - if the public key is not published to the blockchain
 */
function publicKeyFinder(address: string): () => Promise<string> {
  // request the public key from the Tezos blockchain
  const request = fetch(`https://api.tzstats.com/explorer/account/${address}`).catch((e: any) => {
    throw ADDRESS_NOT_FOUND_ERROR
  })
  return async (): Promise<string> => {
    const response = await request
    const json = await response.json()
    const result = json?.pubkey
    if (result) {
      return result
    } else {
      throw PUBLIC_KEY_NOT_PUBLISHED_ERROR
    }
  }
}

// can only validate proofs with wallet addresses (public key hashes) that have:
// - at least one transaction on the blockchain
// - their public key published to the blockchain
export async function validateLink(proof: LinkProof): Promise<LinkProof | null> {
  const account = AccountId.parse(proof.account)
  const chainId = new ChainId(account.chainId)

  // only support Tezos mainnet for now
  if (chainId.reference !== TEZOS_CHAIN_REF) {
    return null
  }
  const msg = encodeMessage(proof.message)

  const verifier = new RemoteSigner(account.address, FAKE_API_ENDPOINT)
  verifier.publicKey = publicKeyFinder(account.address)

  try {
    const is_sig_valid: boolean = await verifier.verify(msg, proof.signature)

    return is_sig_valid ? proof : null
  } catch (ignored) {
    return null
  }
}

const Handler: BlockchainHandler = {
  namespace: TEZOS_NAMESPACE,
  validateLink,
}

export default Handler
