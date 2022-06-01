import { jest } from '@jest/globals'
import type { DatabaseIndexApi } from '../database-index-api.js'
import type { Repository } from '../../state-management/repository.js'
import type { DiagnosticsLogger, Page, StreamState } from '@ceramicnetwork/common'
import { IndexApi } from '../index-api.js'
import { CommitType, SyncOptions, TestUtils } from '@ceramicnetwork/common'
import { randomString } from '@stablelib/random'

const randomInt = (max: number) => Math.floor(Math.random() * max)

describe('with database backend', () => {
  test('return page from the database', async () => {
    const query = { model: 'foo', first: randomInt(100) }
    const backendPage: Page<string> = {
      entries: Array.from({ length: query.first }).map(() => randomString(3)),
      pageInfo: {
        hasPreviousPage: true,
        hasNextPage: true,
        startCursor: 'startCursor',
        endCursor: 'endCursor',
      },
    }
    const pageFn = jest.fn(async () => backendPage)
    const loadFn = jest.fn(async (streamId: any) => {
      const fauxStreamState = {
        type: 1,
        content: streamId,
        log: [{ cid: TestUtils.randomCID(), type: CommitType.GENESIS }],
      } as unknown as StreamState
      return TestUtils.runningState(fauxStreamState)
    })
    const fauxBackend = { page: pageFn } as unknown as DatabaseIndexApi
    const fauxRepository = { load: loadFn } as unknown as Repository
    const fauxLogger = {} as DiagnosticsLogger
    const indexApi = new IndexApi(fauxBackend, fauxRepository, fauxLogger)
    const response = await indexApi.queryIndex(query)
    // Call databaseIndexApi::page function
    expect(pageFn).toBeCalledTimes(1)
    expect(pageFn).toBeCalledWith(query)
    // We pass pageInfo through
    expect(response.pageInfo).toEqual(backendPage.pageInfo)
    // Transform from StreamId to StreamState via repository.load
    expect(loadFn).toBeCalledTimes(query.first)
    backendPage.entries.forEach((fauxStreamId) => {
      expect(loadFn).toBeCalledWith(fauxStreamId, { sync: SyncOptions.NEVER_SYNC })
    })
    expect(response.entries.map((e) => e.content)).toEqual(backendPage.entries)
  })
})

describe('without database backend', () => {
  test('return an empty response', async () => {
    const fauxRepository = {} as unknown as Repository
    const warnFn = jest.fn()
    const fauxLogger = { warn: warnFn } as unknown as DiagnosticsLogger
    const indexApi = new IndexApi(undefined, fauxRepository, fauxLogger)
    const response = await indexApi.queryIndex({ model: 'foo', first: 5 })
    // Return an empty response
    expect(response).toEqual({
      entries: [],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
      },
    })
    // Log a warning
    expect(warnFn).toBeCalledTimes(1)
  })
})
