import { BlockchainHandler } from '../blockchain-handler.js'
import { LinkProof } from '@ceramicnetwork/blockchain-utils-linking'
import * as uint8arrays from 'uint8arrays'
import { normalizeAccountId } from '@ceramicnetwork/common'
import nacl from 'tweetnacl';
import { Base64DataBuffer } from "@mysten/sui.js";


const verifySignature = async (
  pubKey: Uint8Array,
  message: string,
  signature: Uint8Array
): Promise<boolean> => {
  const signData = new Base64DataBuffer(new TextEncoder().encode(message));
  const verified = nacl.sign.detached.verify(
    signData.getData(),
    signature,
    pubKey
  )
  return verified
}

const namespace = 'sui'

export async function validateLink(proof: LinkProof): Promise<LinkProof | null> {
  const pubKey = uint8arrays.fromString(normalizeAccountId(proof.account).address, 'base64')
  const msg = proof.message
  const sig = uint8arrays.fromString(proof.signature, 'base64')
  const is_sig_valid = await verifySignature(pubKey, msg, sig)
  return is_sig_valid ? proof : null
}

export const handler: BlockchainHandler = {
  namespace,
  validateLink,
}
