import { jest } from '@jest/globals'
import { Dispatcher } from '../../dispatcher.js'
import { createIPFS, swarmConnect } from '@ceramicnetwork/ipfs-daemon'
import { createDispatcher } from '../../__tests__/create-dispatcher.js'
import {
  AnchorStatus,
  Context,
  IpfsApi,
  LoggerProvider,
  StreamState,
  StreamUtils,
  TestUtils,
} from '@ceramicnetwork/common'
import { Ceramic } from '../../ceramic.js'
import { createCeramic } from '../../__tests__/create-ceramic.js'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { LogSyncer } from '../log-syncer.js'
import { StateManipulator } from '../state-manipulator.js'
import { HandlersMap } from '../../handlers-map.js'
import { StreamLoader } from '../stream-loader.js'
import { TipFetcher } from '../tip-fetcher.js'
import { AnchorTimestampExtractor } from '../anchor-timestamp-extractor.js'
import { InMemoryAnchorService } from '../../anchor/memory/in-memory-anchor-service.js'
import { CommitID } from '@ceramicnetwork/streamid'
import cloneDeep from 'lodash.clonedeep'

const TOPIC = '/ceramic/test12345'
const CONTENT0 = { step: 0 }
const CONTENT1 = { step: 1 }
const CONTENT2 = { step: 2 }

function expectStatesEqualWithPendingAnchor(
  stateWithPendingAnchor: StreamState,
  stateWithoutPendingAnchor: StreamState
) {
  expect(stateWithPendingAnchor.anchorStatus).toEqual(AnchorStatus.PENDING)
  expect(stateWithoutPendingAnchor.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)
  delete stateWithPendingAnchor.anchorStatus
  delete stateWithoutPendingAnchor.anchorStatus
  expect(StreamUtils.serializeState(stateWithoutPendingAnchor)).toEqual(
    StreamUtils.serializeState(stateWithPendingAnchor)
  )
}

describe('StreamLoader test', () => {
  jest.setTimeout(1000 * 30)

  let dispatcher: Dispatcher
  let dispatcherIpfs: IpfsApi
  let streamLoader: StreamLoader

  let ceramicIpfs: IpfsApi
  let ceramic: Ceramic

  beforeAll(async () => {
    ceramicIpfs = await createIPFS()
    ceramic = await createCeramic(ceramicIpfs, { pubsubTopic: TOPIC })

    dispatcherIpfs = await createIPFS()
    dispatcher = await createDispatcher(dispatcherIpfs, TOPIC)
    // speed up how quickly the dispatcher gives up on loading a non-existent commit from ipfs.
    dispatcher._ipfsTimeout = 1000

    const logger = new LoggerProvider().getDiagnosticsLogger()
    const tipFetcher = new TipFetcher(dispatcher.messageBus)
    const logSyncer = new LogSyncer(dispatcher)
    const anchorTimestampExtractor = new AnchorTimestampExtractor(
      logger,
      dispatcher,
      ceramic.context.anchorService as InMemoryAnchorService
    )
    const handlers = new HandlersMap(logger)
    const stateManipulator = new StateManipulator(
      logger,
      handlers,
      { did: ceramic.did, api: ceramic } as Context,
      logSyncer
    )
    streamLoader = new StreamLoader(
      logger,
      tipFetcher,
      logSyncer,
      anchorTimestampExtractor,
      stateManipulator
    )

    await swarmConnect(dispatcherIpfs, ceramicIpfs)
  })

  afterAll(async () => {
    await dispatcher.close()
    await ceramic.close()

    // Wait for pubsub unsubscribe to be processed
    // TODO(1963): Remove this once dispatcher.close() won't resolve until the pubsub unsubscribe
    // has been processed
    await TestUtils.delay(5000)

    await dispatcherIpfs.stop()
    await ceramicIpfs.stop()
  })

  describe('loadStream', () => {
    test('basic stream load', async () => {
      const doc = await TileDocument.create(ceramic, CONTENT0)

      const loadedState0 = await streamLoader.loadStream(doc.id, 3)
      expectStatesEqualWithPendingAnchor(doc.state, loadedState0)

      await TestUtils.anchorUpdate(ceramic, doc)
      const loadedState1 = await streamLoader.loadStream(doc.id, 3)
      expect(StreamUtils.serializeState(loadedState1)).toEqual(
        StreamUtils.serializeState(doc.state)
      )

      await doc.update(CONTENT1)
      const loadedState2 = await streamLoader.loadStream(doc.id, 3)
      expectStatesEqualWithPendingAnchor(doc.state, loadedState2)

      await doc.update(CONTENT2)
      const loadedState3 = await streamLoader.loadStream(doc.id, 3)
      expectStatesEqualWithPendingAnchor(doc.state, loadedState3)

      await TestUtils.anchorUpdate(ceramic, doc)
      const loadedState4 = await streamLoader.loadStream(doc.id, 3)
      expect(StreamUtils.serializeState(loadedState4)).toEqual(
        StreamUtils.serializeState(doc.state)
      )
    })
  })

  describe('syncStream', () => {
    test('basic stream sync', async () => {
      const doc = await TileDocument.create(ceramic, CONTENT0)

      const state0 = await streamLoader.loadStream(doc.id, 3)
      expectStatesEqualWithPendingAnchor(doc.state, state0)

      await TestUtils.anchorUpdate(ceramic, doc)
      const state1 = await streamLoader.syncStream(state0, 3)
      expect(state1).not.toEqual(state0)
      expect(StreamUtils.serializeState(state1)).toEqual(StreamUtils.serializeState(doc.state))

      await doc.update(CONTENT1)
      const state2A = await streamLoader.syncStream(state0, 3)
      const state2B = await streamLoader.syncStream(state1, 3)
      expectStatesEqualWithPendingAnchor(doc.state, state2A)
      expectStatesEqualWithPendingAnchor(doc.state, state2B)
      expect(state2A).toEqual(state2B)

      await doc.update(CONTENT2)
      await TestUtils.anchorUpdate(ceramic, doc)

      const state3A = await streamLoader.syncStream(state0, 3)
      const state3B = await streamLoader.syncStream(state1, 3)
      const state3C = await streamLoader.syncStream(state2A, 3)
      expect(StreamUtils.serializeState(state3A)).toEqual(StreamUtils.serializeState(doc.state))
      expect(StreamUtils.serializeState(state3B)).toEqual(StreamUtils.serializeState(doc.state))
      expect(StreamUtils.serializeState(state3C)).toEqual(StreamUtils.serializeState(doc.state))
    })
  })

  describe('stateAtCommit', () => {
    test('basic ability to load stream at various CommitIDs', async () => {
      const doc = await TileDocument.create(ceramic, CONTENT0)
      await TestUtils.anchorUpdate(ceramic, doc)
      await doc.update(CONTENT1)
      await doc.update(CONTENT2)
      await TestUtils.anchorUpdate(ceramic, doc)
      const commits = doc.allCommitIds
      expect(commits.length).toEqual(5)
      for (const commit of commits) {
        expect(doc.id.toString()).toEqual(commit.baseID.toString())
      }

      const stateV0 = await streamLoader.stateAtCommit(doc.state, commits[0])
      expect(stateV0.log.length).toEqual(1)
      expect(stateV0.content).toEqual(CONTENT0)
      expect(stateV0.next).toBeUndefined()
      expect(stateV0.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)

      const stateV1 = await streamLoader.stateAtCommit(doc.state, commits[1])
      expect(stateV1.log.length).toEqual(2)
      expect(stateV1.content).toEqual(CONTENT0)
      expect(stateV1.next).toBeUndefined()
      expect(stateV1.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      const stateV2 = await streamLoader.stateAtCommit(doc.state, commits[2])
      expect(stateV2.log.length).toEqual(3)
      expect(stateV2.content).toEqual(CONTENT0)
      expect(stateV2.next.content).toEqual(CONTENT1)
      expect(stateV2.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)

      const stateV3 = await streamLoader.stateAtCommit(doc.state, commits[3])
      expect(stateV3.log.length).toEqual(4)
      expect(stateV3.content).toEqual(CONTENT0)
      expect(stateV3.next.content).toEqual(CONTENT2)
      expect(stateV3.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)

      const stateV4 = await streamLoader.stateAtCommit(doc.state, commits[4])
      expect(stateV4.log.length).toEqual(5)
      expect(stateV4.content).toEqual(CONTENT2)
      expect(stateV4.next).toBeUndefined()
      expect(stateV4.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    })

    test('commit ahead of current state', async () => {
      const stream = await TileDocument.create(ceramic, CONTENT0)
      const initialState = cloneDeep(stream.state)
      await stream.update(CONTENT1)
      await TestUtils.anchorUpdate(ceramic, stream)

      // Now load the stream at a commitID ahead of what is currently in the state
      const updatedState1 = await streamLoader.stateAtCommit(initialState, stream.allCommitIds[1])
      expect(updatedState1.log.length).toEqual(2)
      expect(updatedState1.content).toEqual(CONTENT0)
      expect(updatedState1.next.content).toEqual(CONTENT1)
      expect(updatedState1.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)

      const updatedState2 = await streamLoader.stateAtCommit(initialState, stream.allCommitIds[2])
      expect(updatedState2.log.length).toEqual(3)
      expect(updatedState2.content).toEqual(CONTENT1)
      expect(updatedState2.next).toBeUndefined()
      expect(updatedState2.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    })

    test('non-existent commit', async () => {
      const doc = await TileDocument.create(ceramic, CONTENT0)

      const nonExistentCommitID = CommitID.make(doc.id, TestUtils.randomCID())

      await expect(streamLoader.stateAtCommit(doc.state, nonExistentCommitID)).rejects.toThrow(
        /Timeout error while loading CID/
      )
    })

    test('throw if commit rejected by conflict resolution', async () => {
      const stream = await TileDocument.create(ceramic, CONTENT0)
      const conflictingUpdate = await stream.makeCommit(ceramic, CONTENT2)
      await stream.update(CONTENT1)
      await TestUtils.anchorUpdate(ceramic, stream)

      const conflictingUpdateCID = await dispatcher.storeCommit(conflictingUpdate)

      await expect(
        streamLoader.stateAtCommit(stream.state, CommitID.make(stream.id, conflictingUpdateCID))
      ).rejects.toThrow(/rejected by conflict resolution/)
    })
  })
})
