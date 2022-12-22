import { type SupportedNetwork, ANCHOR_CONTRACT_ADDRESSES } from '@ceramicnetwork/anchor-utils'
import type { AnchorProof } from '@ceramicnetwork/common'
import type { Block, BlockTag, Provider } from '@ethersproject/providers'
import {
  EMPTY,
  type Observable,
  type OperatorFunction,
  type RetryConfig,
  bufferCount,
  concatMap,
  defer,
  expand,
  firstValueFrom,
  map,
  mergeMap,
  pipe,
  range,
  retry,
  throwError,
} from 'rxjs'

import { createAnchorProof } from './utils.js'

export type BlockProofs = {
  block: Block
  proofs: Array<AnchorProof>
}

/**
 * Create an Observable loading a single block, with retry logic
 *
 * @param provider ethers.js Provider
 * @param block ethers.js BlockTag
 * @param retryConfig optional Rx retry config
 * @returns Observable<Block>
 */
export function createBlockLoader(
  provider: Provider,
  block: BlockTag,
  retryConfig: RetryConfig = { count: 3 }
): Observable<Block> {
  return defer(async () => await provider.getBlock(block)).pipe(retry(retryConfig))
}

/**
 * Loads a single block, with retry logic
 *
 * @param provider ethers.js Provider
 * @param block ethers.js BlockTag
 * @param retryConfig optional Rx retry config
 * @returns Promise<Block>
 */
export async function loadBlock(
  provider: Provider,
  block: BlockTag,
  retryConfig?: RetryConfig
): Promise<Block> {
  return await firstValueFrom(createBlockLoader(provider, block, retryConfig))
}

/**
 * Rx operator to load blocks based on input array of block numbers
 *
 * @param provider ethers.js Provider
 * @param retryConfig optional Rx retry config
 * @returns OperatorFunction<Array<number>, Block>
 */
export function mapLoadBlocks(
  provider: Provider,
  retryConfig: RetryConfig = { count: 3 }
): OperatorFunction<Array<number>, Block> {
  return pipe(
    mergeMap((blockNumbers) => {
      return blockNumbers.map((block) => loadBlock(provider, block, retryConfig))
    }),
    // Use concatMap here to ensure ordering
    concatMap(async (blockPromise) => await blockPromise)
  )
}

/**
 * Create an Observable loading anchor proofs for a given block
 *
 * @param provider ethers.js Provider
 * @param chainId supported anchor network chain ID
 * @param block ethers.js Block
 * @param retryConfig optional Rx retry config
 * @returns Observable<Array<AnchorProof>>
 */
export function createAnchorProofsLoader(
  provider: Provider,
  chainId: SupportedNetwork,
  block: Block,
  retryConfig: RetryConfig = { count: 3 }
): Observable<Array<AnchorProof>> {
  const address = ANCHOR_CONTRACT_ADDRESSES[chainId]
  if (address == null) {
    return throwError(() => new Error(`No known contract address for network: ${chainId}`))
  }

  return defer(async () => {
    return await provider.getLogs({ address, fromBlock: block.number, toBlock: block.number })
  }).pipe(
    retry(retryConfig),
    map((logs) => {
      return logs.map((log) => createAnchorProof(chainId, block, log))
    })
  )
}

/**
 * Load anchor proofs for a given block
 *
 * @param provider ethers.js Provider
 * @param chainId supported anchor network chain ID
 * @param block ethers.js Block
 * @param retryConfig optional Rx retry config
 * @returns Observable<Array<AnchorProof>>
 */
export async function loadAnchorProofs(
  provider: Provider,
  chainId: SupportedNetwork,
  block: Block,
  retryConfig?: RetryConfig
): Promise<Array<AnchorProof>> {
  return await firstValueFrom(createAnchorProofsLoader(provider, chainId, block, retryConfig))
}

/**
 * Load a block with anchor proofs for a given block tag
 *
 * @param provider ethers.js Provider
 * @param chainId supported anchor network chain ID
 * @param blockTag ethers.js BlockTag
 * @param retryConfig optional Rx retry config
 * @returns Promise<BlockProofs>
 */
export async function loadBlockProofs(
  provider: Provider,
  chainId: SupportedNetwork,
  blockTag: BlockTag,
  retryConfig?: RetryConfig
): Promise<BlockProofs> {
  const block = await loadBlock(provider, blockTag, retryConfig)
  return { block, proofs: await loadAnchorProofs(provider, chainId, block, retryConfig) }
}

/**
 * Rx operator to load anchor proofs for input blocks
 *
 * @param provider ethers.js Provider
 * @param chainId supported anchor network chain ID
 * @param retryConfig optional Rx retry config
 * @returns OperatorFunction<Block, BlockProofs>
 */
export function mapLoadBlockProofs(
  provider: Provider,
  chainId: SupportedNetwork,
  retryConfig: RetryConfig = { count: 3 }
): OperatorFunction<Block, BlockProofs> {
  return pipe(
    concatMap(async (block) => {
      return { block, proofs: await loadAnchorProofs(provider, chainId, block, retryConfig) }
    })
  )
}

/**
 * Rx operator to load anchor proofs for input blocks
 *
 * @param provider ethers.js Provider
 * @param chainId supported anchor network chain ID
 * @param retryConfig optional Rx retry config
 * @returns OperatorFunction<Array<number>, BlockProofs>
 */
export function mapLoadBlocksProofs(
  provider: Provider,
  chainId: SupportedNetwork,
  retryConfig: RetryConfig = { count: 3 }
): OperatorFunction<Array<number>, BlockProofs> {
  return pipe(
    mergeMap((blockNumbers) => {
      return blockNumbers.map(async (blockNumber) => {
        return await loadBlockProofs(provider, chainId, blockNumber, retryConfig)
      })
    }),
    // Use concatMap here to ensure ordering
    concatMap(async (blockPromise) => await blockPromise)
  )
}

export type BlocksProofsLoaderParams = {
  /* ethers.js Provider */
  provider: Provider
  /* supported anchor network chain ID */
  chainId: SupportedNetwork
  /* block number to start loading from */
  fromBlock: number
  /* block number to stop loading at (inclusive) */
  toBlock: number
  /* optional Rx retry config */
  retryConfig?: RetryConfig
  /* optional block loading buffer size, defaults to 5 */
  blockLoadBuffer?: number
}

/**
 * Create an Observable loading blocks and their anchor proofs for a given range of blocks
 *
 * @param params BlocksProofsLoaderParams
 * @returns Observable<BlockProofs>
 */
export function createBlocksProofsLoader({
  provider,
  chainId,
  fromBlock,
  toBlock,
  retryConfig,
  blockLoadBuffer,
}: BlocksProofsLoaderParams): Observable<BlockProofs> {
  const retry = retryConfig ?? { count: 3 }
  return range(fromBlock, toBlock - fromBlock + 1).pipe(
    bufferCount(blockLoadBuffer ?? 5),
    mapLoadBlocksProofs(provider, chainId, retry)
  )
}

export type AncestorBlocksProofsLoaderParams = {
  /* ethers.js Provider */
  provider: Provider
  /* supported anchor network chain ID */
  chainId: SupportedNetwork
  /* block tag to start loading from */
  initialBlock: BlockTag
  /* block hash to stop loading at (exclusive, matching `parentHash` of last emitted block) */
  targetAncestorHash: string
  /* optional Rx retry config */
  retryConfig?: RetryConfig
  /* optional maximum concurrency for loading parent blocks */
  maxConcurrency?: number
}

/**
 * Create an Observable loading blocks and their anchor proofs, walking the ancestry of a given
 * block until the target ancestor is reached
 *
 * @param params AncestorBlocksProofsLoaderParams
 * @returns Observable<BlockProofs>
 */
export function createAncestorBlocksProofsLoader({
  provider,
  chainId,
  initialBlock,
  targetAncestorHash,
  retryConfig,
  maxConcurrency,
}: AncestorBlocksProofsLoaderParams): Observable<BlockProofs> {
  const retry = retryConfig ?? { count: 3 }
  return createBlockLoader(provider, initialBlock, retry).pipe(
    expand((block) => {
      return block.parentHash === targetAncestorHash
        ? EMPTY
        : createBlockLoader(provider, block.parentHash, retry)
    }, maxConcurrency),
    mapLoadBlockProofs(provider, chainId, retry)
  )
}
