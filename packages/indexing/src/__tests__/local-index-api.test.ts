import { jest } from '@jest/globals'
import type { DatabaseIndexApi } from '../database-index-api.js'
import type {
  DiagnosticsLogger,
  Page,
  RunningStateLike,
  StreamReader,
  StreamReaderWriter,
  StreamState,
  StreamStateLoader,
} from '@ceramicnetwork/common'
import { randomString } from '@stablelib/random'
import { LocalIndexApi } from '../local-index-api.js'
import { Networks, StreamUtils } from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'
import { Model } from '@ceramicnetwork/stream-model'
import { BehaviorSubject, Observable } from 'rxjs'

class StateLink extends Observable<StreamState> implements RunningStateLike {
  private readonly state$: BehaviorSubject<StreamState>

  /**
   * @param initial - initial state
   * @param update$ - external feed of StreamState updates to this stream
   */
  constructor(private readonly initial: StreamState) {
    super()
    this.state$ = new BehaviorSubject(initial)
  }

  next(state: StreamState): void {
    this.state$.next(state)
  }

  get state(): StreamState {
    return this.state$.value
  }

  get value(): StreamState {
    return this.state$.value
  }

  get id(): StreamID {
    return StreamUtils.streamIdFromState(this.state)
  }
}

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
    const fauxReader = {} as unknown as StreamReader
    const fauxStreamStateLoader = { loadStreamState: streamStateFn } as unknown as StreamStateLoader
    const warnFn = jest.fn()
    const fauxLogger = { warn: warnFn } as unknown as DiagnosticsLogger

    const indexApi = new LocalIndexApi(
      undefined,
      fauxReader,
      fauxStreamStateLoader,
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
    const fauxReader = {} as unknown as StreamReader
    const fauxStreamStateLoader = { loadStreamState: streamStateFn } as unknown as StreamStateLoader
    const fauxLogger = {
      warn: jest.fn((content: string | Record<string, unknown> | Error) => {
        console.log(content)
      }),
    } as unknown as DiagnosticsLogger
    const indexApi = new LocalIndexApi(
      undefined,
      fauxReader,
      fauxStreamStateLoader,
      fauxLogger,
      Networks.INMEMORY
    )
    ;(indexApi as any).databaseIndexApi = fauxBackend
    const response = await indexApi.query(query)
    // Call databaseIndexApi::page function
    expect(pageFn).toBeCalledTimes(1)
    expect(fauxLogger.warn).toBeCalledTimes(2)
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
    const fauxReader = {} as unknown as StreamReader
    const fauxStreamStateLoader = {} as unknown as StreamStateLoader
    const warnFn = jest.fn()
    const fauxLogger = { warn: warnFn } as unknown as DiagnosticsLogger
    const indexApi = new LocalIndexApi(
      undefined,
      fauxReader,
      fauxStreamStateLoader,
      fauxLogger,
      Networks.INMEMORY
    )

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
    expect(warnFn).toBeCalledTimes(2)
  })
})

test('count', async () => {
  const fauxReader = {} as unknown as StreamReader
  const fauxStreamStateLoader = {} as unknown as StreamStateLoader
  const warnFn = jest.fn()
  const fauxLogger = { warn: warnFn } as unknown as DiagnosticsLogger
  const indexApi = new LocalIndexApi(
    undefined,
    fauxReader,
    fauxStreamStateLoader,
    fauxLogger,
    Networks.INMEMORY
  )
  const expected = Math.random()
  const countFn = jest.fn(() => expected)
  const fauxBackend = { count: countFn } as unknown as DatabaseIndexApi
  ;(indexApi as any).databaseIndexApi = fauxBackend
  const query = { model: 'modelId' }
  const actual = await indexApi.count(query)
  expect(actual).toEqual(expected)
  expect(countFn).toBeCalledWith(query)
})

describe('index models with interfaces', () => {
  const MODEL_ID_1 = 'kjzl6hvfrbw6c5ykyyjq0v80od0nhdimprq7j2pccg1l100ktiiqcc01ddka001'
  const MODEL_ID_2 = 'kjzl6hvfrbw6c5ykyyjq0v80od0nhdimprq7j2pccg1l100ktiiqcc01ddka002'
  const MODEL_ID_3 = 'kjzl6hvfrbw6c5ykyyjq0v80od0nhdimprq7j2pccg1l100ktiiqcc01ddka003'
  const MODEL_ID_4 = 'kjzl6hvfrbw6c5ykyyjq0v80od0nhdimprq7j2pccg1l100ktiiqcc01ddka004'
  const MODEL_ID_5 = 'kjzl6hvfrbw6c5ykyyjq0v80od0nhdimprq7j2pccg1l100ktiiqcc01ddka005'

  test('throws when trying to index an interface model', async () => {
    const loadStream = jest.fn(() => ({
      state: { content: { version: '2.0', accountRelation: { type: 'none' }, interface: true } },
    }))
    const fauxReader = { loadStream } as unknown as StreamReader
    const fauxStreamStateLoader = {} as unknown as StreamStateLoader
    const noop = jest.fn()
    const logger = { warn: noop, imp: noop } as unknown as DiagnosticsLogger
    const indexApi = new LocalIndexApi(
      undefined,
      fauxReader,
      fauxStreamStateLoader,
      logger,
      Networks.INMEMORY
    )
    ;(indexApi as any).databaseIndexApi = { getModelsNoLongerIndexed: () => [] }

    await expect(
      indexApi.indexModels([{ streamID: StreamID.fromString(MODEL_ID_1) }])
    ).rejects.toThrow(
      'Model kjzl6hvfrbw6c5ykyyjq0v80od0nhdimprq7j2pccg1l100ktiiqcc01ddka001 is an interface and cannot be indexed'
    )
  })

  test('recursively loads the implemented interfaces', async () => {
    const streamImplements = {
      [MODEL_ID_1]: [],
      [MODEL_ID_2]: [MODEL_ID_1],
      [MODEL_ID_3]: [MODEL_ID_2],
      [MODEL_ID_4]: [MODEL_ID_1, MODEL_ID_3],
      [MODEL_ID_5]: [MODEL_ID_1],
    }
    const loadStream = jest.fn((streamId: StreamID) => {
      const id = streamId.toString()
      const found = streamImplements[id]
      if (found == null) {
        throw new Error(`Stream not found: ${id}`)
      }

      const runningState = new StateLink({
        content: {
          version: '2.0',
          accountRelation: { type: 'list' },
          interface: [MODEL_ID_1, MODEL_ID_2, MODEL_ID_3].includes(id),
          implements: found,
        },
      } as unknown as StreamState)
      return new Model(
        runningState as unknown as RunningStateLike,
        {} as unknown as StreamReaderWriter
      )
    })
    const fauxReader = { loadStream } as unknown as StreamReader
    const fauxStreamStateLoader = {} as unknown as StreamStateLoader
    const noop = jest.fn()
    const logger = { warn: noop, imp: noop } as unknown as DiagnosticsLogger
    const indexApi = new LocalIndexApi(
      undefined,
      fauxReader,
      fauxStreamStateLoader,
      logger,
      Networks.INMEMORY
    )
    const indexModels = jest.fn()
    ;(indexApi as any).databaseIndexApi = { getModelsNoLongerIndexed: () => [], indexModels }

    const model4streamID = StreamID.fromString(MODEL_ID_4)
    const model5streamID = StreamID.fromString(MODEL_ID_5)
    await indexApi.indexModels([{ streamID: model4streamID }, { streamID: model5streamID }])

    expect(indexModels).toHaveBeenCalledWith([
      {
        model: model4streamID,
        relationFields: expect.any(Set),
        implements: [
          'kjzl6hvfrbw6c5ykyyjq0v80od0nhdimprq7j2pccg1l100ktiiqcc01ddka001',
          'kjzl6hvfrbw6c5ykyyjq0v80od0nhdimprq7j2pccg1l100ktiiqcc01ddka003',
          'kjzl6hvfrbw6c5ykyyjq0v80od0nhdimprq7j2pccg1l100ktiiqcc01ddka002',
        ],
        indices: undefined,
      },
      {
        model: model5streamID,
        relationFields: expect.any(Set),
        implements: ['kjzl6hvfrbw6c5ykyyjq0v80od0nhdimprq7j2pccg1l100ktiiqcc01ddka001'],
        indices: undefined,
      },
    ])
  })
})

test('automatically index relations', async () => {
  const streamID = StreamID.fromString(
    'kjzl6hvfrbw6c5ykyyjq0v80od0nhdimprq7j2pccg1l100ktiiqcc01ddka001'
  )
  const loadStream = jest.fn(() => ({
    state: {
      content: {
        version: '2.0',
        // content relation fields should be indexed
        relations: {
          one: { type: 'account' },
          two: { type: 'account' },
        },
        // SET account relation fields should be indexed
        accountRelation: { type: 'set', fields: ['two', 'three'] },
      },
    },
  }))
  const fauxReader = { loadStream } as unknown as StreamReader
  const fauxStreamStateLoader = {} as unknown as StreamStateLoader
  const noop = jest.fn()
  const logger = { warn: noop, imp: noop } as unknown as DiagnosticsLogger
  const indexApi = new LocalIndexApi(
    undefined,
    fauxReader,
    fauxStreamStateLoader,
    logger,
    Networks.INMEMORY
  )
  const indexModels = jest.fn()
  ;(indexApi as any).databaseIndexApi = { getModelsNoLongerIndexed: () => [], indexModels }

  const indices = [{ fields: [{ path: ['three'] }] }, { fields: [{ path: ['four'] }] }]
  await indexApi.indexModels([{ streamID, indices }])

  expect(indexModels).toHaveBeenCalledWith([
    { model: streamID, indices, relationFields: new Set(['one', 'two', 'three']) },
  ])
})
