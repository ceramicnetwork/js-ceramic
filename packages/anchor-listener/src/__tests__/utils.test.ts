import { getCidFromAnchorEventLog } from '@ceramicnetwork/anchor-utils'
import type { Block } from '@ethersproject/providers'

import { createAnchorProof } from '../utils.js'

import { createLog, transactionHashCid } from './test-utils.js'

describe('utils', () => {
  test('createAnchorProof() creates an AnchorProof object', () => {
    const block = { number: 10, timestamp: 1000 } as Block
    const log = createLog()
    const proof = createAnchorProof('eip155:1337', block, log)

    expect(proof).toMatchObject({
      chainId: 'eip155:1337',
      blockNumber: block.number,
      blockTimestamp: block.timestamp,
      txHash: expect.any(Object),
      root: expect.any(Object),
    })
    expect(proof.txHash.equals(transactionHashCid)).toBe(true)
    expect(proof.root.equals(getCidFromAnchorEventLog(log))).toBe(true)
  })
})
