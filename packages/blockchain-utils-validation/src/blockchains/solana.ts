import { BlockchainHandler } from '../blockchain-handler'
import { LinkProof } from '@ceramicnetwork/blockchain-utils-linking'
import * as uint8arrays from 'uint8arrays'
import crypto from 'crypto'
import nacl from 'tweetnacl'
import { AccountID } from 'caip'

const verifySignature = async (
  pubKey: Uint8Array,
  message: string,
  signature: Uint8Array
): Promise<Boolean> => {
  const verified = nacl.sign.detached.verify(
    uint8arrays.fromString(message),
    signature,
    pubKey
  )
  return verified
}

const namespace = 'solana'

export async function validateLink(proof: LinkProof): Promise<LinkProof | null> {
  const pubKey = uint8arrays.fromString(new AccountID(proof.account).address, "base58btc")
  const msg = proof.message
  const sig = uint8arrays.fromString(proof.signature, 'base64')
  const is_sig_valid = await verifySignature(pubKey, msg, sig)
  return is_sig_valid ? proof : null
}

const Handler: BlockchainHandler = {
  namespace,
  validateLink,
}

export default Handler
