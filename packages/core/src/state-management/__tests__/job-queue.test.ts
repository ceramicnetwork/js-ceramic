import { JobQueue, Worker } from '../job-queue.js'
import pgSetup from '@databases/pg-test/jest/globalSetup'
import pgTeardown from '@databases/pg-test/jest/globalTeardown'
import { jest } from '@jest/globals'
import { firstValueFrom, timeout, throwError, filter, interval, mergeMap } from 'rxjs'
import { default as PgBoss } from 'pg-boss'

class MockWorker implements Worker {
  constructor() {
    this.reset()
  }

  handler = jest.fn((job: PgBoss.Job) => {
    return Promise.resolve()
  })

  reset() {
    this.handler.mockRestore()
    this.handler.mockImplementation((job: PgBoss.Job) => {
      return Promise.resolve()
    })
  }
}

const waitForAllJobsToComplete = async (jobQueue: JobQueue) =>
  await firstValueFrom(
    interval(500).pipe(
      mergeMap(() => jobQueue._getJobCounts()),
      filter((jobCounts) => Object.values(jobCounts).every((count) => count === 0)),
      timeout({
        each: 30000,
        with: () => throwError(() => new Error(`Timeout waiting for jobs to complete`)),
      })
    )
  )

describe('job queue', () => {
  jest.setTimeout(150000) // 2.5mins timeout for initial docker fetch+init
  let workers: Record<string, MockWorker>
  let myJobQueue: JobQueue

  beforeAll(async () => {
    await pgSetup()
    myJobQueue = new JobQueue(process.env.DATABASE_URL as string)
    workers = {
      job1: new MockWorker(),
      job2: new MockWorker(),
      job3: new MockWorker(),
    }
    await myJobQueue.init(workers)
  })

  beforeEach(async () => {
    if (myJobQueue) await myJobQueue._clearAllJobs()

    Object.values(workers).map((worker) => {
      worker.reset()
    })
  })

  afterAll(async () => {
    if (myJobQueue) await myJobQueue.stop()
    await pgTeardown()
  })

  test('Can execute different jobs', async () => {
    const jobs = ['job1', 'job2', 'job1', 'job3', 'job3', 'job1'].map((name) => ({
      name,
      data: {},
    }))

    await Promise.all(jobs.map((job) => myJobQueue.addJob(job)))

    await waitForAllJobsToComplete(myJobQueue)

    expect(workers.job1.handler).toHaveBeenCalledTimes(3)
    expect(workers.job2.handler).toHaveBeenCalledTimes(1)
    expect(workers.job3.handler).toHaveBeenCalledTimes(2)
  })

  test('Can update job data, and retry using new data', async () => {
    workers.job1.handler.mockImplementation(async (job: PgBoss.Job) => {
      const jobData = job.data as any

      if (jobData.retried === false) {
        await myJobQueue.updateJob(job.id, { retried: true })
        throw new Error('test error')
      }

      return
    })

    await myJobQueue.addJob({
      name: 'job1',
      data: { retried: false },
      options: { retryLimit: 1, retryDelay: 1, onComplete: true },
    })

    await waitForAllJobsToComplete(myJobQueue)

    expect(workers.job1.handler).toHaveBeenCalledTimes(2)
    const firstJob = workers.job1.handler.mock.calls[0][0]
    expect(firstJob.data).toEqual({ retried: false })
    const secondJob = workers.job1.handler.mock.calls[1][0]
    expect(secondJob.data).toEqual({ retried: true })
  })

  test('Can add multiple jobs at once', async () => {
    const jobs = ['job1', 'job2', 'job1', 'job3', 'job3', 'job1'].map((name) => ({
      name,
      data: {},
    }))
    await myJobQueue.addJobs(jobs)

    await waitForAllJobsToComplete(myJobQueue)

    expect(workers.job1.handler).toHaveBeenCalledTimes(3)
    expect(workers.job2.handler).toHaveBeenCalledTimes(1)
    expect(workers.job3.handler).toHaveBeenCalledTimes(2)
  })
})
