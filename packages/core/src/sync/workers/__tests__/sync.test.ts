import { jest } from '@jest/globals'
import { JobQueue } from '../../../state-management/job-queue.js'
import pgSetup from '@databases/pg-test/jest/globalSetup'
import pgTeardown from '@databases/pg-test/jest/globalTeardown'
import { of, type Observable, map } from 'rxjs'
import { type BlockProofs, type BlocksProofsLoaderParams } from '@ceramicnetwork/anchor-listener'
import { TestUtils, LoggerProvider } from '@ceramicnetwork/common'
import type { Block, Provider } from '@ethersproject/providers'
import { REBUILD_ANCHOR_JOB_NAME, JobData } from '../../interfaces.js'

const ERROR_BLOCK = 100

const createBlockProof = (chainId: string, blockNumber: number) => {
  return {
    block: { number: blockNumber } as Block,
    proofs: [
      {
        chainId,
        txHash: TestUtils.randomCID(),
        root: TestUtils.randomCID(),
      },
    ],
  }
}

const range = (start: number, end: number) => [...Array(end - start).keys()].map((i) => i + start)

const createBlocksProofsLoader = (params: BlocksProofsLoaderParams): Observable<BlockProofs> => {
  const { chainId, fromBlock, toBlock } = params

  const blockProofs: BlockProofs[] = range(fromBlock, toBlock).map((blockNumber) =>
    createBlockProof(chainId, blockNumber)
  )

  return of(...blockProofs).pipe(
    map((blockProofs) => {
      if (blockProofs.block.number === ERROR_BLOCK) {
        throw Error('test error')
      }

      return blockProofs
    })
  )
}

jest.unstable_mockModule('@ceramicnetwork/anchor-listener', () => {
  return {
    createBlocksProofsLoader,
  }
})

const mockRebuildAnchorWorker = {
  handler: jest.fn(() => {
    return Promise.resolve()
  }),
}

describe('Sync Worker', () => {
  jest.setTimeout(150000) // 2.5mins timeout for initial docker fetch+init
  let jobQueue: JobQueue<JobData>
  let SyncPackage: any
  let syncWorkerSpy

  beforeAll(async () => {
    await pgSetup()
    jobQueue = new JobQueue(
      process.env.DATABASE_URL as string,
      new LoggerProvider().getDiagnosticsLogger()
    )

    SyncPackage = await import('../sync.js')
    const syncWorker = new SyncPackage.SyncWorker({} as Provider, jobQueue)
    syncWorkerSpy = jest.spyOn(syncWorker, 'handler')

    await jobQueue.init({
      [SyncPackage.SYNC_JOB_NAME]: syncWorker,
      [REBUILD_ANCHOR_JOB_NAME]: mockRebuildAnchorWorker,
    })
  })

  beforeEach(async () => {
    if (jobQueue) await jobQueue._clearAllJobs()
    mockRebuildAnchorWorker.handler.mockClear()
    syncWorkerSpy.mockClear()
  })

  afterAll(async () => {
    if (jobQueue) await jobQueue.stop()
    await pgTeardown()
  })

  test('Can sync by creating rebuild anchor jobs', async () => {
    const job = SyncPackage.createSyncJob({
      fromBlock: 101,
      toBlock: 108,
      models: ['kjzl6hvfrbw6c8c48hg1u62lhnc95g4ntslc861i5feo7tev0fyh9mvsbjtw374'],
    })

    await jobQueue.addJob(job)

    await jobQueue._waitForAllJobsToComplete()

    expect(mockRebuildAnchorWorker.handler).toHaveBeenCalledTimes(7)
  })

  test('Will retry if something goes wrong', async () => {
    const jobData = {
      fromBlock: 98,
      toBlock: 103,
      models: ['kjzl6hvfrbw6c8c48hg1u62lhnc95g4ntslc861i5feo7tev0fyh9mvsbjtw374'],
    }
    const job = SyncPackage.createSyncJob(jobData, {
      retryLimit: 3,
    })

    await jobQueue.addJob(job)

    await jobQueue._waitForAllJobsToComplete()

    expect(mockRebuildAnchorWorker.handler).toHaveBeenCalledTimes(2)
    expect(syncWorkerSpy).toHaveBeenCalledTimes(4)

    // first call should be the original job data
    const originalJobData = syncWorkerSpy.mock.calls[0][0].data
    expect(originalJobData).toEqual(jobData)

    // next call should be the updated job data
    const retriedJobData = syncWorkerSpy.mock.calls[1][0].data
    expect(retriedJobData).toEqual(Object.assign({}, jobData, { fromBlock: ERROR_BLOCK }))
  })
})
