import { BlockchainHandler } from '../blockchain-handler'
import * as linking from '@ceramicnetwork/blockchain-utils-linking'
import * as signingTools from '@zondax/filecoin-signing-tools'
import { normalizeAccountId } from '@ceramicnetwork/common'

const namespace = 'fil'

export async function validateLink(proof: linking.LinkProof): Promise<linking.LinkProof | null> {
  // Handle legacy CAIP links
  const account = normalizeAccountId(proof.account)
  const payload = linking.filecoin.asTransaction(account.address, proof.message)
  const transaction = signingTools.transactionSerialize(payload)
  const recover = signingTools.verifySignature(proof.signature, transaction)
  if (recover) {
    return proof
  } else {
    return null
  }
}

const Handler: BlockchainHandler = {
  namespace,
  validateLink,
}

export default Handler
