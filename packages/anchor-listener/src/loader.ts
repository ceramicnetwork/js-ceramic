import { getCidFromAnchorEventLog } from '@ceramicnetwork/anchor-contract'
import type { Block, BlockTag, Filter, Provider } from '@ethersproject/providers'
import type { CID } from 'multiformats/cid'
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

export function createRootCIDsLoader(
  provider: Provider,
  filter: Filter,
  retryConfig: RetryConfig = { count: 3 }
): Observable<Array<CID>> {
  return from(provider.getLogs(filter)).pipe(
    retry(retryConfig),
    map((logs) => logs.map(getCidFromAnchorEventLog))
  )
}
