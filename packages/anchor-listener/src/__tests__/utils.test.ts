import { getCidFromAnchorEventLog } from '@ceramicnetwork/anchor-utils'

import { createAnchorProof } from '../utils.js'

import { createLog, transactionHashCid } from './test-utils.js'

describe('utils', () => {
  test('createAnchorProof() creates an AnchorProof object', () => {
    const log = createLog()
    const proof = createAnchorProof('eip155:1337', log)

    expect(proof).toMatchObject({
      chainId: 'eip155:1337',
      txHash: expect.any(Object),
      root: expect.any(Object),
    })
    expect(proof.txHash.equals(transactionHashCid)).toBe(true)
    expect(proof.root.equals(getCidFromAnchorEventLog(log))).toBe(true)
  })
})
