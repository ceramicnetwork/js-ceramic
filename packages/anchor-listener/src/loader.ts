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

export function createBlockLoader(
  provider: Provider,
  block: BlockTag,
  retryConfig: RetryConfig = { count: 3 }
): Observable<Block> {
  return defer(async () => await provider.getBlock(block)).pipe(retry(retryConfig))
}

export async function loadBlock(
  provider: Provider,
  block: BlockTag,
  retryConfig?: RetryConfig
): Promise<Block> {
  return await firstValueFrom(createBlockLoader(provider, block, retryConfig))
}

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

export async function loadAnchorProofs(
  provider: Provider,
  chainId: SupportedNetwork,
  block: Block,
  retryConfig?: RetryConfig
): Promise<Array<AnchorProof>> {
  return await firstValueFrom(createAnchorProofsLoader(provider, chainId, block, retryConfig))
}

export type BlockWithAnchorProofs = {
  block: Block
  proofs: Array<AnchorProof>
}

export function mapLoadBlockAnchorProofs(
  provider: Provider,
  chainId: SupportedNetwork,
  retryConfig: RetryConfig = { count: 3 }
): OperatorFunction<Block, BlockWithAnchorProofs> {
  return pipe(
    concatMap(async (block) => {
      return { block, proofs: await loadAnchorProofs(provider, chainId, block, retryConfig) }
    })
  )
}

export type BlocksWithAnchorProofsLoaderParams = {
  provider: Provider
  chainId: SupportedNetwork
  fromBlock: number
  toBlock: number
  retryConfig?: RetryConfig
  blockLoadBuffer?: number
}

export function createBlocksWithAnchorProofsLoader({
  provider,
  chainId,
  fromBlock,
  toBlock,
  retryConfig,
  blockLoadBuffer,
}: BlocksWithAnchorProofsLoaderParams): Observable<BlockWithAnchorProofs> {
  const retry = retryConfig ?? { count: 3 }
  return range(fromBlock, toBlock - fromBlock + 1).pipe(
    bufferCount(blockLoadBuffer ?? 5),
    mapLoadBlocks(provider, retry),
    mapLoadBlockAnchorProofs(provider, chainId, retry)
  )
}

export type AncestorBlocksWithAnchorProofsLoaderParams = {
  provider: Provider
  chainId: SupportedNetwork
  initialBlock: BlockTag
  targetAncestorHash: string
  retryConfig?: RetryConfig
  maxConcurrency?: number
}

export function createAncestorBlocksWithAnchorProofsLoader({
  provider,
  chainId,
  initialBlock,
  targetAncestorHash,
  retryConfig,
  maxConcurrency,
}: AncestorBlocksWithAnchorProofsLoaderParams): Observable<BlockWithAnchorProofs> {
  const retry = retryConfig ?? { count: 3 }
  return createBlockLoader(provider, initialBlock, retry).pipe(
    expand((block) => {
      return block.parentHash === targetAncestorHash
        ? EMPTY
        : createBlockLoader(provider, block.parentHash, retry)
    }, maxConcurrency),
    mapLoadBlockAnchorProofs(provider, chainId, retry)
  )
}
