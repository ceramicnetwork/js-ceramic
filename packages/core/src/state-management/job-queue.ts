import { default as PgBoss } from 'pg-boss'

export interface IJobQueue {
  init: () => Promise<void>
  addJob: (jobName: string, data?: any) => Promise<void>
  stop: () => Promise<void>
}

export interface SyncConfig {
  /**
   * Database connection string.
   */
  db: string
}

export type Worker = {
  handler: (any) => any
}

/**
 * Job queue which provides background processing by workers
 */
export class JobQueue implements IJobQueue {
  private queue: PgBoss

  constructor(
    private readonly syncConfig: SyncConfig,
    private readonly workersByJob: Record<string, Worker>
  ) {
    this.queue = new PgBoss({
      connectionString: this.syncConfig.db,
    })
  }

  /**
   * Starts the job queue and adds workers for each job
   */
  async init(): Promise<void> {
    this.queue.start()

    await Promise.all(
      Object.entries(this.workersByJob).map(([jobName, worker]) =>
        this.queue.work(jobName, worker.handler)
      )
    )

    return
  }

  /**
   * Adds a job to the job queue
   * @param jobName
   * @param data
   */
  async addJob(jobName: string, data?: any): Promise<void> {
    if (!Object.keys(this.workersByJob).includes(jobName)) {
      throw Error(`Cannot add job ${jobName} to queue because no workers for that job exist`)
    }

    await this.queue.send(jobName, data)
  }

  /**
   * Stops the job queue. Waits up to 30000ms for active jobs to complete
   */
  async stop(): Promise<void> {
    await this.queue.stop()
  }

  async _clearAllJobs(): Promise<void> {
    await this.queue.clearStorage()
  }

  async _getJobCounts(): Promise<Record<string, number>> {
    return Object.fromEntries(
      await Promise.all(
        Object.keys(this.workersByJob).map(async (jobName) => {
          return [jobName, await this.queue.getQueueSize(jobName)]
        })
      )
    )
  }
}
