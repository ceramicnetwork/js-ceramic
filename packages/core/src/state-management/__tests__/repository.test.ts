import { jest } from '@jest/globals'
import {
  AnchorStatus,
  CommitType,
  IpfsApi,
  SignatureStatus,
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
import { CommitID, StreamID } from '@ceramicnetwork/streamid'
import { RunningState } from '../running-state.js'
import { streamFromState } from '../stream-from-state.js'
import cloneDeep from 'lodash.clonedeep'
import { CID } from 'multiformats/cid'
import { StateLink } from '../state-link.js'
import { OperationType } from '../operation-type.js'

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
    const fromMemorySpy = jest.spyOn(repository._internals as any, '_fromMemory')
    const fromStateStoreSpy = jest.spyOn(repository._internals as any, 'fromStreamStateStore')
    const fromNetworkSpy = jest.spyOn(repository._internals as any, '_genesisFromNetwork')
    const stream2 = await repository.load(stream1.id, { syncTimeoutSeconds: 0 })
    expect(StreamUtils.serializeState(stream1.state)).toEqual(
      StreamUtils.serializeState(stream2.state)
    )
    expect(fromMemorySpy).toBeCalledTimes(1)
    expect(fromStateStoreSpy).toBeCalledTimes(0)
    expect(fromNetworkSpy).toBeCalledTimes(0)
  })

  test('from state store', async () => {
    const fromMemorySpy = jest.spyOn(repository._internals as any, '_fromMemory')
    const fromStateStoreSpy = jest.spyOn(repository._internals as any, 'fromStreamStateStore')
    const fromNetworkSpy = jest.spyOn(repository._internals as any, '_genesisFromNetwork')
    const syncSpy = jest.spyOn(repository._internals, '_sync')

    const stream1 = await TileDocument.create(ceramic, { foo: 'bar' }, null, { anchor: false })
    await ceramic.admin.pin.add(stream1.id)

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
      metadata: {},
    } as unknown as StreamState
    const runningState = new RunningState(streamState, true)

    const fromMemorySpy = jest.spyOn(repository._internals as any, '_fromMemory')
    const fromStateStoreSpy = jest.spyOn(repository._internals as any, 'fromStreamStateStore')
    const fromNetworkSpy = jest.spyOn(repository._internals as any, '_genesisFromNetwork')
    const syncSpy = jest.spyOn(repository._internals, '_sync')

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

  test('Pinning a stream prevents it from needing to be synced', async () => {
    const content = { foo: 'bar' }
    const genesisCommit = await TileDocument.makeGenesis(ceramic, { foo: 'bar' })
    const genesisCid = await ceramic.dispatcher.storeCommit(genesisCommit)
    const streamId = new StreamID('tile', genesisCid)
    const syncSpy = jest.spyOn(repository._internals, '_sync')
    const loadFromNetworkSpy = jest.spyOn(repository._internals, '_loadStreamFromNetwork')

    const stream1 = await repository.load(streamId, { syncTimeoutSeconds: 0 })
    expect(stream1.state.content).toEqual(content)
    // The first time a stream is loaded it is always loaded from the network
    expect(syncSpy).toBeCalledTimes(0)
    expect(loadFromNetworkSpy).toBeCalledTimes(1)

    const stream2 = await repository.load(streamId, { syncTimeoutSeconds: 0 })
    expect(StreamUtils.serializeState(stream2.state)).toEqual(
      StreamUtils.serializeState(stream1.state)
    )
    // Doesn't need to sync because stream is in the cache
    expect(syncSpy).toBeCalledTimes(0)
    expect(loadFromNetworkSpy).toBeCalledTimes(1)

    // Remove stream from the cache
    repository.inmemory.delete(streamId.toString())
    const stream3 = await repository.load(streamId, { syncTimeoutSeconds: 0 })
    expect(StreamUtils.serializeState(stream3.state)).toEqual(
      StreamUtils.serializeState(stream2.state)
    )
    // Now needs to be loaded from the network again because stream is no longer in the cache and
    // isn't pinned
    expect(syncSpy).toBeCalledTimes(0)
    expect(loadFromNetworkSpy).toBeCalledTimes(2)

    // Now pin the stream, which adds it to the syncedPinnedStreams set
    await ceramic.admin.pin.add(streamId)
    // No sync needed when loading for pin since already in the cache
    expect(syncSpy).toBeCalledTimes(0)
    expect(loadFromNetworkSpy).toBeCalledTimes(2)
    repository.inmemory.delete(streamId.toString())
    const stream4 = await repository.load(streamId, { syncTimeoutSeconds: 0 })
    expect(StreamUtils.serializeState(stream4.state)).toEqual(
      StreamUtils.serializeState(stream3.state)
    )
    // Even though stream was removed from the cache, it was in the syncedPinnedStreams
    // set so doesn't need to be synced again
    expect(syncSpy).toBeCalledTimes(0)
    expect(loadFromNetworkSpy).toBeCalledTimes(2)

    // Now remove the stream from both the cache and the syncedPinnedStreams set
    repository.inmemory.delete(streamId.toString())
    repository._internals.markUnpinned(streamId)

    const stream5 = await repository.load(streamId, { syncTimeoutSeconds: 0 })
    expect(StreamUtils.serializeState(stream5.state)).toEqual(
      StreamUtils.serializeState(stream4.state)
    )
    // Now the state was loaded from the state store but needed to be synced
    expect(syncSpy).toBeCalledTimes(1)
    expect(loadFromNetworkSpy).toBeCalledTimes(2)

    // Stream should be back in the syncedPinnedStreams set and so won't need to be synced again
    const stream6 = await repository.load(streamId, { syncTimeoutSeconds: 0 })
    expect(StreamUtils.serializeState(stream6.state)).toEqual(
      StreamUtils.serializeState(stream5.state)
    )
    // Now the state was loaded from the state store but needed to be synced
    expect(syncSpy).toBeCalledTimes(1)
    expect(loadFromNetworkSpy).toBeCalledTimes(2)
  }, 30000)

  describe('loadAtCommit', () => {
    const INITIAL_CONTENT = { abc: 123, def: 456 }

    test('commit history and loadAtCommit', async () => {
      const stream = await TileDocument.create<any>(ceramic, INITIAL_CONTENT)
      stream.subscribe()
      const streamState = await ceramic.repository.load(stream.id, {})

      const commit0 = stream.allCommitIds[0]
      expect(stream.commitId).toEqual(commit0)
      expect(commit0.equals(CommitID.make(streamState.id, streamState.id.cid))).toBeTruthy()

      await TestUtils.anchorUpdate(ceramic, stream)
      expect(stream.allCommitIds.length).toEqual(2)
      expect(stream.anchorCommitIds.length).toEqual(1)
      const commit1 = stream.allCommitIds[1]
      expect(commit1.equals(commit0)).toBeFalsy()
      expect(commit1).toEqual(stream.commitId)
      expect(commit1).toEqual(stream.anchorCommitIds[0])

      const newContent = { abc: 321, def: 456, gh: 987 }
      const updateRec = await stream.makeCommit(ceramic, newContent)
      await ceramic.repository.applyCommit(streamState.id, updateRec, {
        anchor: true,
        publish: false,
      })
      expect(stream.allCommitIds.length).toEqual(3)
      expect(stream.anchorCommitIds.length).toEqual(1)
      const commit2 = stream.allCommitIds[2]
      expect(commit2.equals(commit1)).toBeFalsy()
      expect(commit2).toEqual(stream.commitId)

      await TestUtils.anchorUpdate(ceramic, stream)
      expect(stream.allCommitIds.length).toEqual(4)
      expect(stream.anchorCommitIds.length).toEqual(2)
      const commit3 = stream.allCommitIds[3]
      expect(commit3.equals(commit2)).toBeFalsy()
      expect(commit3).toEqual(stream.commitId)
      expect(commit3).toEqual(stream.anchorCommitIds[1])
      expect(stream.content).toEqual(newContent)
      expect(stream.state.signature).toEqual(SignatureStatus.SIGNED)
      expect(stream.state.anchorStatus).not.toEqual(AnchorStatus.NOT_REQUESTED)
      expect(stream.state.log.length).toEqual(4)

      // Apply a final commit that does not get anchored
      const finalContent = { foo: 'bar' }
      const updateRec2 = await stream.makeCommit(ceramic, finalContent)
      await ceramic.repository.applyCommit(streamState.id, updateRec2, {
        anchor: true,
        publish: false,
      })

      expect(stream.allCommitIds.length).toEqual(5)
      expect(stream.anchorCommitIds.length).toEqual(2)
      const commit4 = stream.allCommitIds[4]
      expect(commit4.equals(commit3)).toBeFalsy()
      expect(commit4).toEqual(stream.commitId)
      expect(commit4.equals(stream.anchorCommitIds[1])).toBeFalsy()
      expect(stream.state.log.length).toEqual(5)

      await TestUtils.anchorUpdate(ceramic, stream)

      // Correctly check out a specific commit
      const streamStateOriginal = cloneDeep(streamState.state)
      const streamV0 = await ceramic.repository.loadAtCommit(commit0, { syncTimeoutSeconds: 0 })
      expect(streamV0.id.equals(commit0.baseID)).toBeTruthy()
      expect(streamV0.value.log.length).toEqual(1)
      expect(streamV0.value.metadata.controllers).toEqual([ceramic.did.id])
      expect(streamV0.value.content).toEqual(INITIAL_CONTENT)
      expect(streamV0.value.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)

      // Ensure that loading at a CommitID does not mutate the state object that exists in the
      // Repository's cache
      expect(StreamUtils.serializeState(streamState.state)).toEqual(
        StreamUtils.serializeState(streamStateOriginal)
      )

      const streamV1 = await ceramic.repository.loadAtCommit(commit1, { syncTimeoutSeconds: 0 })
      expect(streamV1.id.equals(commit1.baseID)).toBeTruthy()
      expect(streamV1.value.log.length).toEqual(2)
      expect(streamV1.value.metadata.controllers).toEqual([ceramic.did.id])
      expect(streamV1.value.content).toEqual(INITIAL_CONTENT)
      expect(streamV1.value.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      const streamV2 = await ceramic.repository.loadAtCommit(commit2, { syncTimeoutSeconds: 0 })
      expect(streamV2.id.equals(commit2.baseID)).toBeTruthy()
      expect(streamV2.value.log.length).toEqual(3)
      expect(streamV2.value.metadata.controllers).toEqual([ceramic.did.id])
      expect(streamV2.value.next.content).toEqual(newContent)
      expect(streamV2.value.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)

      const streamV3 = await ceramic.repository.loadAtCommit(commit3, { syncTimeoutSeconds: 0 })
      expect(streamV3.id.equals(commit3.baseID)).toBeTruthy()
      expect(streamV3.value.log.length).toEqual(4)
      expect(streamV3.value.metadata.controllers).toEqual([ceramic.did.id])
      expect(streamV3.value.content).toEqual(newContent)
      expect(streamV3.value.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      const streamV4 = await ceramic.repository.loadAtCommit(commit4, { syncTimeoutSeconds: 0 })
      expect(streamV4.id.equals(commit4.baseID)).toBeTruthy()
      expect(streamV4.value.log.length).toEqual(5)
      expect(streamV4.value.metadata.controllers).toEqual([ceramic.did.id])
      expect(streamV4.value.next.content).toEqual(finalContent)
      expect(streamV4.value.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)
    })

    test('non-existing commit', async () => {
      const stream = await TileDocument.create(ceramic, INITIAL_CONTENT, null, { anchor: false })
      // Emulate loading a non-existing commit
      const fakeCid = TestUtils.randomCID()
      const nonExistentCommitID = CommitID.make(stream.id, fakeCid)
      const originalRetrieve = ceramic.dispatcher.retrieveCommit.bind(ceramic.dispatcher)
      ceramic.dispatcher.retrieveCommit = jest.fn(async (cid: CID) => {
        if (cid.equals(fakeCid)) {
          return null
        } else {
          return originalRetrieve(cid)
        }
      })
      await expect(
        ceramic.repository.loadAtCommit(nonExistentCommitID, { syncTimeoutSeconds: 0 })
      ).rejects.toThrow(`No commit found for CID ${nonExistentCommitID.commit?.toString()}`)
    })

    test('loadAtCommit returns read-only snapshot', async () => {
      const stream1 = await TileDocument.create<any>(ceramic, { foo: 'bar' }, null, {
        anchor: false,
      })
      await stream1.update({ abc: 321, def: 456, gh: 987 })
      await TestUtils.anchorUpdate(ceramic, stream1)

      const ceramic2 = await createCeramic(ipfs, { anchorOnRequest: false })
      const streamState2 = await ceramic2.repository.load(stream1.id, {
        sync: SyncOptions.NEVER_SYNC,
        syncTimeoutSeconds: 0,
      })
      expect(streamState2.state.log.length).toEqual(1)
      const snapshot = await ceramic2.repository.loadAtCommit(stream1.commitId, {
        syncTimeoutSeconds: 0,
      })

      expect(StreamUtils.statesEqual(snapshot.state, stream1.state))
      const snapshotStream = streamFromState<TileDocument>(
        ceramic2.context,
        ceramic2._streamHandlers,
        snapshot.value
      )

      // Snapshot is read-only
      await expect(snapshotStream.update({ abc: 1010 })).rejects.toThrow(
        'Historical stream commits cannot be modified. Load the stream without specifying a commit to make updates.'
      )

      // We fast-forward streamState2, because the commit is legit
      expect(streamState2.state).toEqual(stream1.state)

      await ceramic2.close()
    })

    test('return read-only snapshot: do not lose own anchor status', async () => {
      // Prepare commits to play
      const tile1 = await TileDocument.create<any>(ceramic, INITIAL_CONTENT, null, {
        anchor: false,
        syncTimeoutSeconds: 0,
      })
      await tile1.update({ a: 1 })

      // We have a stream in PENDING state
      expect(tile1.state.anchorStatus).toEqual(AnchorStatus.PENDING)
      const pendingState = cloneDeep(tile1.state)
      const base$ = new StateLink(pendingState)

      const loadSpy = jest.spyOn(ceramic.repository, 'load')
      loadSpy.mockImplementationOnce(async () => {
        return base$ as any as RunningState
      })
      // We request a snapshot at the latest commit
      const snapshot = await ceramic.repository.loadAtCommit(tile1.commitId, {
        syncTimeoutSeconds: 0,
      })
      // Do not fast-forward the base state: retain PENDING anchor status
      expect(base$.state).toBe(pendingState)
      // The snapshot does not inherit anchor status though
      expect(snapshot.state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)
    })

    test('commit ahead of current state', async () => {
      const stream = await TileDocument.create(ceramic, INITIAL_CONTENT, null, { anchor: false })
      const streamState = await ceramic.repository.load(stream.id, {})
      // Provide a new commit that the repository doesn't currently know about
      const newContent = { abc: 321, def: 456, gh: 987 }
      const updateCommit = await stream.makeCommit(ceramic, newContent)
      const futureCommitCID = await ceramic.dispatcher.storeCommit(updateCommit)
      const futureCommitID = CommitID.make(stream.id, futureCommitCID)

      // Now load the stream at a commitID ahead of what is currently in the state in the repository.
      // The existing RunningState from the repository should also get updated
      const snapshot = await ceramic.repository.loadAtCommit(futureCommitID, {
        syncTimeoutSeconds: 0,
      })
      expect(snapshot.value.next.content).toEqual(newContent)
      expect(snapshot.value.log.length).toEqual(2)
      expect(StreamUtils.serializeState(streamState.state)).toEqual(
        StreamUtils.serializeState(snapshot.value)
      )
    })

    test('handles basic conflict', async () => {
      const stream1 = await TileDocument.create(ceramic, INITIAL_CONTENT)
      stream1.subscribe()
      const streamState1 = await ceramic.repository.load(stream1.id, {})
      const streamId = stream1.id
      await TestUtils.anchorUpdate(ceramic, stream1)
      const tipPreUpdate = stream1.tip

      const newContent = { abc: 321, def: 456, gh: 987 }
      let updateRec = await stream1.makeCommit(ceramic, newContent)
      await ceramic.repository.applyCommit(streamState1.id, updateRec, {
        anchor: true,
        publish: false,
      })

      await TestUtils.anchorUpdate(ceramic, stream1)
      expect(stream1.content).toEqual(newContent)
      const tipValidUpdate = stream1.tip
      // create invalid change that happened after main change

      const initialState = await ceramic.repository
        .loadAtCommit(CommitID.make(streamId, streamId.cid), { syncTimeoutSeconds: 0 })
        .then((stream) => stream.state)
      const state$ = new RunningState(initialState, true)
      ceramic.repository.add(state$)
      await ceramic.repository._internals.handleTip(state$, tipPreUpdate)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const conflictingNewContent = { asdf: 2342 }
      const stream2 = streamFromState<TileDocument>(
        ceramic.context,
        ceramic._streamHandlers,
        state$.value,
        ceramic.repository.updates$
      )
      stream2.subscribe()
      updateRec = await stream2.makeCommit(ceramic, conflictingNewContent)
      await ceramic.repository.applyCommit(state$.id, updateRec, {
        anchor: true,
        publish: false,
      })

      await TestUtils.anchorUpdate(ceramic, stream2)
      const tipInvalidUpdate = state$.tip
      expect(stream2.content).toEqual(conflictingNewContent)
      // loading tip from valid log to stream with invalid
      // log results in valid state
      await ceramic.repository._internals.handleTip(state$, tipValidUpdate)
      expect(stream2.content).toEqual(newContent)

      // loading tip from invalid log to stream with valid
      // log results in valid state
      await ceramic.repository._internals.handleTip(streamState1, tipInvalidUpdate)
      expect(stream1.content).toEqual(newContent)

      // Loading valid commit works
      const streamState1Original = cloneDeep(streamState1.state)
      const streamAtValidCommit = await ceramic.repository.loadAtCommit(
        CommitID.make(streamId, tipValidUpdate),
        { syncTimeoutSeconds: 0 }
      )
      expect(streamAtValidCommit.value.content).toEqual(newContent)

      // Loading invalid commit fails
      await expect(
        ceramic.repository.loadAtCommit(CommitID.make(streamId, tipInvalidUpdate), {
          syncTimeoutSeconds: 0,
        })
      ).rejects.toThrow(/rejected by conflict resolution/)

      // Ensure that loading at a CommitID does not mutate the state object that exists in the
      // Repository's cache
      expect(StreamUtils.serializeState(streamState1.state)).toEqual(
        StreamUtils.serializeState(streamState1Original)
      )
    }, 10000)
  })

  describe('sync: SYNC_ALWAYS', () => {
    describe('pinned', () => {
      test('revalidate current state, rewrite', async () => {
        const stream1 = await TileDocument.create(ceramic, { a: 1 }, null, {
          anchor: false,
          pin: true,
        })
        await stream1.update({ a: 2 }, null, { anchor: false })

        const fromMemory = jest.spyOn(repository._internals as any, '_fromMemory')
        fromMemory.mockReturnValueOnce(undefined)
        const fromStateStore = jest.spyOn(repository._internals as any, 'fromStreamStateStore')
        const fromNetwork = jest.spyOn(repository.streamLoader as any, 'resyncStream')
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
        await stream1.update({ a: 2 }, null, { anchor: false })

        const fromMemory = jest.spyOn(repository._internals as any, '_fromMemory')
        const fromStateStore = jest.spyOn(repository._internals as any, 'fromStreamStateStore')
        const fromNetwork = jest.spyOn(repository.streamLoader as any, 'resyncStream')
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

describe('applyWriteOpts', () => {
  test('dont publish on LOAD', async () => {
    const publishSpy = jest.spyOn(repository._internals, 'publishTip')
    await repository.applyWriteOpts(
      new RunningState(TestUtils.makeStreamState(), false),
      { publish: true },
      OperationType.LOAD
    )
    expect(publishSpy).not.toBeCalled()
  })
  test('publish on UPDATE or CREATE ', async () => {
    const operations = [/*OperationType.UPDATE,*/ OperationType.CREATE]
    for (const operation of operations) {
      const publishSpy = jest.spyOn(repository._internals, 'publishTip')
      const pinSpy = jest.spyOn(repository, 'handlePinOpts')
      pinSpy.mockImplementationOnce(() => {})
      await repository.applyWriteOpts(
        new RunningState(TestUtils.makeStreamState(), false),
        { publish: true },
        operation
      )
      expect(publishSpy).toHaveBeenCalledTimes(1)
      expect(pinSpy).toHaveBeenCalledTimes(1)
    }
  })
})
