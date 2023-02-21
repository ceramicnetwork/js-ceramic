import {
  default as PgBoss,
  type SendOptions,
  JobWithMetadata as PgBossJobWithMetadata,
} from 'pg-boss'
import Pg from 'pg'
import { fromEvent, firstValueFrom, timeout, throwError, filter, interval, mergeMap } from 'rxjs'
import { DiagnosticsLogger } from '@ceramicnetwork/common'

export interface Job<T extends Record<any, any>> {
  name: string
  data: T
  id?: string
  options?: SendOptions
}

export interface JobWithMetadata<T> extends Job<T> {
  startedOn: Date
  createdOn: Date
  completedOn: Date | null
}

export type JobState =
  | 'created'
  | 'retry'
  | 'active'
  | 'completed'
  | 'expired'
  | 'cancelled'
  | 'failed'

export interface IJobQueue<T extends Record<any, any>> {
  init: (workersByJob: Record<string, Worker<T>>) => Promise<void>
  addJob: (job: Job<T>) => Promise<void>
  addJobs: (jobs: Job<T>[]) => Promise<void>
  updateJob: (jobId: string, data: T) => Promise<void>
  stop: () => Promise<void>
}

export type Worker<T> = {
  handler: (job: PgBoss.Job<T>) => any
}

class PgWrapper implements PgBoss.Db {
  constructor(private readonly db: Pg.Client) {}

  executeSql(text: string, values: any[]): Promise<{ rows: any[]; rowCount: number }> {
    return this.db.query(text, values)
  }
}

/**
 * Job queue which provides background processing by workers
 */
export class JobQueue<T extends Record<any, any>> implements IJobQueue<T> {
  private queue: PgBoss
  private dbConnection: Pg.Pool
  private jobs: string[]

  constructor(db: string, private readonly logger: DiagnosticsLogger) {
    this.dbConnection = new Pg.Pool({
      connectionString: db,
    })

    this.queue = new PgBoss({ db: new PgWrapper(this.dbConnection) })
    this.queue.on('error', (err) => {
      this.logger.err(`Error received by job queue: ${err}`)
    })
  }

  async _getJobIds(state: JobState = 'active', jobTypes = this.jobs): Promise<string[]> {
    const result = await this.dbConnection.query(
      `SELECT id FROM pgboss.job WHERE state = '${state}' and name IN (${jobTypes
        .map((jobName) => `'${jobName}'`)
        .join(', ')})`
    )

    return result.rows.map(({ id }) => id)
  }

  /**
   * Retrieves the active jobs being worked on organized by job name
   * @returns Promise for an object where the keys reprsent the job names, and the values are arrays of jobs.
   */
  async getJobs(
    state: JobState = 'active',
    jobTypes = this.jobs
  ): Promise<Record<string, Array<JobWithMetadata<T>>>> {
    const activeJobsIds = await this._getJobIds(state, jobTypes)

    const jobs = await Promise.all(activeJobsIds.map((jobId) => this.queue.getJobById(jobId)))

    return jobs.reduce(
      (jobsByJobName: Record<string, Array<JobWithMetadata<T>>>, job: PgBossJobWithMetadata) => {
        if (!jobsByJobName[job.name]) jobsByJobName[job.name] = []
        jobsByJobName[job.name].push({
          name: job.name,
          data: job.data as T,
          id: job.id,
          startedOn: job.startedon,
          createdOn: job.createdon,
          completedOn: job.completedon,
        })

        return jobsByJobName
      },
      {} as Record<string, Array<JobWithMetadata<T>>>
    )
  }

  /**
   * Starts the job queue and adds workers for each job
   */
  async init(workersByJob: Record<string, Worker<T>>, resumeActive = true): Promise<void> {
    this.jobs = Object.keys(workersByJob)

    await this.dbConnection.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')
    await this.queue.start()

    if (resumeActive) {
      const activeJobsIds = await this._getJobIds('active')

      if (activeJobsIds.length > 0) {
        await this.queue.cancel(activeJobsIds)
        await this.queue.resume(activeJobsIds)
      }
    }

    await Promise.all(
      Object.entries(workersByJob).map(([jobName, worker]) =>
        this.queue.work(jobName, { teamRefill: true }, worker.handler.bind(worker))
      )
    )
  }

  _workerExistsForJob(jobName: string): boolean {
    return this.jobs.includes(jobName)
  }

  /**
   * Adds a job to the job queue
   * @param jobName
   * @param data
   */
  async addJob(job: Job<T>): Promise<void> {
    if (!this._workerExistsForJob(job.name)) {
      throw Error(`Cannot add job ${job.name} to queue because no workers for that job exist`)
    }

    await this.queue.send(job.name, job.data, job.options)
  }

  /**
   * Adds multiple jobs to the job queue
   * @param jobName
   * @param data
   */
  async addJobs(jobs: Job<T>[]): Promise<void> {
    const jobWithoutWorker = jobs.find((job) => !this._workerExistsForJob(job.name))
    if (jobWithoutWorker) {
      throw Error(
        `Cannot add job ${jobWithoutWorker.name} to queue because no workers for that job exist`
      )
    }

    await this.queue.insert(
      jobs.map((job) => ({
        name: job.name,
        data: job.data,
      }))
    )
  }

  /**
   * Stops the job queue. Waits up to 30000 ms for active jobs to complete
   */
  async stop(): Promise<void> {
    await this.queue.stop({ graceful: true })
    // If there are active workers, pgBoss does not clean up. This function must be called to do the clean up.
    await (this.queue as any).boss.stop()
    await firstValueFrom(fromEvent(this.queue, 'stopped'))

    if (this.dbConnection) {
      await this.dbConnection.end()
      this.dbConnection = null
    }
  }

  /**
   * Updates the job data for a particular job
   * @param jobId id of the job
   * @param data data to update
   * @returns promise that resolves if the job was successfully updated
   */
  async updateJob(jobId: string, data: T): Promise<void> {
    const text = 'UPDATE pgboss.job set data = $1 WHERE id = $2'
    const values = [data, jobId]
    const result = await this.dbConnection.query(text, values)

    if (result.rowCount !== 1) {
      throw Error(`Unable to update job with id ${jobId}`)
    }
  }

  async _clearAllJobs(): Promise<void> {
    await this.queue.clearStorage()
  }

  async _waitForAllJobsToComplete(): Promise<void> {
    await firstValueFrom(
      interval(500).pipe(
        mergeMap(() =>
          Promise.all(
            this.jobs.map(async (jobName) =>
              this.queue.getQueueSize(jobName, { before: 'completed' })
            )
          )
        ),
        filter((jobCounts) => jobCounts.every((count) => count === 0)),
        timeout({
          each: 30000,
          with: () => throwError(() => new Error(`Timeout waiting for jobs to complete`)),
        })
      )
    )
  }
}
