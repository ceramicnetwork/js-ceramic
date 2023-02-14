import { type SupportedNetwork, ANCHOR_CONTRACT_ADDRESSES } from '@ceramicnetwork/anchor-utils'
import type { AnchorProof } from '@ceramicnetwork/common'
import type { Block, BlockTag, Provider, Log } from '@ethersproject/providers'
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
  pipe,
  mergeMap,
  range,
  retry,
  throwError,
  from,
} from 'rxjs'

import { createAnchorProof } from './utils.js'

export type BlockProofs = {
  blockNumber: number
  blockHash: string
  proofs: Array<AnchorProof>
}

export type BlockRangeFilter = {
  fromBlock: BlockTag
  toBlock: BlockTag
}

export type BlockAndBlockProofs = {
  block: Block
  proofs: BlockProofs
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
 * Rx operator to load blocks for each input blocks proofs
 *
 * @param provider ethers.js Provider
 * @param retryConfig optional Rx retry config
 * @returns OperatorFunction<Array<BlockProofs>, BlockAndBlockProofs>
 */
export function mapLoadBlockForBlockProofs(
  provider: Provider,
  retryConfig: RetryConfig = { count: 3 }
): OperatorFunction<Array<BlockProofs>, BlockAndBlockProofs> {
  return pipe(
    mergeMap((blockProofsForRange) => {
      return blockProofsForRange.map(async (proofs) => {
        const block = await loadBlock(provider, proofs.blockHash, retryConfig)
        return { block, proofs }
      })
    }),
    // Use concatMap here to ensure ordering
    concatMap(async (blockPromise) => await blockPromise)
  )
}

/**
 * Groups logs by their block numbers
 * @param logs ethers.js Log
 * @returns Record<number, Array<Log>>
 */
const groupLogsByBlockNumber = (logs: Array<Log>): Record<number, Array<Log>> =>
  logs.reduce((logsByBlockNumber, log) => {
    const { blockNumber } = log

    if (!logsByBlockNumber[blockNumber]) logsByBlockNumber[blockNumber] = []

    logsByBlockNumber[blockNumber]?.push(log)
    return logsByBlockNumber
  }, {} as Record<number, Array<Log>>)

/**
 * Create an Observable loading block proofs for a range of blocks
 *
 * @param provider ethers.js Provider
 * @param chainId supported anchor network chain ID
 * @param blockRangeFilter BlockRangeFilter providing the fromBlock and toBlock, each represented by ether.js BlockTag
 * @param retryConfig optional Rx retry config
 * @returns Observable<Array<BlockProofs>>
 */
export function createBlockProofsLoaderForRange(
  provider: Provider,
  chainId: SupportedNetwork,
  blockRangeFilter: BlockRangeFilter,
  retryConfig: RetryConfig = { count: 3 }
): Observable<Array<BlockProofs>> {
  const address = ANCHOR_CONTRACT_ADDRESSES[chainId]
  if (address == null) {
    return throwError(() => new Error(`No known contract address for network: ${chainId}`))
  }

  return defer(async () => {
    return await provider.getLogs({
      address,
      fromBlock: blockRangeFilter.fromBlock,
      toBlock: blockRangeFilter.toBlock,
    })
  }).pipe(
    retry(retryConfig),
    map(groupLogsByBlockNumber),
    map((logsByBlockNumber) => {
      return Object.values(logsByBlockNumber).map((logs) => ({
        blockNumber: logs[0]?.blockNumber as number,
        blockHash: logs[0]?.blockHash as string,
        proofs: logs.map((log) => createAnchorProof(chainId, log)),
      }))
    })
  )
}

/**
 * Load block proofs for a given block range
 *
 * @param provider ethers.js Provider
 * @param chainId supported anchor network chain ID
 * @param blockRangeFilter BlockRangeFilter providing the fromBlock and toBlock, each represented by ether.js BlockTag
 * @param retryConfig optional Rx retry config
 * @returns Observable<Array<AnchorProof>>
 */
export async function loadBlockProofsForRange(
  provider: Provider,
  chainId: SupportedNetwork,
  blockRangeFilter: BlockRangeFilter,
  retryConfig?: RetryConfig
): Promise<Array<BlockProofs>> {
  return await firstValueFrom(
    createBlockProofsLoaderForRange(provider, chainId, blockRangeFilter, retryConfig)
  )
}

/**
 * Rx operator to load block proofs for input blocks
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
      const result = await loadBlockProofsForRange(
        provider,
        chainId,
        { fromBlock: block.number, toBlock: block.number },
        retryConfig
      )

      if (result.length !== 1) {
        throw Error(
          `Did not receive exactly one set of proofs for block ${block.number}. Received ${result.length} sets`
        )
      }

      return result[0] as BlockProofs
    })
  )
}

/**
 * Rx operator to load block proofs for input blocks ranges
 *
 * @param provider ethers.js Provider
 * @param chainId supported anchor network chain ID
 * @param retryConfig optional Rx retry config
 * @returns OperatorFunction<Array<number>, BlockProofs>
 */
export function mapLoadBlockProofsForRange(
  provider: Provider,
  chainId: SupportedNetwork,
  retryConfig: RetryConfig = { count: 3 }
): OperatorFunction<BlockRangeFilter, Array<BlockProofs>> {
  return pipe(
    concatMap((blockRangeFilter: BlockRangeFilter) => {
      return loadBlockProofsForRange(provider, chainId, blockRangeFilter, retryConfig)
    })
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
 * Create an Observable loading blockProofs for a given range of blocks
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
    bufferCount(blockLoadBuffer ?? 100),
    map((values) => ({
      fromBlock: values[0] as number,
      toBlock: values[values.length - 1] as number,
    })),
    mapLoadBlockProofsForRange(provider, chainId, retry),
    concatMap((blockProofsForRange) => from(blockProofsForRange))
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
