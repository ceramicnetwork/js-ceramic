import { defaultAbiCoder } from '@ethersproject/abi'
import type { Log } from '@ethersproject/providers'
import { CID } from 'multiformats/cid'
import { decode } from 'multiformats/hashes/digest'
import { toString } from 'uint8arrays'

import { createAnchorProof } from '../utils.js'

export async function delay(time: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, time))
}

export const bytes32 = new Uint8Array([
  0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 5, 6, 7,
])

export const transactionHashCid = CID.parse(
  'bagjqcgza7mvdlzewbfbq35peso2atjydg3ekalew5vmze7w2a5cbhmav4rmq'
)

export function createLog(bytes = bytes32, txHash = transactionHashCid): Log {
  return {
    data: defaultAbiCoder.encode(['bytes32'], [bytes]),
    transactionHash: '0x' + toString(decode(txHash.multihash.bytes).digest, 'base16'),
  } as Log
}

export const mockedLogs = [0, 1, 2].map((i) =>
  createLog(new Uint8Array(new Array(32).fill(i)))
) as [Log, Log, Log]

export const mockedLogsProofs = mockedLogs.map((log) => createAnchorProof('eip155:1337', log))
