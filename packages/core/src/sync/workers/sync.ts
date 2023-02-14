import { default as PgBoss } from 'pg-boss'
import { type SendOptions } from 'pg-boss'
import { IJobQueue, Job, Worker } from '../../state-management/job-queue.js'
import { BlockProofs, createBlocksProofsLoader } from '@ceramicnetwork/anchor-listener'
import type { Provider } from '@ethersproject/providers'
import { concatMap, lastValueFrom, of, catchError } from 'rxjs'
import { createRebuildAnchorJob } from './rebuild-anchor.js'
import { RebuildAnchorJobData, JobData } from '../interfaces.js'
import { DiagnosticsLogger } from '@ceramicnetwork/common'

export const SYNC_JOB_NAME = 'sync'
const SYNC_JOB_OPTIONS: SendOptions = {
  retryLimit: 5,
  retryDelay: 60, // 1 minute
  retryBackoff: true,
  expireInHours: 12,
  retentionDays: 3,
}

interface SyncJobData {
  fromBlock: number
  toBlock: number
  models: string[]
}

export function createSyncJob(data: SyncJobData, options?: SendOptions): Job<SyncJobData> {
  return {
    name: SYNC_JOB_NAME,
    data,
    options: options || SYNC_JOB_OPTIONS,
  }
}

/**
 * Worker that creates recreateAnchor jobs based on the anchor proofs  recreates the anchor commits based on the anchor proof given.
 * It ensures that the data is stored and handled.
 */
export class SyncWorker implements Worker<SyncJobData> {
  constructor(
    private readonly provider: Provider,
    private readonly jobQueue: IJobQueue<JobData>,
    private readonly chainId,
    private readonly logger: DiagnosticsLogger
  ) {}

  /**
   * takes a sync job and retrieves the block proofs for each block between fromBlock - toBlock.
   * For each block with block proofs, create RebuildAnchorJobs which will recreate the anchor commits
   * and handle them.
   * @param job job that contains the sync job data
   */
  async handler(job: PgBoss.Job) {
    const jobData = job.data as SyncJobData
    const { fromBlock, toBlock, models } = jobData

    const blockProof$ = createBlocksProofsLoader({
      provider: this.provider,
      chainId: this.chainId,
      fromBlock,
      toBlock,
    }).pipe(
      // catch any errors so it doesn't stop any block proofs currently processing
      catchError((err) => {
        this.logger.err(
          `Received error when retreiving block proofs for models ${models} from block ${fromBlock} to block ${toBlock}: ${err}`
        )
        return of(null)
      }),
      // created rebuild anchor jobs for each block's proofs. Waits for last block to finish processing
      // before starting the next block
      concatMap(async (blockProofs: BlockProofs | null) => {
        if (!blockProofs) {
          throw Error('Error loading block proof')
        }

        const { proofs, blockNumber } = blockProofs
        if (proofs.length > 0) {
          const jobs: Job<RebuildAnchorJobData>[] = proofs.map((proof) =>
            createRebuildAnchorJob(proof, models)
          )

          await this.jobQueue.addJobs(jobs)

          this.logger.debug(
            `Successfully created ${jobs.length} rebuild anchor commit jobs for block ${blockNumber}`
          )
        }

        await this.jobQueue.updateJob(job.id, {
          fromBlock: blockNumber + 1,
          toBlock,
          models,
        })
      })
    )

    await lastValueFrom(blockProof$).then(() => {
      this.logger.debug(
        `Sync completed for models ${models} from block ${fromBlock} to block ${toBlock}`
      )
    })
  }
}
