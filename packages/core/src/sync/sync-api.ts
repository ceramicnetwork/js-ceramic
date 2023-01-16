import knex, { type Knex } from 'knex'
import type { CID } from 'multiformats/cid'
import { createBlockProofsListener } from '@ceramicnetwork/anchor-listener'
import type { SupportedNetwork } from '@ceramicnetwork/anchor-utils'
import { StreamID } from '@ceramicnetwork/streamid'
import type { Provider } from '@ethersproject/providers'
import { type Subscription, mergeMap } from 'rxjs'

import { ISyncApi, IpfsService } from './interfaces.js'

export const BLOCK_CONFIRMATIONS = 20
export const STATE_TABLE_NAME = 'ceramic_indexing_state'

type StoredState = {
  processedBlockHash?: string
  processedBlockNumber?: number
}

export type SyncConfig = {
  /**
   * Database connection string.
   */
  db: string
  /**
   * Anchor network ID.
   */
  chainId: SupportedNetwork
}

// handles a commit found during a sync
// should be similar to: https://github.com/ceramicnetwork/js-ceramic/blob/6ae6e121b33132225f256762825e1439fd84f23a/packages/core/src/state-management/state-manager.ts#L210
type HandleCommit = (streamId: StreamID, commit: CID, model?: StreamID) => Promise<void>

export class SyncApi implements ISyncApi {
  private readonly dataSource: Knex
  private subscription: Subscription | undefined

  constructor(
    private readonly syncConfig: SyncConfig,
    private readonly ipfsService: IpfsService,
    private readonly handleCommit: HandleCommit,
    private readonly provider: Provider
  ) {
    // create job queue

    this.dataSource = knex({ client: 'pg', connection: syncConfig.db })
  }

  async init(): Promise<void> {
    // initialize job queue with handlers from ./workers

    // start blockchain listener
    const [latestBlock, { processedBlockNumber }] = await Promise.all([
      this.provider.getBlock(-BLOCK_CONFIRMATIONS),
      this.initStateTable(),
    ])

    if (processedBlockNumber != null && processedBlockNumber < latestBlock.number) {
      // TODO: sync missed blocks
    }

    this.subscription = createBlockProofsListener({
      confirmations: BLOCK_CONFIRMATIONS,
      chainId: this.syncConfig.chainId,
      provider: this.provider,
      expectedParentHash: latestBlock.hash,
    })
      .pipe(
        mergeMap(async ({ block }) => {
          // TODO: start new jobs

          // Update stored state after jobs are created
          await this.updateStoredState({
            processedBlockHash: block.hash,
            processedBlockNumber: block.number,
          })
        })
      )
      .subscribe()
  }

  private async initStateTable(): Promise<StoredState> {
    const exists = await this.dataSource.schema.hasTable(STATE_TABLE_NAME)
    if (!exists) {
      await this.dataSource.schema.createTable(STATE_TABLE_NAME, function (table) {
        table.string('processed_block_hash', 1024)
        table.integer('processed_block_number')
      })
      await this.dataSource
        .into(STATE_TABLE_NAME)
        .insert({ processed_block_hash: null, processed_block_number: null })
      return {}
    }
    const state = await this.dataSource.from(STATE_TABLE_NAME).first()
    return {
      processedBlockHash: state['processed_block_hash'],
      processedBlockNumber: state['processed_block_number'],
    }
  }

  private async updateStoredState(state: StoredState): Promise<void> {
    await this.dataSource.from(STATE_TABLE_NAME).update({
      processed_block_hash: state.processedBlockHash,
      processed_block_number: state.processedBlockNumber,
    })
  }

  async startModelSync(
    startBlock: number,
    endBlock: number,
    models: string | string[]
  ): Promise<void> {
    // add to job queue
  }

  async shutdown(): Promise<void> {
    // stop all workers and shuts the job queue down
    this.subscription?.unsubscribe()
  }
}
