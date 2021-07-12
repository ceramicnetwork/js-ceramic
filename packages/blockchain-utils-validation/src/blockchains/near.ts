import { AccountID } from 'caip'
import { verify } from '@stablelib/ed25519'
import { BlockchainHandler } from '../blockchain-handler'
import { LinkProof } from '@ceramicnetwork/blockchain-utils-linking'
import * as uint8arrays from 'uint8arrays'

const stringEncode = (str: string): string =>
  uint8arrays.toString(uint8arrays.fromString(str), 'base64pad')

const namespace = 'near'

export async function validateLink(proof: LinkProof): Promise<LinkProof | null> {
  const account = AccountID.parse(proof.account)
  const msg = uint8arrays.fromString(stringEncode(proof.message))
  const sig = uint8arrays.fromString(proof.signature, 'base64pad')
  const acct = uint8arrays.fromString(account.address, 'base64pad')

  // REF: https://github.com/StableLib/stablelib/blob/master/packages/ed25519/ed25519.ts#L825
  const is_sig_valid: boolean = verify(acct, msg, sig)

  return is_sig_valid ? proof : null
}

const Handler: BlockchainHandler = {
  namespace,
  validateLink,
}

export default Handler
