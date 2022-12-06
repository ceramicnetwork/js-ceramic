import { jest } from '@jest/globals'
import {
  AnchorStatus,
  CommitType,
  IpfsApi,
  StreamState,
  StreamUtils,
  SyncOptions,
  TestUtils,
} from '@ceramicnetwork/common'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { Ceramic } from '../../ceramic.js'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { Repository } from '../repository.js'
import { createCeramic } from '../../__tests__/create-ceramic.js'
import { TileDocumentHandler } from '@ceramicnetwork/stream-tile-handler'
import { StreamID } from '@ceramicnetwork/streamid'
import { RunningState } from '../running-state.js'
import { LevelDbStore } from '../../store/level-db-store.js'
import tmp from 'tmp-promise'
import { InMemoryAnchorService } from '../../anchor/memory/in-memory-anchor-service'

const STRING_MAP_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'StringMap',
  type: 'object',
  additionalProperties: {
    type: 'string',
  },
}

let ipfs: IpfsApi
let ceramic: Ceramic
let repository: Repository

beforeAll(async () => {
  ipfs = await createIPFS()
})

afterAll(async () => {
  await ipfs.stop()
})

beforeEach(async () => {
  ceramic = await createCeramic(ipfs)
  repository = ceramic.repository
})

afterEach(async () => {
  jest.resetAllMocks()
  await ceramic.close()
})

describe('#load', () => {
  test('from memory', async () => {
    const stream1 = await TileDocument.create(ceramic, { foo: 'bar' })
    const fromMemorySpy = jest.spyOn(repository as any, 'fromMemory')
    const fromStateStoreSpy = jest.spyOn(repository as any, 'fromStreamStateStore')
    const fromNetwork = jest.spyOn(repository as any, 'fromNetwork')
    const stream2 = await repository.load(stream1.id, { syncTimeoutSeconds: 0 })
    expect(StreamUtils.serializeState(stream1.state)).toEqual(
      StreamUtils.serializeState(stream2.state)
    )
    expect(fromMemorySpy).toBeCalledTimes(1)
    expect(fromStateStoreSpy).toBeCalledTimes(0)
    expect(fromNetwork).toBeCalledTimes(0)
  })

  test('from state store', async () => {
    const fromMemorySpy = jest.spyOn(repository as any, 'fromMemory')
    const fromStateStoreSpy = jest.spyOn(repository as any, 'fromStreamStateStore')
    const fromNetworkSpy = jest.spyOn(repository as any, 'fromNetwork')
    const syncSpy = jest.spyOn(repository.stateManager, 'sync')

    const stream1 = await TileDocument.create(ceramic, { foo: 'bar' }, null, { anchor: false })
    await ceramic.pin.add(stream1.id)

    fromMemorySpy.mockClear()
    fromStateStoreSpy.mockClear()
    fromNetworkSpy.mockClear()
    syncSpy.mockClear()
    fromMemorySpy.mockReturnValueOnce(null)
    fromMemorySpy.mockReturnValueOnce(null)

    const stream2 = await repository.load(stream1.id, { syncTimeoutSeconds: 0 })
    expect(StreamUtils.serializeState(stream2.state)).toEqual(
      StreamUtils.serializeState(stream1.state)
    )
    expect(fromMemorySpy).toBeCalledTimes(1)
    expect(fromStateStoreSpy).toBeCalledTimes(1)
    expect(fromNetworkSpy).toBeCalledTimes(0)
    // Do not need to sync a stream after it has been pinned because pinning also syncs
    expect(syncSpy).toBeCalledTimes(0)

    const stream3 = await repository.load(stream1.id, { syncTimeoutSeconds: 0 })
    expect(StreamUtils.serializeState(stream3.state)).toEqual(
      StreamUtils.serializeState(stream1.state)
    )
    expect(fromMemorySpy).toBeCalledTimes(2)
    expect(fromStateStoreSpy).toBeCalledTimes(2)
    expect(fromNetworkSpy).toBeCalledTimes(0)
    expect(syncSpy).toBeCalledTimes(0)
  })

  test('Sync pinned stream first time loaded from state store', async () => {
    const content = { foo: 'bar' }
    const genesisCommit = await TileDocument.makeGenesis(ceramic, { foo: 'bar' })
    const genesisCid = await ceramic.dispatcher.storeCommit(genesisCommit)
    const streamId = new StreamID('tile', genesisCid)
    const streamState = {
      type: TileDocument.STREAM_TYPE_ID,
      log: [
        {
          type: CommitType.GENESIS,
          cid: genesisCid,
        },
      ],
      content,
    } as unknown as StreamState
    const runningState = new RunningState(streamState, true)

    const fromMemorySpy = jest.spyOn(repository as any, 'fromMemory')
    const fromStateStoreSpy = jest.spyOn(repository as any, 'fromStreamStateStore')
    const fromNetworkSpy = jest.spyOn(repository as any, 'fromNetwork')
    const syncSpy = jest.spyOn(repository.stateManager, 'sync')

    fromMemorySpy.mockReturnValueOnce(null)
    fromMemorySpy.mockReturnValueOnce(null)
    fromStateStoreSpy.mockReturnValueOnce(runningState)
    fromStateStoreSpy.mockReturnValueOnce(runningState)

    const stream1 = await repository.load(streamId, { syncTimeoutSeconds: 0 })
    expect(stream1.state.content).toEqual(content)
    expect(fromMemorySpy).toBeCalledTimes(1)
    expect(fromStateStoreSpy).toBeCalledTimes(1)
    expect(fromNetworkSpy).toBeCalledTimes(0)
    // Needs to sync with the network the first time a pinned stream is loaded
    // (in case there were updates while the node was offline)
    expect(syncSpy).toBeCalledTimes(1)

    const stream2 = await repository.load(streamId, { syncTimeoutSeconds: 0 })
    expect(StreamUtils.serializeState(stream2.state)).toEqual(
      StreamUtils.serializeState(stream1.state)
    )
    expect(fromMemorySpy).toBeCalledTimes(2)
    expect(fromStateStoreSpy).toBeCalledTimes(2)
    expect(fromNetworkSpy).toBeCalledTimes(0)

    // Second time loading from state store it does not need to be synced again
    expect(syncSpy).toBeCalledTimes(1)
  })

  describe('sync: SYNC_ALWAYS', () => {
    describe('pinned', () => {
      test('revalidate current state, rewrite', async () => {
        const stream1 = await TileDocument.create(ceramic, { a: 1 }, null, {
          anchor: false,
          pin: true,
        })
        await stream1.update({ a: 2 }, null, { anchor: false })

        const fromMemory = jest.spyOn(repository as any, 'fromMemory')
        fromMemory.mockReturnValueOnce(undefined)
        const fromStateStore = jest.spyOn(repository as any, 'fromStreamStateStore')
        const fromNetwork = jest.spyOn(repository as any, 'fromNetwork')
        const saveFromStreamStateHolder = jest.spyOn(
          repository.pinStore.stateStore,
          'saveFromStreamStateHolder'
        )

        const stream2 = await repository.load(stream1.id, {
          sync: SyncOptions.SYNC_ALWAYS,
        })
        expect(StreamUtils.serializeState(stream1.state)).toEqual(
          StreamUtils.serializeState(stream2.state)
        )
        expect(fromMemory).toBeCalledTimes(1)
        expect(fromStateStore).toBeCalledTimes(1)
        expect(fromNetwork).toBeCalledTimes(1)
        expect(saveFromStreamStateHolder).toBeCalledTimes(1)
      })
    })

    describe('unpinned', () => {
      test('revalidate current state, do not rewrite', async () => {
        const stream1 = await TileDocument.create(ceramic, { a: 1 }, null, {
          anchor: false,
          pin: false,
        })
        await stream1.update({ a: 2 }, null, { anchor: false, pin: false })

        const fromMemory = jest.spyOn(repository as any, 'fromMemory')
        const fromStateStore = jest.spyOn(repository as any, 'fromStreamStateStore')
        const fromNetwork = jest.spyOn(repository as any, 'fromNetwork')
        const saveFromStreamStateHolder = jest.spyOn(
          repository.pinStore.stateStore,
          'saveFromStreamStateHolder'
        )

        const stream2 = await repository.load(stream1.id, {
          sync: SyncOptions.SYNC_ALWAYS,
        })
        expect(StreamUtils.serializeState(stream1.state)).toEqual(
          StreamUtils.serializeState(stream2.state)
        )
        expect(fromMemory).toBeCalledTimes(1)
        expect(fromStateStore).toBeCalledTimes(0)
        expect(fromNetwork).toBeCalledTimes(1)
        expect(saveFromStreamStateHolder).toBeCalledTimes(0)
      })
    })
  })
})

describe('validation', () => {
  test('when loading genesis ', async () => {
    // Create schema
    const schema = await TileDocument.create(ceramic, STRING_MAP_SCHEMA)
    await TestUtils.anchorUpdate(ceramic, schema)
    // Create invalid stream
    const ipfs2 = await createIPFS()
    const permissiveCeramic = await createCeramic(ipfs2)
    const validateSchemaSpy = jest.spyOn(
      (permissiveCeramic._streamHandlers.get('tile') as TileDocumentHandler)._schemaValidator,
      'validateSchema'
    )
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    validateSchemaSpy.mockImplementation(() => {})
    const invalidDoc = await TileDocument.create(
      permissiveCeramic,
      { stuff: 1 },
      { schema: schema.commitId }
    )
    // Load it: Expect failure
    await expect(repository.load(invalidDoc.id, { syncTimeoutSeconds: 0 })).rejects.toThrow(
      'Validation Error: data/stuff must be string'
    )
    await permissiveCeramic.close()
    await ipfs2.stop()
  }, 20000)
})

test('subscribe makes state endured', async () => {
  const durableStart = ceramic.repository.inmemory.durable.size
  const volatileStart = ceramic.repository.inmemory.volatile.size
  const stream1 = await TileDocument.create(ceramic, { foo: 'bar' })
  expect(ceramic.repository.inmemory.durable.size).toEqual(durableStart)
  expect(ceramic.repository.inmemory.volatile.size).toEqual(volatileStart + 1)
  stream1.subscribe()
  await TestUtils.delay(200) // Wait for rxjs plumbing
  expect(ceramic.repository.inmemory.durable.size).toEqual(durableStart + 1)
  expect(ceramic.repository.inmemory.volatile.size).toEqual(volatileStart)
})

describe('resumeRunningStatesFromAnchorRequestStore(...) method', () => {
  jest.setTimeout(10000)

  let ceramicWithAutoAnchor: Ceramic
  let stateStoreDirectoryName: string

  beforeEach(async () => {
    stateStoreDirectoryName = await tmp.tmpName()
    ceramicWithAutoAnchor = await createCeramic(ipfs, {
      anchorOnRequest: true,
      stateStoreDirectory: stateStoreDirectoryName,
    })
  })

  afterEach(async () => {
    jest.resetAllMocks()
    await ceramicWithAutoAnchor.close()
  })

  test('Anchors streams from anchor request store if anchorOnRequest === true', async () => {
    const numberOfStreams = 3

    const anchorService = ceramicWithAutoAnchor.repository.stateManager
      .anchorService as InMemoryAnchorService
    const mockedProcess = jest.fn()
    // @ts-ignore Mock the implementation of process to prevent setting the status to ANCHORED or FAILED
    anchorService._process = mockedProcess
    mockedProcess.mockImplementation((...args) => {
      return Promise.resolve()
    })

    // create a few streams using the ceramic instance with manual anchoring to make sure that they stay in
    // the anchor request store and in the stream state store (so that the ceramic instance with anchorOnRequest === true
    // can load them
    const streamIds = await Promise.all(
      [...Array(numberOfStreams).keys()].map((number) => {
        return TileDocument.create(ceramicWithAutoAnchor, { x: number }, null, {
          anchor: true,
        }).then((tileDocument) => {
          return tileDocument.id
        })
      })
    )

    expect(mockedProcess).toHaveBeenCalledTimes(numberOfStreams)

    const loaded = (await ceramicWithAutoAnchor.repository.anchorRequestStore.list()).map(
      (result) => result.key.toString()
    )
    // LevelDB Store stores keys ordered lexicographically
    expect(streamIds.map((streamId) => streamId.toString()).sort()).toEqual(loaded)

    const runnningStates$ = await Promise.all(
      streamIds.map((streamId) => {
        return ceramicWithAutoAnchor.repository.load(streamId, {
          sync: SyncOptions.NEVER_SYNC,
        })
      })
    )

    runnningStates$.forEach((runningState$) => {
      expect(runningState$.state.anchorStatus).toEqual(AnchorStatus.PENDING)
    })

    // Create a new ceramic (with the same state directory) to check that resuming works,
    // even if everything is loaded from scratch
    const newCeramic = await createCeramic(ipfs, {
      anchorOnRequest: true,
      stateStoreDirectory: stateStoreDirectoryName,
    })

    // Use the ceramic instance with anchorOnRequest === true to resume anchors
    await newCeramic.repository.resumeRunningStatesFromAnchorRequestStore()

    // Wait for anchor requests to be processed
    await TestUtils.delay(6000)

    const newRunnningStates$ = await Promise.all(
      streamIds.map((streamId) => {
        return newCeramic.repository.load(streamId, {
          sync: SyncOptions.NEVER_SYNC,
        })
      })
    )

    newRunnningStates$.forEach((runningState$) => {
      expect(runningState$.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    })
  })
})
