import knex, { type Knex } from 'knex'
import {
  type BlockProofsListenerEvent,
  createBlockProofsListener,
} from '@ceramicnetwork/anchor-listener'
import type { SupportedNetwork } from '@ceramicnetwork/anchor-utils'
import type { DiagnosticsLogger } from '@ceramicnetwork/common'
import type { Provider } from '@ethersproject/providers'
import { Subscription, mergeMap } from 'rxjs'
import type { StreamID } from '@ceramicnetwork/streamid'

import type { LocalIndexApi } from '../indexing/local-index-api.js'
import { JobQueue } from '../state-management/job-queue.js'

import {
  REBUILD_ANCHOR_JOB_NAME,
  SYNC_JOB_NAME,
  ISyncApi,
  IpfsService,
  HandleCommit,
  type JobData,
  type SyncJobData,
} from './interfaces.js'
import { RebuildAnchorWorker } from './workers/rebuild-anchor.js'
import { SyncWorker, createSyncJob } from './workers/sync.js'

export const BLOCK_CONFIRMATIONS = 20
// TODO: block number to be defined
export const INITIAL_INDEXING_BLOCK = 0
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

  on: boolean
}

export class SyncApi implements ISyncApi {
  public readonly modelsToSync = new Set<string>()

  private readonly dataSource: Knex
  private readonly jobQueue: JobQueue<JobData>
  private subscription: Subscription | undefined
  private provider: Provider
  private chainId: SupportedNetwork

  constructor(
    private readonly syncConfig: SyncConfig,
    private readonly ipfsService: IpfsService,
    private readonly handleCommit: HandleCommit,
    private readonly localIndex: LocalIndexApi,
    private readonly diagnosticsLogger: DiagnosticsLogger
  ) {
    if (!this.syncConfig.on) return

    this.dataSource = knex({ client: 'pg', connection: this.syncConfig.db })
    this.jobQueue = new JobQueue(this.syncConfig.db, this.diagnosticsLogger)
  }

  async init(provider: Provider): Promise<void> {
    if (!this.syncConfig.on) return
    this.provider = provider

    const chainIdNumber = (await provider.getNetwork()).chainId
    this.chainId = `eip155:${chainIdNumber}` as SupportedNetwork

    const [latestBlock, { processedBlockNumber }] = await Promise.all([
      this.provider.getBlock(-BLOCK_CONFIRMATIONS),
      this._initStateTable(),
      this._initModelsToSync(),
      this._initJobQueue(),
    ])

    this._initBlockSubscription(latestBlock.hash)

    if (processedBlockNumber == null) {
      await this._addSyncJob({
        fromBlock: INITIAL_INDEXING_BLOCK,
        toBlock: latestBlock.number,
        models: Array.from(this.modelsToSync),
      })
    } else if (processedBlockNumber < latestBlock.number) {
      await this._addSyncJob({
        fromBlock: processedBlockNumber,
        toBlock: latestBlock.number,
        models: Array.from(this.modelsToSync),
      })
    }
  }

  /**
   * Create workers and initialize job queue used by sync.
   */
  async _initJobQueue(): Promise<void> {
    await this.jobQueue.init({
      [REBUILD_ANCHOR_JOB_NAME]: new RebuildAnchorWorker(this.ipfsService, this.handleCommit),
      [SYNC_JOB_NAME]: new SyncWorker(this.provider, this.jobQueue),
    })
  }

  /**
   * Load models to sync from the DB.
   */
  async _initModelsToSync(): Promise<void> {
    const streamsIds = await this.localIndex.indexedModels()
    for (const id of streamsIds) {
      this.modelsToSync.add(id.toString())
    }
  }

  /**
   * Initialize the persisted sync state, creating the table in DB if needed.
   */
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

  /**
   * Initialize the subscription for handling new blocks.
   *
   * @param expectedParentHash
   */
  _initBlockSubscription(expectedParentHash?: string): void {
    this.subscription = createBlockProofsListener({
      confirmations: BLOCK_CONFIRMATIONS,
      chainId: this.chainId,
      provider: this.provider,
      expectedParentHash,
    })
      .pipe(mergeMap((blockProofs) => this._handleBlockProofs(blockProofs)))
      .subscribe()
  }

  /**
   * Callback used when a block is received from the listener.
   *
   * @param event: BlockProofsListenerEvent
   */
  async _handleBlockProofs({ block, reorganized }: BlockProofsListenerEvent): Promise<void> {
    await this._addSyncJob({
      fromBlock: reorganized ? block.number - BLOCK_CONFIRMATIONS : block.number,
      toBlock: block.number,
      models: Array.from(this.modelsToSync),
    })
    await this._updateStoredState({
      processedBlockHash: block.hash,
      processedBlockNumber: block.number,
    })
  }

  /**
   * Add a sync job to the queue.
   */
  async _addSyncJob(data: SyncJobData): Promise<void> {
    if (data.models.length === 0) {
      return
    }

    const job = createSyncJob(data)
    this.jobQueue.addJob(job)
  }

  /**
   * Persists the sync state in DB.
   */
  async _updateStoredState(state: StoredState): Promise<void> {
    await this.dataSource.from(STATE_TABLE_NAME).update({
      processed_block_hash: state.processedBlockHash,
      processed_block_number: state.processedBlockNumber,
    })
  }

  /**
   * Start sync over a block range for one or multiple models.
   * Also keeps in sync with new anchors.
   */
  async startModelSync(
    models: StreamID | StreamID[],
    startBlock = INITIAL_INDEXING_BLOCK,
    endBlock?
  ): Promise<void> {
    if (!this.syncConfig.on) return

    const modelIds = Array.isArray(models)
      ? models.map((model) => model.toString())
      : [models.toString()]

    // Keep track of all models IDs to sync
    for (const id of modelIds) {
      this.modelsToSync.add(id)
    }

    if (!endBlock) {
      endBlock = await this.provider
        .getBlock('latest')
        .then(({ number }) => number - BLOCK_CONFIRMATIONS)
    }

    await this._addSyncJob({
      fromBlock: startBlock,
      toBlock: endBlock,
      models: modelIds,
    })
  }

  async shutdown(): Promise<void> {
    if (!this.syncConfig.on) return

    this.subscription?.unsubscribe()
    this.subscription = undefined

    await this.jobQueue.stop()
  }
}
