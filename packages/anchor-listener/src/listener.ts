import {
  ANCHOR_CONTRACT_ADDRESSES,
  getCidFromAnchorEventLog,
} from '@ceramicnetwork/anchor-contract'
import type { Block, Filter, Provider } from '@ethersproject/providers'
import type { CID } from 'multiformats/cid'
import {
  type Observable,
  type OperatorFunction,
  type RetryConfig,
  firstValueFrom,
  from,
  fromEvent,
  map,
  mergeMap,
  pipe,
  retry,
  scan,
} from 'rxjs'

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

export function tryLoadBlock(
  provider: Provider,
  retryConfig: RetryConfig = { count: 3 }
): OperatorFunction<number, Block> {
  return pipe(
    mergeMap(async (blockNumber) => await provider.getBlock(blockNumber)),
    retry(retryConfig)
  )
}

export async function tryLoadRootCIDs(
  provider: Provider,
  filter: Filter,
  retryConfig: RetryConfig = { count: 3 }
): Promise<Array<CID>> {
  const cids$ = from(provider.getLogs(filter)).pipe(
    retry(retryConfig),
    map((logs) => logs.map(getCidFromAnchorEventLog))
  )
  return await firstValueFrom(cids$)
}

export type ListenerParams = {
  latestProcessedBlock?: string
  confirmations: number
  network: keyof typeof ANCHOR_CONTRACT_ADDRESSES
  provider: Provider
  retryConfig?: RetryConfig
}

type State = { status: 'processed' | 'reorganized'; previousHash: string; block: Block }
type Seed = { status: 'initial' }

export function createListener({
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
    map((blockNumber) => (blockNumber as number) - confirmations),
    tryLoadBlock(provider, retryConfig),
    scan<Block, State, Seed>(
      (state, block) => {
        if (state.status === 'initial') {
          // Check against initial latestProcessedBlock if provided
          return latestProcessedBlock == null || block.parentHash === latestProcessedBlock
            ? { status: 'processed', block, previousHash: block.parentHash }
            : { status: 'reorganized', block, previousHash: latestProcessedBlock }
        }
        return {
          status: block.parentHash === state.previousHash ? 'processed' : 'reorganized',
          block,
          previousHash: block.parentHash,
        }
      },
      { status: 'initial' }
    ),
    mergeMap(async ({ status, block, previousHash }) => {
      return status === 'processed'
        ? ({
            type: 'processed-block',
            block,
            roots: await tryLoadRootCIDs(provider, {
              address,
              fromBlock: block.number,
              toBlock: block.number,
            }),
          } as ProcessedBlockEvent)
        : ({
            type: 'reorganization',
            newBlock: block,
            latestProcessedBlock: previousHash,
          } as ReorganizationEvent)
    })
  )
}
