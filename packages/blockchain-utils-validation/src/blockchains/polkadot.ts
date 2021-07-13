import { BlockchainHandler } from '../blockchain-handler'
import { AccountID } from 'caip'
import { signatureVerify } from '@polkadot/util-crypto'
import { LinkProof } from '@ceramicnetwork/blockchain-utils-linking'

const namespace = 'polkadot'

async function validateLink(proof: LinkProof): Promise<LinkProof | null> {
  const address = new AccountID(proof.account).address
  const res = await signatureVerify(proof.message, proof.signature, address)
  return res.isValid ? proof : null
}

const Handler: BlockchainHandler = {
  namespace,
  validateLink,
}

export default Handler
