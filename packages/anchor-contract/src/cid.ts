import type { EventFragment } from '@ethersproject/abi'
import type { Log, TransactionResponse } from '@ethersproject/providers'
import { create as createMultihash } from 'multiformats/hashes/digest'
import { CID } from 'multiformats/cid'
import { fromString } from 'uint8arrays'

import { contractInterface } from './interface.js'

const SHA256_CODE = 0x12
const DAG_CBOR_CODE = 0x71
const V1_PROOF_TYPE = 'f(bytes32)'

export function createCidFromHexValue(value: string): CID {
  const multihash = createMultihash(SHA256_CODE, fromString(value.slice(2), 'base16'))
  return CID.create(1, DAG_CBOR_CODE, multihash)
}

export function getCidFromAnchorEventLog(log: Log): CID {
  const decodedArgs = contractInterface.decodeEventLog(
    contractInterface.events['DidAnchor'] as EventFragment,
    log.data
  )
  return createCidFromHexValue(decodedArgs[1])
}

const getCidFromV0Transaction = (txResponse: TransactionResponse): CID => {
  const withoutPrefix = txResponse.data.replace(/^(0x0?)/, '')
  return CID.decode(fromString(withoutPrefix.slice(1), 'base16'))
}

const getCidFromV1Transaction = (txResponse: TransactionResponse): CID => {
  const decodedArgs = contractInterface.decodeFunctionData('anchorDagCbor', txResponse.data)
  return createCidFromHexValue(decodedArgs[0])
}

/**
 * Parses the transaction data to recover the CID.
 * @param txType transaction type of the anchor proof. Currently support `raw` and `f(bytes32)`
 * @param txResponse the retrieved transaction from the ethereum blockchain
 * @returns
 */
export const getCidFromTransaction = (txType: string, txResponse: TransactionResponse): CID => {
  if (txType === V1_PROOF_TYPE) {
    return getCidFromV1Transaction(txResponse)
  } else {
    return getCidFromV0Transaction(txResponse)
  }
}
