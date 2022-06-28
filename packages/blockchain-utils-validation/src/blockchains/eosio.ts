import { SigningTools } from '@smontero/eosio-signing-tools'
import { BlockchainHandler } from '../blockchain-handler.js'
import * as linking from '@ceramicnetwork/blockchain-utils-linking'
import { normalizeAccountId } from '@ceramicnetwork/common'

const namespace = 'eosio'

export async function validateLink(proof: linking.LinkProof): Promise<linking.LinkProof | null> {
  const { message, signature, account } = proof
  const accountID = normalizeAccountId(account)
  const { address, chainId } = accountID
  const success = await SigningTools.verifySignature({
    chainId: chainId.reference,
    account: address,
    signature,
    data: linking.eosio.toPayload(message, accountID),
  })
  return success ? proof : null
}

export const handler: BlockchainHandler = {
  namespace,
  validateLink,
}
