import type { SupportedNetwork } from '@ceramicnetwork/anchor-utils'
import type { Provider } from '@ethersproject/providers'
import {
  type Observable,
  type OperatorFunction,
  type RetryConfig,
  filter,
  fromEvent,
  map,
  pipe,
  scan,
} from 'rxjs'

import {
  mapLoadBlockForBlockProofs,
  mapLoadBlockProofsForRange,
  type BlockAndBlockProofs,
} from './loader.js'

export type BlockEvent = BlockAndBlockProofs & {
  reorganized: false
}

export type ReorganizedBlockEvent = BlockAndBlockProofs & {
  reorganized: true
  expectedParentHash: string
}

export type BlockProofsListenerEvent = BlockEvent | ReorganizedBlockEvent

export type ListenerParams = {
  /* ethers.js Provider */
  provider: Provider
  /* supported anchor network chain ID */
  chainId: SupportedNetwork
  /* number of confirmations to wait for to load blocks */
  confirmations: number
  /* optional parent hash expected when loading the first block */
  expectedParentHash?: string
  /* optional Rx retry config */
  retryConfig?: RetryConfig
}

type LoadState = { load: Array<number>; highest?: number }

/**
 * Create an Observable of arrays of continuous block numbers, ensuring ordering
 *
 * @param provider ethers.js provider
 * @param confirmations optional number of confirmations, defaults to 0
 * @returns Observable<Array<number>>
 */
export function createContinuousBlocksListener(
  provider: Provider,
  confirmations = 0
): Observable<Array<number>> {
  return fromEvent(provider, 'block').pipe(
    // Map to latest block number minus wanted confirmations
    map((blockNumber) => (blockNumber as number) - confirmations),
    // Track block numbers to load with highest block received
    scan<number, LoadState, LoadState>(
      (state, blockNumber) => {
        if (state.highest == null) {
          // Load single block
          return { load: [blockNumber], highest: blockNumber }
        }
        if (blockNumber <= state.highest) {
          // Already processed block number
          return { ...state, load: [] }
        }
        // Load full block range when new block is higher than previously highest seen
        const lastLoadedNumber = state.highest
        return {
          load: new Array(blockNumber - lastLoadedNumber).fill(0).map((_, i) => {
            return lastLoadedNumber + 1 + i
          }),
          highest: blockNumber,
        }
      },
      { load: [] }
    ),
    // Extract continous blocks from ordering state
    map((state) => state.load),
    // Only push non-empty lists of blocks
    filter((blocks) => blocks.length !== 0)
  )
}

type ProcessingState = BlockAndBlockProofs & {
  status: 'process' | 'reorganized'
  previousHash: string
}
type ProcessingSeed = { status: 'initial' }

/**
 * Rx operator to detect blocks reorganizations and push BlockListenerEvents
 *
 * @param retryConfig optional Rx retry config
 * @returns OperatorFunction<BlockProofs, BlockProofsListenerEvent>
 */
export function mapProcessBlockProofs(
  expectedParentHash?: string
): OperatorFunction<BlockAndBlockProofs, BlockProofsListenerEvent> {
  return pipe(
    // Check for blockchain reorganizations based on previous known block
    scan<BlockAndBlockProofs, ProcessingState, ProcessingSeed>(
      (state, data) => {
        if (state.status === 'initial') {
          // Check against initial expectedParentHash if provided
          return expectedParentHash == null || data.block.parentHash === expectedParentHash
            ? { ...data, status: 'process', previousHash: data.block.hash }
            : { ...data, status: 'reorganized', previousHash: expectedParentHash }
        }
        return data.block.parentHash === state.block.hash
          ? { ...data, status: 'process', previousHash: data.block.hash }
          : { ...data, status: 'reorganized', previousHash: state.previousHash }
      },
      { status: 'initial' }
    ),
    // Emit event based on status
    map<ProcessingState, BlockProofsListenerEvent>(({ status, block, proofs, previousHash }) => {
      return status === 'process'
        ? { reorganized: false, block, proofs }
        : { reorganized: true, block, proofs, expectedParentHash: previousHash }
    })
  )
}

/**
 * Create an Observable of blocks with anchor proofs from new blocks emitted by the provider,
 * flagging reorganized blocks when detected
 *
 * @param params ListenerParams
 * @returns Observable<BlockProofsListenerEvent>
 */
export function createBlockProofsListener({
  chainId,
  confirmations,
  expectedParentHash,
  provider,
  retryConfig,
}: ListenerParams): Observable<BlockProofsListenerEvent> {
  return createContinuousBlocksListener(provider, confirmations).pipe(
    map((blockNumbers) => ({
      fromBlock: blockNumbers[0] as number,
      toBlock: blockNumbers[blockNumbers.length - 1] as number,
    })),
    mapLoadBlockProofsForRange(provider, chainId, retryConfig),
    mapLoadBlockForBlockProofs(provider, retryConfig),
    mapProcessBlockProofs(expectedParentHash)
  )
}
