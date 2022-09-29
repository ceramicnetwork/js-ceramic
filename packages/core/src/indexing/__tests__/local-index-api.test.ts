import { jest } from '@jest/globals'
import type { DatabaseIndexApi } from '../database-index-api.js'
import type { Repository } from '../../state-management/repository.js'
import type { Context, DiagnosticsLogger, Page } from '@ceramicnetwork/common'
import { randomString } from '@stablelib/random'
import { LocalIndexApi } from '../local-index-api.js'
import { Networks } from '@ceramicnetwork/common'
import { IndexingConfig } from '../build-indexing.js'
import { HandlersMap } from '../../handlers-map.js'

const randomInt = (max: number) => Math.floor(Math.random() * max)

describe('with database backend', () => {
  test('return page from the database', async () => {
    const query = { model: 'foo', first: randomInt(100) }
    const backendPage: Page<string> = {
      edges: Array.from({ length: query.first }).map(() => {
        return {
          cursor: randomString(32),
          node: randomString(32),
        }
      }),
      pageInfo: {
        hasPreviousPage: true,
        hasNextPage: true,
        startCursor: 'startCursor',
        endCursor: 'endCursor',
      },
    }
    const pageFn = jest.fn(async () => backendPage)
    const streamStateFn = jest.fn(async (streamId: any) => {
      return {
        type: 1,
        content: streamId,
      }
    })
    const fauxBackend = { page: pageFn } as unknown as DatabaseIndexApi
    const fauxRepository = { streamState: streamStateFn } as unknown as Repository
    const fauxLogger = {} as DiagnosticsLogger

    const indexApi = new LocalIndexApi(
      undefined as IndexingConfig,
      fauxRepository,
      fauxLogger,
      Networks.INMEMORY
    )
    ;(indexApi as any).databaseIndexApi = fauxBackend
    const response = await indexApi.query(query)
    // Call databaseIndexApi::page function
    expect(pageFn).toBeCalledTimes(1)
    expect(pageFn).toBeCalledWith(query)
    // We pass pageInfo through
    expect(response.pageInfo).toEqual(backendPage.pageInfo)
    // Transform from StreamId to StreamState via Repository::streamState
    expect(streamStateFn).toBeCalledTimes(query.first)
    backendPage.edges.forEach((edge) => {
      expect(streamStateFn).toBeCalledWith(edge.node)
    })
    expect(response.edges.map((e) => e.node.content)).toEqual(backendPage.edges.map((e) => e.node))
  })

  test('return empty page from the database if cannot retrieve stream state', async () => {
    const query = { model: 'foo', first: 1 }
    const backendPage: Page<string> = {
      edges: [
        {
          cursor: randomString(32),
          node: null,
        },
      ],
      pageInfo: {
        hasPreviousPage: false,
        hasNextPage: false,
        startCursor: 'startCursor',
        endCursor: 'endCursor',
      },
    }
    const pageFn = jest.fn(async () => backendPage)
    const streamStateFn = jest.fn(async (streamId: any) => {
      return undefined
    })
    const fauxBackend = { page: pageFn } as unknown as DatabaseIndexApi
    const fauxRepository = { streamState: streamStateFn } as unknown as Repository
    const fauxLogger = {
      warn: jest.fn((content: string | Record<string, unknown> | Error) => {
        console.log(content)
      }),
    } as unknown as DiagnosticsLogger
    const indexApi = new LocalIndexApi(
      undefined as IndexingConfig,
      fauxRepository,
      fauxLogger,
      Networks.INMEMORY
    )
    ;(indexApi as any).databaseIndexApi = fauxBackend
    const response = await indexApi.query(query)
    // Call databaseIndexApi::page function
    expect(pageFn).toBeCalledTimes(1)
    expect(fauxLogger.warn).toBeCalledTimes(1)
    expect(pageFn).toBeCalledWith(query)
    // We pass pageInfo through
    expect(response.pageInfo).toEqual(backendPage.pageInfo)
    // Transform from StreamId to StreamState via Repository::streamState
    expect(streamStateFn).toBeCalledTimes(query.first)
    backendPage.edges.forEach((edge) => {
      expect(streamStateFn).toBeCalledWith(edge.node)
    })
    expect(response.edges.length).toEqual(1)
    expect(response.edges[0].node).toEqual(null)
  })
})

describe('without database backend', () => {
  test('return an empty response', async () => {
    const fauxRepository = {} as unknown as Repository
    const warnFn = jest.fn()
    const fauxLogger = { warn: warnFn } as unknown as DiagnosticsLogger
    const indexApi = new LocalIndexApi(undefined, fauxRepository, fauxLogger, Networks.INMEMORY)

    const response = await indexApi.query({ model: 'foo', first: 5 })
    // Return an empty response
    expect(response).toEqual({
      edges: [],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
      },
    })
    // Log a warning
    expect(warnFn).toBeCalledTimes(1)
  })
})

test('count', async () => {
  const fauxRepository = {} as unknown as Repository
  const warnFn = jest.fn()
  const fauxLogger = { warn: warnFn } as unknown as DiagnosticsLogger
  const indexApi = new LocalIndexApi(undefined, fauxRepository, fauxLogger, Networks.INMEMORY)
  const expected = Math.random()
  const countFn = jest.fn(() => expected)
  const fauxBackend = { count: countFn } as unknown as DatabaseIndexApi
  ;(indexApi as any).databaseIndexApi = fauxBackend
  const query = { model: 'modelId' }
  const actual = await indexApi.count(query)
  expect(actual).toEqual(expected)
  expect(countFn).toBeCalledWith(query)
})
