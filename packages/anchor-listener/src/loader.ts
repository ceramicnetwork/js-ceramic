import {
  type SupportedNetwork,
  ANCHOR_CONTRACT_ADDRESSES,
  convertEthHashToCid,
  getCidFromAnchorEventLog,
} from '@ceramicnetwork/anchor-contract'
import type { AnchorProof } from '@ceramicnetwork/common'
import type { Block, BlockTag, Log, Provider } from '@ethersproject/providers'
import {
  type Observable,
  type OperatorFunction,
  type RetryConfig,
  firstValueFrom,
  from,
  map,
  mergeMap,
  pipe,
  retry,
  throwError,
} from 'rxjs'

export function createBlockLoader(
  provider: Provider,
  block: BlockTag,
  retryConfig: RetryConfig = { count: 3 }
): Observable<Block> {
  return from(provider.getBlock(block)).pipe(retry(retryConfig))
}

export async function loadBlock(
  provider: Provider,
  block: BlockTag,
  retryConfig?: RetryConfig
): Promise<Block> {
  return await firstValueFrom(createBlockLoader(provider, block, retryConfig))
}

export function mapLoadBlock(
  provider: Provider,
  retryConfig: RetryConfig = { count: 3 }
): OperatorFunction<number, Block> {
  return pipe(mergeMap((blockNumber) => createBlockLoader(provider, blockNumber, retryConfig)))
}

export function mapLoadBlocks(
  provider: Provider,
  retryConfig: RetryConfig = { count: 3 }
): OperatorFunction<Array<number>, Block> {
  return pipe(
    mergeMap((blockNumbers) => {
      return blockNumbers.map((block) => loadBlock(provider, block, retryConfig))
    }),
    mergeMap(async (blockPromise) => await blockPromise)
  )
}

export function createAnchorProof(chainId: SupportedNetwork, block: Block, log: Log): AnchorProof {
  return {
    chainId,
    blockNumber: block.number,
    blockTimestamp: block.timestamp,
    txHash: convertEthHashToCid(log.transactionHash),
    root: getCidFromAnchorEventLog(log),
  }
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

  return from(provider.getLogs({ address, fromBlock: block.number, toBlock: block.number })).pipe(
    retry(retryConfig),
    map((logs) => {
      return logs.map((log) => createAnchorProof(chainId, block, log))
    })
  )
}
