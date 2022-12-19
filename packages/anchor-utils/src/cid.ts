import type { EventFragment } from '@ethersproject/abi'
import type { Log, TransactionResponse } from '@ethersproject/providers'
import { create as createMultihash } from 'multiformats/hashes/digest'
import { CID } from 'multiformats/cid'
import { fromString } from 'uint8arrays'

import { contractInterface } from './interface.js'

export const SHA256_CODE = 0x12
export const KECCAK_256_CODE = 0x1b
export const DAG_CBOR_CODE = 0x71
export const ETH_TX_CODE = 0x93

export function createCidFromHexValue(hexValue: string): CID {
  const multihash = createMultihash(SHA256_CODE, fromString(hexValue.slice(2), 'base16'))
  return CID.create(1, DAG_CBOR_CODE, multihash)
}

export function getCidFromAnchorEventLog(log: Log): CID {
  const decodedArgs = contractInterface.decodeEventLog(
    contractInterface.events['DidAnchor(address,bytes32)'] as EventFragment,
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

const V1_PROOF_TYPE = 'f(bytes32)'

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

/**
 * Converts ETH address to CID
 * @param hash - ETH hash
 */
export function convertEthHashToCid(hexValue: string): CID {
  const multihash = createMultihash(KECCAK_256_CODE, fromString(hexValue.slice(2), 'base16'))
  return CID.create(1, ETH_TX_CODE, multihash)
}
