import type { SupportedNetwork } from '@ceramicnetwork/anchor-utils'
import type { Block, Provider } from '@ethersproject/providers'
import {
  type Observable,
  type OperatorFunction,
  type RetryConfig,
  concatMap,
  filter,
  fromEvent,
  map,
  pipe,
  scan,
} from 'rxjs'

import { type BlockWithAnchorProofs, loadAnchorProofs, mapLoadBlocks } from './loader.js'

export type BlockEvent = BlockWithAnchorProofs & {
  reorganized: false
}

export type ReorganizedBlockEvent = BlockWithAnchorProofs & {
  reorganized: true
  expectedParentHash: string
}

export type BlockListenerEvent = BlockEvent | ReorganizedBlockEvent

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

type OrderingState = { continuous: Array<number>; latestContinuous?: number; maxFuture?: number }

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
              continuous: new Array(state.maxFuture - blockNumber + 1).fill(0).map((_, i) => {
                return blockNumber + i
              }),
              latestContinuous: state.maxFuture,
            }
      },
      { continuous: [] }
    ),
    // Extract continous blocks from ordering state
    map((state) => state.continuous),
    // Only push non-empty lists of blocks
    filter((blocks) => blocks.length !== 0)
  )
}

type ProcessingState = { status: 'process' | 'reorganized'; previousHash: string; block: Block }
type ProcessingSeed = { status: 'initial' }

/**
 * Rx operator to load anchor proofs for input blocks and detect blocks reorganizations
 *
 * @param provider ethers.js Provider
 * @param chainId supported anchor network chain ID
 * @param expectedParentHash optional expected parent hash when loading first block
 * @param retryConfig optional Rx retry config
 * @returns OperatorFunction<Block, BlockListenerEvent>
 */
export function mapProcessBlock(
  provider: Provider,
  chainId: SupportedNetwork,
  expectedParentHash?: string,
  retryConfig?: RetryConfig
): OperatorFunction<Block, BlockListenerEvent> {
  return pipe(
    // Check for blockchain reorganizations based on previous known block
    scan<Block, ProcessingState, ProcessingSeed>(
      (state, block) => {
        if (state.status === 'initial') {
          // Check against initial expectedParentHash if provided
          return expectedParentHash == null || block.parentHash === expectedParentHash
            ? { status: 'process', block, previousHash: block.hash }
            : { status: 'reorganized', block, previousHash: expectedParentHash }
        }
        return block.parentHash === state.block.hash
          ? { status: 'process', block, previousHash: block.hash }
          : { status: 'reorganized', block, previousHash: state.previousHash }
      },
      { status: 'initial' }
    ),
    // Emit event based on status, loading anchor proofs
    concatMap<ProcessingState, Promise<BlockListenerEvent>>(
      async ({ status, block, previousHash }) => {
        const proofs = await loadAnchorProofs(provider, chainId, block, retryConfig)
        return status === 'process'
          ? { reorganized: false, block, proofs }
          : { reorganized: true, block, proofs, expectedParentHash: previousHash }
      }
    )
  )
}

/**
 * Create an Observable of blocks with anchor proofs from new blocks emitted by the provider,
 * flagging reorganized blocks when detected
 *
 * @param params ListenerParams
 * @returns Observable<BlockListenerEvent>
 */
export function createBlockListener({
  chainId,
  confirmations,
  expectedParentHash,
  provider,
  retryConfig,
}: ListenerParams): Observable<BlockListenerEvent> {
  return createContinuousBlocksListener(provider, confirmations).pipe(
    mapLoadBlocks(provider, retryConfig),
    mapProcessBlock(provider, chainId, expectedParentHash, retryConfig)
  )
}
