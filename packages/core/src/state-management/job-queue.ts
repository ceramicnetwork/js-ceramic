import { default as PgBoss } from 'pg-boss'
import Pg from 'pg'
import { fromEvent, firstValueFrom } from 'rxjs'

export interface IJobQueue {
  init: () => Promise<void>
  addJob: (jobName: string, data?: any) => Promise<void>
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

  constructor(db: string, private readonly workersByJob: Record<string, Worker>) {
    this.dbConnection = new Pg.Pool({
      connectionString: db,
    })

    this.queue = new PgBoss({ db: new PgWrapper(this.dbConnection) })
  }

  /**
   * Starts the job queue and adds workers for each job
   */
  async init(): Promise<void> {
    await this.dbConnection.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')

    await this.queue.start()

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
    await firstValueFrom(fromEvent(this.queue, 'stopped'))
    await this.dbConnection.end()
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
