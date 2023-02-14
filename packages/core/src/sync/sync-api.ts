import knex, { type Knex } from 'knex'
import {
  type BlockProofsListenerEvent,
  createBlockProofsListener,
} from '@ceramicnetwork/anchor-listener'
import type { SupportedNetwork } from '@ceramicnetwork/anchor-utils'
import type { DiagnosticsLogger } from '@ceramicnetwork/common'
import type { Provider } from '@ethersproject/providers'
import { Subscription, mergeMap, catchError } from 'rxjs'

import type { LocalIndexApi } from '../indexing/local-index-api.js'
import { JobQueue } from '../state-management/job-queue.js'

import {
  REBUILD_ANCHOR_JOB,
  ISyncApi,
  IpfsService,
  HandleCommit,
  type JobData,
  type SyncJob,
  HISTORY_SYNC_JOB,
  CONTINUOUS_SYNC_JOB,
  SyncJobData,
} from './interfaces.js'
import { RebuildAnchorWorker } from './workers/rebuild-anchor.js'
import { SyncWorker, createHistorySyncJob, createContinuousSyncJob } from './workers/sync.js'

export const BLOCK_CONFIRMATIONS = 20
// TODO: block number to be defined
export const INITIAL_INDEXING_BLOCKS: Record<string, number> = {
  'eip155:1': 16587130,
  'eip155:5': 8458698,
  'eip155:100': 26381584,
}

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

  on?: boolean
}

export class SyncApi implements ISyncApi {
  public readonly modelsToSync = new Set<string>()

  private readonly dataSource: Knex
  private readonly jobQueue: JobQueue<JobData>
  private subscription: Subscription | undefined
  private provider: Provider
  private chainId: SupportedNetwork
  private initialIndexingBlock: number

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
    this.initialIndexingBlock = INITIAL_INDEXING_BLOCKS[this.chainId] || 0

    const [latestBlock, { processedBlockNumber }] = await Promise.all([
      this.provider.getBlock(-BLOCK_CONFIRMATIONS),
      this._initStateTable(),
      this._initModelsToSync(),
      this._initJobQueue(),
    ])

    this._initBlockSubscription(latestBlock.hash)

    if (processedBlockNumber == null) {
      await this._addSyncJob(HISTORY_SYNC_JOB, {
        fromBlock: this.initialIndexingBlock,
        toBlock: latestBlock.number,
        models: Array.from(this.modelsToSync),
      })
    } else if (processedBlockNumber < latestBlock.number) {
      await this._addSyncJob(HISTORY_SYNC_JOB, {
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
      [REBUILD_ANCHOR_JOB]: new RebuildAnchorWorker(
        this.ipfsService,
        this.handleCommit,
        this.diagnosticsLogger
      ),
      [HISTORY_SYNC_JOB]: new SyncWorker(
        this.provider,
        this.jobQueue,
        this.chainId,
        this.diagnosticsLogger
      ),
      [CONTINUOUS_SYNC_JOB]: new SyncWorker(
        this.provider,
        this.jobQueue,
        this.chainId,
        this.diagnosticsLogger
      ),
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
      .pipe(
        mergeMap((blockProofs) => this._handleBlockProofs(blockProofs)),
        catchError((err) => {
          this.diagnosticsLogger.err(`Error received during continuous sync: ${err}`)
          // TODO: retry
          throw err
        })
      )
      .subscribe()
  }

  /**
   * Callback used when a block is received from the listener.
   *
   * @param event: BlockProofsListenerEvent
   */
  async _handleBlockProofs({ block, reorganized }: BlockProofsListenerEvent): Promise<void> {
    if (reorganized) {
      await this._addSyncJob(HISTORY_SYNC_JOB, {
        fromBlock: block.number - BLOCK_CONFIRMATIONS,
        toBlock: block.number,
        models: Array.from(this.modelsToSync),
      })
    } else {
      await this._addSyncJob(CONTINUOUS_SYNC_JOB, {
        fromBlock: block.number,
        toBlock: block.number,
        models: Array.from(this.modelsToSync),
      })
    }

    await this._updateStoredState({
      processedBlockHash: block.hash,
      processedBlockNumber: block.number,
    })
  }

  /**
   * Add a sync job to the queue.
   */
  async _addSyncJob(type: SyncJob, data: SyncJobData): Promise<void> {
    if (data.models.length === 0) {
      return
    }

    const job =
      type === HISTORY_SYNC_JOB ? createHistorySyncJob(data) : createContinuousSyncJob(data)

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
    models: string | string[],
    startBlock = this.initialIndexingBlock,
    endBlock?
  ): Promise<void> {
    if (!this.syncConfig.on) return

    const modelIds = Array.isArray(models) ? models : [models]

    // Keep track of all models IDs to sync
    for (const id of modelIds) {
      this.modelsToSync.add(id.toString())
    }

    if (!endBlock) {
      endBlock = await this.provider
        .getBlock('latest')
        .then(({ number }) => number - BLOCK_CONFIRMATIONS)
    }

    await this._addSyncJob(HISTORY_SYNC_JOB, {
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

  get enabled() {
    return this.syncConfig.on
  }
}
