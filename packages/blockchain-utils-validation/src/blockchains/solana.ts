import { BlockchainHandler } from '../blockchain-handler.js'
import { LinkProof } from '@ceramicnetwork/blockchain-utils-linking'
import * as uint8arrays from 'uint8arrays'
import { verify } from '@stablelib/ed25519'
import { normalizeAccountId } from '@ceramicnetwork/common'

const verifySignature = async (
  pubKey: Uint8Array,
  message: string,
  signature: Uint8Array
): Promise<boolean> => {
  const verified = verify(pubKey, uint8arrays.fromString(message), signature)
  return verified
}

const namespace = 'solana'

export async function validateLink(proof: LinkProof): Promise<LinkProof | null> {
  const account = normalizeAccountId(proof.account)
  const pubKey = uint8arrays.fromString(account.address, 'base58btc')
  const msg = proof.message
  const sig = uint8arrays.fromString(proof.signature, 'base64')
  const is_sig_valid = await verifySignature(pubKey, msg, sig)
  return is_sig_valid ? proof : null
}

export const handler: BlockchainHandler = {
  namespace,
  validateLink,
}
