import { AccountId } from 'caip'
import { SigningTools } from '@smontero/eosio-signing-tools'
import { BlockchainHandler } from '../blockchain-handler'
import * as linking from '@ceramicnetwork/blockchain-utils-linking'
import { normalizeAccountId } from '../util'

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

const Handler: BlockchainHandler = {
  namespace,
  validateLink,
}

export default Handler
