import { BlockchainHandler } from '../blockchain-handler.js'
import { LinkProof } from '@ceramicnetwork/blockchain-utils-linking'
import { ed25519 } from '@noble/curves/ed25519'
import * as uint8arrays from 'uint8arrays'
import { normalizeAccountId } from '@ceramicnetwork/common'

const namespace = 'solana'

export async function validateLink(proof: LinkProof): Promise<LinkProof | null> {
  const account = normalizeAccountId(proof.account)
  const pubKey = uint8arrays.fromString(account.address, 'base58btc')
  const msg = proof.message
  const sig = uint8arrays.fromString(proof.signature, 'base64')
  const isValid = ed25519.verify(sig, uint8arrays.fromString(msg), pubKey)
  return isValid ? proof : null
}

export const handler: BlockchainHandler = {
  namespace,
  validateLink,
}
