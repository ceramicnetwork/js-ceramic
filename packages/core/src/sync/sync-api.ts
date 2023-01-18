import knex, { type Knex } from 'knex'
import { createBlockProofsListener } from '@ceramicnetwork/anchor-listener'
import type { SupportedNetwork } from '@ceramicnetwork/anchor-utils'
import type { Provider } from '@ethersproject/providers'
import { Subscription, mergeMap } from 'rxjs'

import { ISyncApi, IpfsService, HandleCommit } from './interfaces.js'

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
      this._initStateTable(),
    ])

    this.subscription = new Subscription()

    if (processedBlockNumber == null) {
      // TODO: full sync
    } else if (processedBlockNumber < latestBlock.number) {
      // TODO: sync blocks between processedBlockNumber and latestBlock
    }

    this.subscription.add(
      createBlockProofsListener({
        confirmations: BLOCK_CONFIRMATIONS,
        chainId: this.syncConfig.chainId,
        provider: this.provider,
        expectedParentHash: latestBlock.hash,
      })
        .pipe(
          mergeMap(async ({ block }) => {
            // TODO: start new jobs

            // Update stored state after jobs are created
            await this._updateStoredState({
              processedBlockHash: block.hash,
              processedBlockNumber: block.number,
            })
          })
        )
        .subscribe()
    )
  }

  async _initStateTable(): Promise<StoredState> {
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

  async _updateStoredState(state: StoredState): Promise<void> {
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
    this.subscription = undefined
  }
}
