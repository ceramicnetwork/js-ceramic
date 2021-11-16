import { AccountId } from 'caip'
import { verifyTx } from '@tendermint/sig'
import { BlockchainHandler } from '../blockchain-handler'
import { LinkProof, cosmos } from '@ceramicnetwork/blockchain-utils-linking'
import * as uint8arrays from 'uint8arrays'
import { normalizeAccountId } from '../util'

const namespace = 'cosmos'

const stringEncode = (str: string): string =>
  uint8arrays.toString(uint8arrays.fromString(str), 'base64pad')
const stringDecode = (str: string): string =>
  uint8arrays.toString(uint8arrays.fromString(str, 'base64pad'))

export async function validateLink(proof: LinkProof): Promise<LinkProof | null> {
  // Handle legacy CAIP links
  const account = normalizeAccountId(proof.account)
  const encodedMsg = stringEncode(proof.message)
  const payload = cosmos.asTransaction(account.address, encodedMsg)
  const sigObj = JSON.parse(stringDecode(proof.signature))
  const Tx = { ...payload, ...cosmos.getMetaData(), signatures: [sigObj] }
  const is_sig_valid = verifyTx(Tx, cosmos.getMetaData())
  return is_sig_valid ? proof : null
}

const Handler: BlockchainHandler = {
  namespace,
  validateLink,
}

export default Handler
