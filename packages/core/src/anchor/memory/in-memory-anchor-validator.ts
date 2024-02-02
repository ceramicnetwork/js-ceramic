import type { AnchorValidator } from '../anchor-service.js'
import type { AnchorProof } from '@ceramicnetwork/common'
import type { CID } from 'multiformats'
import type { LRUCache } from 'least-recent'

class NotAnchoredError extends Error {
  constructor(txHash: CID) {
    super(`Txn ${txHash} was not recently anchored by the InMemoryAnchorService`)
  }
}

export class InMemoryAnchorValidator implements AnchorValidator {
  readonly chainId: string
  readonly ethereumRpcEndpoint = null
  readonly transactionCache: LRUCache<string, number>

  constructor(chainId: string, transactionCache: LRUCache<string, number>) {
    this.transactionCache = transactionCache
    this.chainId = chainId
  }

  async init(): Promise<void> {
    // Do Nothing
  }

  async validateChainInclusion(anchorProof: AnchorProof): Promise<number> {
    const key = anchorProof.txHash.toString()
    const found = this.transactionCache.get(key)
    if (!found) {
      throw new NotAnchoredError(anchorProof.txHash)
    }
    return found
  }
}
