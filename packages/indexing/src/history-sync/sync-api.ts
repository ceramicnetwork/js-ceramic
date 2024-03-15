import knex, { type Knex } from 'knex'
import {
  type BlockProofsListenerEvent,
  createBlockProofsListener,
} from '@ceramicnetwork/anchor-listener'
import type { SupportedNetwork } from '@ceramicnetwork/anchor-utils'
import type { DiagnosticsLogger } from '@ceramicnetwork/common'
import { type IJobQueue, JobQueue } from '@ceramicnetwork/job-queue'
import type { Provider } from '@ethersproject/providers'
import { catchError, concatMap, defer, interval, mergeMap, Subscription } from 'rxjs'

import type { LocalIndexApi } from '../local-index-api.js'

import {
  CONTINUOUS_SYNC_JOB,
  HISTORY_SYNC_JOB,
  HandleCommit,
  ISyncApi,
  IpfsService,
  REBUILD_ANCHOR_JOB,
  SyncJobData,
  SyncJobType,
  type JobData,
  type SyncJob,
  type ModelSyncOptions,
} from './interfaces.js'
import { RebuildAnchorWorker } from './workers/rebuild-anchor.js'
import {
  createContinuousSyncJob,
  createHistorySyncJob,
  SyncCompleteData,
  SyncWorker,
} from './workers/sync.js'

// NOTE: In V' history sync will need to be reworked (ex. use CAR files, use recon)

const SYNC_STATUS_LOG_INTERVAL = 60000
export const BLOCK_CONFIRMATIONS = 20
export const INITIAL_INDEXING_BLOCKS: Record<string, number> = {
  'eip155:1': 16695723,
  'eip155:5': 8503000,
  'eip155:100': 26511896,
  'eip155:11155111': 19421153, // TODO: current height, contract not deployed yet
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

// TODO (CDB-2106): move to SyncStatus Class
export interface ActiveSyncStatus {
  // The block the sync starts at
  startBlock: number
  // The block the sync is currently processing
  currentBlock: number
  // The block the sync will end on
  endBlock: number
  // Models that are being synced
  models: Array<string>
  // Date when the sync was requested
  createdAt: Date
  // Date when the sync started
  startedAt: Date
}
export interface ContinuousSyncStatus {
  // The first block recevied form the chain on node startup
  startBlock: number
  // The latest block received from the chain
  latestBlock: number
  // The number of blocks we wait for before we process a block
  confirmations: number
  // The block we are currently processing (should be latestBlock - confirmations)
  currentBlock: number
  // Models that are being synced
  models: Array<string>
}
export interface PendingSyncStatus {
  // The block the sync starts at
  startBlock: number
  // The block the sync will end on
  endBlock: number
  // Models that are being synced
  models: Array<string>
  // Date when the sync was requested
  createdAt: Date
}
export interface SyncStatus {
  activeSyncs: Array<ActiveSyncStatus>
  continuousSync: Array<ContinuousSyncStatus>
  pendingSyncs: Array<PendingSyncStatus>
}

export class SyncApi implements ISyncApi {
  public readonly modelsToSync = new Set<string>()
  public readonly modelsToHistoricSync = new Map<string, number>()
  private readonly dataSource!: Knex
  private readonly jobQueue!: IJobQueue<JobData>
  private subscription: Subscription | undefined
  private provider!: Provider
  private chainId!: SupportedNetwork
  private defaultStartBlock!: number
  private periodicStatusLogger: Subscription | undefined
  private currentBlock!: number
  private startBlock!: number

  constructor(
    private readonly syncConfig: SyncConfig,
    private readonly ipfsService: IpfsService,
    private readonly handleCommit: HandleCommit, // TODO(CDB-2653): circular dependency
    private readonly localIndex: LocalIndexApi, // TODO(CDB-2653): circular dependency
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
    this.defaultStartBlock = INITIAL_INDEXING_BLOCKS[this.chainId] || 0

    const [latestBlock, { processedBlockNumber }] = await Promise.all([
      this.provider.getBlock(-BLOCK_CONFIRMATIONS),
      this._initStateTable(),
      this._initModelsToSync(),
      this._initJobQueue(),
    ])

    this.startBlock = latestBlock.number
    this._initBlockSubscription(latestBlock.hash)

    // catching up
    if (processedBlockNumber == null) {
      //no sync happened before
      await this._addSyncJob(HISTORY_SYNC_JOB, {
        jobType: SyncJobType.Catchup,
        fromBlock: this.defaultStartBlock,
        toBlock: latestBlock.number,
        models: Array.from(this.modelsToSync),
      })
    } else if (processedBlockNumber < latestBlock.number) {
      // sync has happened, but we still need to catch up
      await this._addSyncJob(HISTORY_SYNC_JOB, {
        jobType: SyncJobType.Catchup,
        fromBlock: processedBlockNumber,
        toBlock: latestBlock.number,
        models: Array.from(this.modelsToSync),
      })
    }

    this._initPeriodicStatusLogger()
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
        this.diagnosticsLogger,
        this.syncCompletedForModel.bind(this)
      ),
      [CONTINUOUS_SYNC_JOB]: new SyncWorker(
        this.provider,
        this.jobQueue,
        this.chainId,
        this.diagnosticsLogger,
        this.syncCompletedForModel.bind(this)
      ),
    })
  }

  _upsertModelForHistoricSync(model: string) {
    let existing = this.modelsToHistoricSync.get(model)
    if (existing) {
      existing += 1
    } else {
      existing = 1
    }
    this.modelsToHistoricSync.set(model, existing)
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
          // TODO (CDB-2272): add retry logic
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
    this.currentBlock = block.number

    // reorg
    if (reorganized) {
      await this._addSyncJob(HISTORY_SYNC_JOB, {
        jobType: SyncJobType.Reorg,
        fromBlock: block.number - BLOCK_CONFIRMATIONS,
        toBlock: block.number,
        models: Array.from(this.modelsToSync),
      })
    } else {
      await this._addSyncJob(CONTINUOUS_SYNC_JOB, {
        jobType: SyncJobType.Continuous,
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

    if (data.jobType != SyncJobType.Reorg && data.jobType != SyncJobType.Continuous) {
      for (const model of data.models) {
        this._upsertModelForHistoricSync(model)
      }
    }

    const job =
      type === HISTORY_SYNC_JOB ? createHistorySyncJob(data) : createContinuousSyncJob(data)

    await this.jobQueue.addJob(job)
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

  // TODO (CDB-2106): move to SyncStatus Class
  async _logSyncStatus(): Promise<void> {
    const syncStatus = await this.syncStatus()
    this.diagnosticsLogger.imp(
      `Logging state of running ComposeDB syncs\n ${JSON.stringify(syncStatus, null, 3)}`
    )
  }
  async syncStatus(): Promise<SyncStatus> {
    const [activeJobs, pendingJobs] = await Promise.all([
      this.jobQueue.getJobs('active', [CONTINUOUS_SYNC_JOB, HISTORY_SYNC_JOB]),
      this.jobQueue.getJobs('created', [CONTINUOUS_SYNC_JOB, HISTORY_SYNC_JOB]),
    ])

    const historySyncJobs = activeJobs[HISTORY_SYNC_JOB] || []
    const continuousSyncJobs =
      activeJobs[CONTINUOUS_SYNC_JOB] || pendingJobs[CONTINUOUS_SYNC_JOB] || []
    const pendingSyncJobs = pendingJobs[HISTORY_SYNC_JOB] || []

    return {
      activeSyncs: historySyncJobs.map((job) => {
        const jobData = job.data as SyncJobData
        return {
          currentBlock: jobData.currentBlock || jobData.fromBlock,
          startBlock: jobData.fromBlock,
          endBlock: jobData.toBlock,
          models: jobData.models,
          createdAt: job.createdOn,
          startedAt: job.startedOn,
        }
      }),

      continuousSync:
        continuousSyncJobs.length > 0
          ? continuousSyncJobs.map((job) => {
              const jobData = job.data as SyncJobData
              return {
                startBlock: this.startBlock,
                latestBlock: this.currentBlock,
                confirmations: BLOCK_CONFIRMATIONS,
                currentBlock: jobData.fromBlock,
                models: jobData.models,
              }
            })
          : [
              {
                startBlock: this.startBlock,
                latestBlock: this.currentBlock,
                confirmations: BLOCK_CONFIRMATIONS,
                currentBlock: this.currentBlock - BLOCK_CONFIRMATIONS,
                models: Array.from(this.modelsToSync),
              },
            ],

      pendingSyncs: pendingSyncJobs.map((job) => {
        const jobData = job.data as SyncJobData
        return {
          startBlock: jobData.fromBlock,
          endBlock: jobData.toBlock,
          models: jobData.models,
          createdAt: job.createdOn,
        }
      }),
    }
  }

  _initPeriodicStatusLogger(): void {
    this.periodicStatusLogger = interval(SYNC_STATUS_LOG_INTERVAL)
      .pipe(
        concatMap(() => {
          return defer(async () => await this._logSyncStatus())
        })
      )
      .subscribe()
  }

  /**
   * Start sync over a block range for one or multiple models.
   * Also keeps in sync with new anchors.
   */
  async startModelSync(
    models: string | string[],
    syncOptions: ModelSyncOptions = {}
  ): Promise<void> {
    if (!this.syncConfig.on) return

    const modelIds = Array.isArray(models) ? models : [models]

    // Keep track of all models IDs to sync
    for (const id of modelIds) {
      const modelId = id.toString()
      this.modelsToSync.add(modelId)
    }

    const startBlock = Math.max(this.defaultStartBlock, syncOptions.startBlock || 0)

    const endBlock =
      !syncOptions.endBlock || syncOptions.endBlock < startBlock
        ? await this.provider.getBlock('latest').then(({ number }) => number - BLOCK_CONFIRMATIONS)
        : syncOptions.endBlock

    // start a new full sync on a model
    await this._addSyncJob(HISTORY_SYNC_JOB, {
      jobType: SyncJobType.Full,
      fromBlock: startBlock,
      toBlock: endBlock,
      models: modelIds,
    })
  }

  /**
   * Stop models from being included in the continuous sync
   * TODO (CDB-2303): Remove existing history sync jobs as well
   */
  async stopModelSync(models: string | string[]): Promise<void> {
    if (!this.syncConfig.on) return

    const modelIds = Array.isArray(models) ? models : [models]
    for (const id of modelIds) {
      this.modelsToSync.delete(id.toString())
    }

    // TODO (CDB-2303): Remove when ticket is implemented
    this.diagnosticsLogger.warn(
      `Stopped syncing models ${models}. Syncs that are currently running will not be stopped/cancelled but this is a temporary state and will be implemented in a future version.`
    )
  }

  syncCompletedForModel(data: SyncCompleteData) {
    if (data.jobType !== SyncJobType.Reorg && data.jobType !== SyncJobType.Continuous) {
      const existing = this.modelsToHistoricSync.get(data.modelId)
      if (existing) {
        if (existing <= 1) {
          this.modelsToHistoricSync.delete(data.modelId)
        } else {
          this.modelsToHistoricSync.set(data.modelId, existing - 1)
        }
      }
    }
  }

  syncComplete(model: string): boolean {
    const count = this.modelsToHistoricSync.get(model) || 0
    return count === 0
  }

  async shutdown(): Promise<void> {
    if (!this.syncConfig.on) return

    this.subscription?.unsubscribe()
    this.subscription = undefined

    this.periodicStatusLogger?.unsubscribe()
    this.periodicStatusLogger = undefined

    await this.jobQueue.stop()
  }

  get enabled() {
    return Boolean(this.syncConfig.on)
  }
}
