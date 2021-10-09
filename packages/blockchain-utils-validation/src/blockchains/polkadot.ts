import { BlockchainHandler } from '../blockchain-handler'
import { AccountID } from 'caip'
import { signatureVerify } from '@polkadot/util-crypto'
import { LinkProof } from '@ceramicnetwork/blockchain-utils-linking'
import uint8arrays from 'uint8arrays';

const namespace = 'polkadot'

const stringHex = (str: string): string =>
  `0x${uint8arrays.toString(uint8arrays.fromString(str), 'base16')}`

async function validateLink(proof: LinkProof): Promise<LinkProof | null> {
  const address = new AccountID(proof.account).address
  const message = stringHex(proof.message)
  const res = await signatureVerify(message, proof.signature, address)
  return res.isValid ? proof : null
}

const Handler: BlockchainHandler = {
  namespace,
  validateLink,
}

export default Handler
