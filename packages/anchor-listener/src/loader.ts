import { type SupportedNetwork, ANCHOR_CONTRACT_ADDRESSES } from '@ceramicnetwork/anchor-contract'
import type { AnchorProof } from '@ceramicnetwork/common'
import type { Block, BlockTag, Provider } from '@ethersproject/providers'
import {
  type Observable,
  type OperatorFunction,
  type RetryConfig,
  concatMap,
  defer,
  firstValueFrom,
  map,
  mergeMap,
  pipe,
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

export async function loadBlockAnchorProofs(
  provider: Provider,
  chainId: SupportedNetwork,
  block: Block,
  retryConfig?: RetryConfig
): Promise<Array<AnchorProof>> {
  return await firstValueFrom(createAnchorProofsLoader(provider, chainId, block, retryConfig))
}
