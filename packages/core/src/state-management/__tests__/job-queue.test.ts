import { JobQueue, Worker } from '../job-queue.js'
import pgSetup from '@databases/pg-test/jest/globalSetup'
import pgTeardown from '@databases/pg-test/jest/globalTeardown'
import { jest } from '@jest/globals'
import { firstValueFrom, timeout, throwError, filter, interval, mergeMap } from 'rxjs'

const createMockWorker = (): Worker => {
  return {
    handler: jest.fn(() => Promise.resolve()),
  }
}

describe('job queue', () => {
  jest.setTimeout(150000) // 2.5mins timeout for initial docker fetch+init
  const workers: Record<string, Worker> = {
    job1: createMockWorker(),
    job2: createMockWorker(),
    job3: createMockWorker(),
  }
  let myJobQueue: JobQueue

  beforeAll(async () => {
    await pgSetup()
    myJobQueue = new JobQueue(process.env.DATABASE_URL as string, workers)
    await myJobQueue.init()
  })

  beforeEach(async () => {
    if (myJobQueue) await myJobQueue._clearAllJobs()

    Object.values(workers).map((worker) => {
      ;(worker.handler as any).mockReset()
    })
  })

  afterAll(async () => {
    if (myJobQueue) await myJobQueue.stop()
    await pgTeardown()
  })

  test('Can execute different jobs', async () => {
    const jobs = ['job1', 'job2', 'job1', 'job3', 'job3', 'job1']
    await Promise.all(jobs.map((job) => myJobQueue.addJob(job)))

    // waits for all jobs to complete
    await firstValueFrom(
      interval(500).pipe(
        mergeMap(() => myJobQueue._getJobCounts()),
        filter((jobCounts) => Object.values(jobCounts).every((count) => count === 0)),
        timeout({
          each: 30000,
          with: () => throwError(() => new Error(`Timeout waiting for jobs to complete`)),
        })
      )
    )

    expect(workers.job1.handler).toHaveBeenCalledTimes(3)
    expect(workers.job2.handler).toHaveBeenCalledTimes(1)
    expect(workers.job3.handler).toHaveBeenCalledTimes(2)
  })
})
