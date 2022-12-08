import { ANCHOR_CONTRACT_ADDRESSES } from '@ceramicnetwork/anchor-contract'
import type { Block, Provider } from '@ethersproject/providers'
import type { CID } from 'multiformats/cid'
import {
  type Observable,
  type RetryConfig,
  firstValueFrom,
  fromEvent,
  map,
  mergeMap,
  scan,
} from 'rxjs'

import { createRootCIDsLoader, mapLoadBlock } from './loader.js'

export type ProcessedBlockEvent = {
  type: 'processed-block'
  block: Block
  roots: Array<CID>
}

export type ReorganizationEvent = {
  type: 'reorganization'
  latestProcessedBlock: string
  newBlock: Block
}

export type ListenerEvent = ProcessedBlockEvent | ReorganizationEvent

export type ListenerParams = {
  latestProcessedBlock?: string
  confirmations: number
  network: keyof typeof ANCHOR_CONTRACT_ADDRESSES
  provider: Provider
  retryConfig?: RetryConfig
}

type State = { status: 'process' | 'reorganized'; previousHash: string; block: Block }
type Seed = { status: 'initial' }

export function createBlockListener({
  confirmations,
  latestProcessedBlock,
  network,
  provider,
  retryConfig,
}: ListenerParams): Observable<ListenerEvent> {
  const address = ANCHOR_CONTRACT_ADDRESSES[network]
  if (address == null) {
    throw new Error(`No known contract address for network: ${network}`)
  }

  return fromEvent(provider, 'block').pipe(
    // Map to latest block number minus wanted confirmations
    map((blockNumber) => (blockNumber as number) - confirmations),
    // Load block from provider
    mapLoadBlock(provider, retryConfig),
    // Check for blockchain reorganizations based on previous known block
    scan<Block, State, Seed>(
      (state, block) => {
        if (state.status === 'initial') {
          // Check against initial latestProcessedBlock if provided
          return latestProcessedBlock == null || block.parentHash === latestProcessedBlock
            ? { status: 'process', block, previousHash: block.parentHash }
            : { status: 'reorganized', block, previousHash: latestProcessedBlock }
        }
        return {
          status: block.parentHash === state.previousHash ? 'process' : 'reorganized',
          block,
          previousHash: block.parentHash,
        }
      },
      { status: 'initial' }
    ),
    // Emit event based on status, loading root CIDs for processed blocks
    mergeMap(async ({ status, block, previousHash }) => {
      if (status === 'process') {
        const cids$ = createRootCIDsLoader(provider, {
          address,
          fromBlock: block.number,
          toBlock: block.number,
        })
        return {
          type: 'processed-block',
          block,
          roots: await firstValueFrom(cids$),
        } as ProcessedBlockEvent
      }

      return {
        type: 'reorganization',
        newBlock: block,
        latestProcessedBlock: previousHash,
      } as ReorganizationEvent
    })
  )
}
