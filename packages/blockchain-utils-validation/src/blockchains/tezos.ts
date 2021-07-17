import { AccountID } from 'caip'
import { RemoteSigner } from '@taquito/remote-signer'
import { char2Bytes } from '@taquito/utils'
import { BlockchainHandler } from '../blockchain-handler'
import { LinkProof } from '@ceramicnetwork/blockchain-utils-linking'
import axios from 'axios'

export const ADDRESS_NOT_FOUND_ERROR = new Error(`Address not found on the Tezos blockchain`)
export const PUBLIC_KEY_NOT_PUBLISHED_ERROR = new Error(
  `Public key not published to the Tezos blockchain`
)

const namespace = 'tezos'

const FAKE_API_ENDPOINT = 'https://fake-api.example.com' // this enpoint is never actually called

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
  const request = axios.get(`https://api.tzstats.com/explorer/account/${address}`).catch(() => {
    throw ADDRESS_NOT_FOUND_ERROR
  })
  return async (): Promise<string> => {
    const result = (await (await request).data)?.pubkey
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
  const account = AccountID.parse(proof.account)
  const msg = char2Bytes(proof.message)

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
  namespace,
  validateLink,
}

export default Handler
