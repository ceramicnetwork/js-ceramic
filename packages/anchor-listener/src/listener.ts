import type { SupportedNetwork } from '@ceramicnetwork/anchor-contract'
import type { AnchorProof } from '@ceramicnetwork/common'
import type { Block, Provider } from '@ethersproject/providers'
import {
  type Observable,
  type OperatorFunction,
  type RetryConfig,
  firstValueFrom,
  fromEvent,
  map,
  mergeMap,
  pipe,
  scan,
} from 'rxjs'

import { createAnchorProofsLoader, mapLoadBlocks } from './loader.js'

export type ProcessedBlockEvent = {
  type: 'processed-block'
  block: Block
  proofs: Array<AnchorProof>
}

export type ReorganizationEvent = {
  type: 'reorganization'
  block: Block
  expectedParentHash: string
}

export type ListenerEvent = ProcessedBlockEvent | ReorganizationEvent

export type ListenerParams = {
  chainId: SupportedNetwork
  confirmations: number
  expectedParentHash?: string
  provider: Provider
  retryConfig?: RetryConfig
}

type OrderingState = { continuous: Array<number>; latestContinuous?: number; maxFuture?: number }

export function createContinuousBlocksListener(
  provider: Provider,
  confirmations = 0
): Observable<Array<number>> {
  return fromEvent(provider, 'block').pipe(
    // Map to latest block number minus wanted confirmations
    map((blockNumber) => (blockNumber as number) - confirmations),
    // Order continuous block numbers, keeping track of highest block received
    scan<number, OrderingState, OrderingState>(
      (state, blockNumber) => {
        if (state.latestContinuous != null) {
          if (blockNumber <= state.latestContinuous) {
            // Already processed block number
            return { ...state, continuous: [] }
          }
          if (blockNumber > state.latestContinuous + 1) {
            // Future block number, keep track
            return {
              ...state,
              continuous: [],
              maxFuture: Math.max(state.maxFuture ?? 0, blockNumber),
            }
          }
        }

        return state.maxFuture == null
          ? // Load single block
            { continuous: [blockNumber], latestContinuous: blockNumber }
          : // Load range from new block number to max tracked future block number
            {
              continuous: new Array(state.maxFuture - blockNumber).map((_, i) => blockNumber + i),
              latestContinuous: state.maxFuture,
            }
      },
      { continuous: [] }
    ),
    // Extract continous blocks from ordering state
    map((state) => state.continuous)
  )
}

type ProcessingState = { status: 'process' | 'reorganized'; previousHash: string; block: Block }
type ProcessingSeed = { status: 'initial' }

export function mapProcessBlock(
  provider: Provider,
  chainId: SupportedNetwork,
  expectedParentHash?: string,
  retryConfig?: RetryConfig
): OperatorFunction<Block, ListenerEvent> {
  return pipe(
    // Check for blockchain reorganizations based on previous known block
    scan<Block, ProcessingState, ProcessingSeed>(
      (state, block) => {
        if (state.status === 'initial') {
          // Check against initial expectedParentHash if provided
          return expectedParentHash == null || block.parentHash === expectedParentHash
            ? { status: 'process', block, previousHash: block.parentHash }
            : { status: 'reorganized', block, previousHash: expectedParentHash }
        }
        return {
          status: block.parentHash === state.previousHash ? 'process' : 'reorganized',
          block,
          previousHash: block.parentHash,
        }
      },
      { status: 'initial' }
    ),
    // Emit event based on status, loading anchor proofs for processed blocks
    mergeMap(async ({ status, block, previousHash }) => {
      if (status === 'process') {
        const proofs$ = createAnchorProofsLoader(provider, chainId, block, retryConfig)
        return {
          type: 'processed-block',
          block,
          proofs: await firstValueFrom(proofs$),
        } as ProcessedBlockEvent
      }

      return {
        type: 'reorganization',
        block,
        expectedParentHash: previousHash,
      } as ReorganizationEvent
    })
  )
}

export function createBlockListener({
  chainId,
  confirmations,
  expectedParentHash,
  provider,
  retryConfig,
}: ListenerParams): Observable<ListenerEvent> {
  return createContinuousBlocksListener(provider, confirmations).pipe(
    mapLoadBlocks(provider, retryConfig),
    mapProcessBlock(provider, chainId, expectedParentHash, retryConfig)
  )
}
