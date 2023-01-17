import { default as PgBoss, type SendOptions } from 'pg-boss'
import Pg from 'pg'
import { fromEvent, firstValueFrom } from 'rxjs'

export type Job = {
  name: string
  data: object
  id?: string
  options?: SendOptions
}

export interface IJobQueue {
  init: (workersByJob: Record<string, Worker>) => Promise<void>
  addJob: (job: Job) => Promise<void>
  addJobs: (jobs: Job[]) => Promise<void>
  updateJob: (jobId: string, data: object) => Promise<void>
  stop: () => Promise<void>
}

export type Worker = {
  handler: (any) => any
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
export class JobQueue implements IJobQueue {
  private queue: PgBoss
  private dbConnection: Pg.Pool
  private workersByJob: Record<string, Worker> = {}

  constructor(db: string) {
    this.dbConnection = new Pg.Pool({
      connectionString: db,
    })

    this.queue = new PgBoss({ db: new PgWrapper(this.dbConnection) })
  }

  /**
   * Starts the job queue and adds workers for each job
   */
  async init(workersByJob: Record<string, Worker>): Promise<void> {
    this.workersByJob = workersByJob

    await this.dbConnection.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')
    await this.queue.start()
    await Promise.all(
      Object.entries(workersByJob).map(([jobName, worker]) =>
        this.queue.work(jobName, worker.handler)
      )
    )
  }

  _workerExistsForJob(jobName: string): boolean {
    return Object.keys(this.workersByJob).includes(jobName)
  }

  /**
   * Adds a job to the job queue
   * @param jobName
   * @param data
   */
  async addJob(job: Job): Promise<void> {
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
  async addJobs(jobs: Job[]): Promise<void> {
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
   * Stops the job queue. Waits up to 30000ms for active jobs to complete
   */
  async stop(): Promise<void> {
    await this.queue.stop()
    await firstValueFrom(fromEvent(this.queue, 'stopped'))
    await this.dbConnection.end()
  }

  /**
   * Updates the job data for a particular job
   * @param jobId id of the job
   * @param data data to update
   * @returns promise that results to a boolean that is true of the
   */
  async updateJob(jobId: string, data: object): Promise<void> {
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

  async _getJobCounts(): Promise<Record<string, number>> {
    return Object.fromEntries(
      await Promise.all(
        Object.keys(this.workersByJob).map(async (jobName) => {
          return [jobName, await this.queue.getQueueSize(jobName, { before: 'completed' })]
        })
      )
    )
  }
}
