import { JobQueue, Worker, Job } from '../job-queue.js'
import pgSetup from '@databases/pg-test/jest/globalSetup'
import pgTeardown from '@databases/pg-test/jest/globalTeardown'
import { jest } from '@jest/globals'
import { default as PgBoss } from 'pg-boss'
import { TestUtils, LoggerProvider } from '@ceramicnetwork/common'
import { EventEmitter } from 'node:events'
import { fromEvent, firstValueFrom } from 'rxjs'

type MockJobData = Record<any, any>

class MockWorker implements Worker<MockJobData> {
  constructor() {
    this.reset()
  }

  handler = jest.fn((job: PgBoss.Job<MockJobData>) => {
    return Promise.resolve()
  })

  reset() {
    this.handler.mockRestore()
    this.handler.mockImplementation((job: PgBoss.Job<MockJobData>) => {
      return Promise.resolve()
    })
  }
}

describe('job queue', () => {
  jest.setTimeout(150000) // 2.5mins timeout for initial docker fetch+init
  let workers: Record<string, MockWorker>
  let myJobQueue: JobQueue<MockJobData>

  beforeAll(async () => {
    await pgSetup()
    myJobQueue = new JobQueue(
      process.env.DATABASE_URL as string,
      new LoggerProvider().getDiagnosticsLogger()
    )
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
    const jobs: Job<MockJobData>[] = ['job1', 'job2', 'job1', 'job3', 'job3', 'job1'].map(
      (name) => ({
        name,
        data: {},
      })
    )

    await Promise.all(jobs.map((job) => myJobQueue.addJob(job)))

    await myJobQueue._waitForAllJobsToComplete()

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

    await myJobQueue._waitForAllJobsToComplete()

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

    await myJobQueue._waitForAllJobsToComplete()

    expect(workers.job1.handler).toHaveBeenCalledTimes(3)
    expect(workers.job2.handler).toHaveBeenCalledTimes(1)
    expect(workers.job3.handler).toHaveBeenCalledTimes(2)
  })

  test('Will resume active jobs on start', async () => {
    const midJobEventEmitter = new EventEmitter()
    const midJobEvent = 'middle'

    workers['job1'].handler.mockImplementation(async (job: PgBoss.Job<MockJobData>) => {
      if (!job.data.fail) {
        return
      }

      await myJobQueue.updateJob(job.id, { fail: false, id: job.data.id })
      midJobEventEmitter.emit(midJobEvent)
      await TestUtils.delay(40000)
    })

    await myJobQueue.addJob({ name: 'job1', data: { fail: true, id: 1 } })
    await myJobQueue.addJob({ name: 'job1', data: { fail: false, id: 2 } })

    await firstValueFrom(fromEvent(midJobEventEmitter, midJobEvent))
    await myJobQueue.stop()

    myJobQueue = new JobQueue(
      process.env.DATABASE_URL as string,
      new LoggerProvider().getDiagnosticsLogger()
    )
    await myJobQueue.init(workers)
    await myJobQueue._waitForAllJobsToComplete()
    expect(workers.job1.handler).toHaveBeenCalledTimes(3)

    const firstCall = workers.job1.handler.mock.calls[0][0]
    expect(firstCall.data.id).toEqual(1)
    const secondCall = workers.job1.handler.mock.calls[1][0]
    expect(secondCall.data.id).toEqual(1)
    const thirdCall = workers.job1.handler.mock.calls[2][0]
    expect(thirdCall.data.id).toEqual(2)
  })

  test('Can get jobs of different states and types', async () => {
    const jobs = ['job1', 'job2', 'job1', 'job3', 'job3', 'job1'].map((name) => ({
      name,
      data: {},
    }))
    await myJobQueue.addJobs(jobs)

    const createdJobs = await myJobQueue.getJobs('created')
    expect(createdJobs['job1']).toHaveLength(3)
    expect(createdJobs['job2']).toHaveLength(1)
    expect(createdJobs['job3']).toHaveLength(2)

    const createJob1Jobs = await myJobQueue.getJobs('created', ['job1'])
    expect(createJob1Jobs['job1']).toHaveLength(3)
    expect(createJob1Jobs['job2']).toBe(undefined)
  })
})
