import type { AnchorValidator } from '../anchor-service.js'
import type { AnchorProof } from '@ceramicnetwork/common'
import type { CID } from 'multiformats'
import { LRUCache } from 'least-recent'

// Caches recent anchor txn hashes and the timestamp when they were anchored
// This is intentionally global and not a member of InMemoryAnchorService. This is so that when
// multiple InMemoryAnchorServices are being used simultaneously in the same process (usually by
// tests that use multiple Ceramic nodes), they can share the set of recent transactions and thus
// can successfully validate each others transactions.
export const TRANSACTION_CACHE = new LRUCache<string, number>(100)

class NotAnchoredError extends Error {
  constructor(txHash: CID) {
    super(`Txn ${txHash} was not recently anchored by the InMemoryAnchorService`)
  }
}

export class InMemoryAnchorValidator implements AnchorValidator {
  readonly chainId: string
  readonly ethereumRpcEndpoint = null

  constructor(chainId: string) {
    this.chainId = chainId
  }

  async init(): Promise<void> {
    // Do Nothing
  }

  async validateChainInclusion(anchorProof: AnchorProof): Promise<number> {
    const key = anchorProof.txHash.toString()
    const found = TRANSACTION_CACHE.get(key)
    if (!found) {
      throw new NotAnchoredError(anchorProof.txHash)
    }
    return found
  }
}
