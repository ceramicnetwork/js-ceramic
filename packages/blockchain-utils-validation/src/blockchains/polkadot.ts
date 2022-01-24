import { BlockchainHandler } from '../blockchain-handler.js'
import { signatureVerify } from '@polkadot/util-crypto'
import { LinkProof } from '@ceramicnetwork/blockchain-utils-linking'
import * as uint8arrays from 'uint8arrays'
import { normalizeAccountId } from '@ceramicnetwork/common'

const namespace = 'polkadot'

const stringHex = (str: string): string =>
  `0x${uint8arrays.toString(uint8arrays.fromString(str), 'base16')}`

async function validateLink(proof: LinkProof): Promise<LinkProof | null> {
  const address = normalizeAccountId(proof.account).address
  const message = stringHex(proof.message)
  const res = await signatureVerify(message, proof.signature, address)
  return res.isValid ? proof : null
}

export const handler: BlockchainHandler = {
  namespace,
  validateLink,
}
