import { afterEach, jest } from '@jest/globals'
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
} from '@ceramicnetwork/common'
import { Utils as CoreUtils } from '../../index.js'
import { Ceramic } from '../../ceramic.js'
import { createCeramic } from '../../__tests__/create-ceramic.js'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { LogSyncer } from '../log-syncer.js'
import { StateManipulator } from '../state-manipulator.js'
import { HandlersMap } from '../../handlers-map.js'
import { StreamLoader } from '../stream-loader.js'
import { TipFetcher } from '../tip-fetcher.js'
import { AnchorTimestampExtractor } from '../anchor-timestamp-extractor.js'
import { CommitID, StreamID } from '@ceramicnetwork/streamid'
import cloneDeep from 'lodash.clonedeep'
import { CID } from 'multiformats/cid'
import {
  MsgType,
  PubsubMessage,
  QueryMessage,
  ResponseMessage,
} from '../../pubsub/pubsub-message.js'
import { asIpfsMessage } from '../../pubsub/__tests__/as-ipfs-message.js'
import { CommonTestUtils as TestUtils } from '@ceramicnetwork/common-test-utils'

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

describe('StreamLoader querying against real Ceramic node', () => {
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
    // We need this timeout to be short enough that the non-existent lookup timesout before
    // the test case itself timesout.
    dispatcher._ipfsTimeout = 200
    await dispatcher.init()

    const logger = new LoggerProvider().getDiagnosticsLogger()
    const tipFetcher = new TipFetcher(dispatcher.messageBus)
    const logSyncer = new LogSyncer(dispatcher)
    const anchorTimestampExtractor = new AnchorTimestampExtractor(
      logger,
      dispatcher,
      ceramic.anchorService.validator
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

      await CoreUtils.anchorUpdate(ceramic, doc)
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

      await CoreUtils.anchorUpdate(ceramic, doc)
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

      await CoreUtils.anchorUpdate(ceramic, doc)
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
      await CoreUtils.anchorUpdate(ceramic, doc)

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
      await CoreUtils.anchorUpdate(ceramic, doc)
      await doc.update(CONTENT1)
      await doc.update(CONTENT2)
      await CoreUtils.anchorUpdate(ceramic, doc)
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
      await CoreUtils.anchorUpdate(ceramic, stream)

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
      await CoreUtils.anchorUpdate(ceramic, stream)

      const conflictingUpdateCID = await dispatcher.storeCommit(conflictingUpdate)

      await expect(
        streamLoader.stateAtCommit(stream.state, CommitID.make(stream.id, conflictingUpdateCID))
      ).rejects.toThrow(/rejected by conflict resolution/)
    })
  })

  describe('loadGenesisState', () => {
    test('load at genesis commit', async () => {
      const doc = await TileDocument.create(ceramic, CONTENT0)
      await doc.update(CONTENT1)
      await CoreUtils.anchorUpdate(ceramic, doc)
      expect(doc.state.log.length).toEqual(3)

      const genesisState = await streamLoader.loadGenesisState(doc.id)
      expect(genesisState.log.length).toEqual(1)
      expect(genesisState.content).toEqual(CONTENT0)
    })
  })
})

/**
 * Intercepts the function that publishes messages to pubsub and returns the first query message
 * published (while still passing it on to pubsub as normal).
 */
function getQueryPublishedPromise(
  dispatcher: Dispatcher,
  streamID: StreamID,
  originalPubsubPublish
): Promise<QueryMessage> {
  const pubsubPublishSpy = jest.spyOn(dispatcher.messageBus.pubsub, 'next')
  return new Promise((resolve) => {
    pubsubPublishSpy.mockImplementation((message: PubsubMessage) => {
      if (message.typ == MsgType.QUERY && message.stream.equals(streamID)) {
        resolve(message)
      }
      return originalPubsubPublish(message)
    })
  })
}

function makeResponse(streamID: StreamID, queryId: string, cid: CID): ResponseMessage {
  const tipMap = new Map().set(streamID.toString(), cid)
  const response = { typ: MsgType.RESPONSE as const, id: queryId, tips: tipMap }
  return response
}

describe('StreamLoader querying against mocked pubsub responses', () => {
  jest.setTimeout(1000 * 30)

  let ipfs: IpfsApi

  let dispatcher: Dispatcher
  let streamLoader: StreamLoader

  let stream: TileDocument
  let commitCids: Array<CID>
  const states: Array<StreamState> = []

  let receiveMessage
  let originalPubsubPublish

  beforeAll(async () => {
    ipfs = await createIPFS()
    const ceramic = await createCeramic(ipfs, { pubsubTopic: TOPIC })

    dispatcher = await createDispatcher(ipfs, TOPIC)
    // speed up how quickly the dispatcher gives up on loading a non-existent commit from ipfs.
    dispatcher._ipfsTimeout = 100

    // Intercept the function passed to ipfs on pubsub subscription so that we can publish new
    // messages directly
    const originalPubsubSubscribe = ipfs.pubsub.subscribe.bind(ipfs.pubsub)
    const pubsubSubscribeSpy = jest.spyOn(ipfs.pubsub, 'subscribe')
    pubsubSubscribeSpy.mockImplementation(async (topic, onMessageCallback, opts) => {
      receiveMessage = onMessageCallback
      return originalPubsubSubscribe(topic, onMessageCallback, opts)
    })
    originalPubsubPublish = dispatcher.messageBus.pubsub.next.bind(dispatcher.messageBus.pubsub)

    const logger = new LoggerProvider().getDiagnosticsLogger()
    const tipFetcher = new TipFetcher(dispatcher.messageBus)
    const logSyncer = new LogSyncer(dispatcher)
    const anchorTimestampExtractor = new AnchorTimestampExtractor(
      logger,
      dispatcher,
      ceramic.anchorService.validator
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

    stream = await TileDocument.create(ceramic, CONTENT0)
    states.push(stream.state)
    await CoreUtils.anchorUpdate(ceramic, stream)
    states.push(stream.state)
    await stream.update(CONTENT1)
    states.push(stream.state)
    await stream.update(CONTENT2)
    states.push(stream.state)
    await CoreUtils.anchorUpdate(ceramic, stream)
    states.push(stream.state)
    commitCids = stream.allCommitIds.map((commitId) => commitId.commit)
    expect(commitCids.length).toEqual(5)
    // When we load the state from the network we won't ever see a pending anchor status.
    states.forEach((state) => {
      if (state.anchorStatus == AnchorStatus.PENDING) {
        state.anchorStatus = AnchorStatus.NOT_REQUESTED
      }
    })

    // Close the Ceramic node before tests start so it won't respond to any pubsub messages.
    await ceramic.close()
  })

  afterEach(() => {
    // Ensure that the StreamLoader never mutates the state object that is passed in
    expect(states[0].log.length).toEqual(1)
    expect(states[1].log.length).toEqual(2)
    expect(states[2].log.length).toEqual(3)
    expect(states[3].log.length).toEqual(4)
    expect(states[4].log.length).toEqual(5)
    expect(states[0].content).toEqual(CONTENT0)
    expect(states[1].content).toEqual(CONTENT0)
    expect(states[2].content).toEqual(CONTENT0)
    expect(states[2].next.content).toEqual(CONTENT1)
    expect(states[3].content).toEqual(CONTENT0)
    expect(states[3].next.content).toEqual(CONTENT2)
    expect(states[4].content).toEqual(CONTENT2)
  })

  afterAll(async () => {
    await dispatcher.close()

    // Wait for pubsub unsubscribe to be processed
    // TODO(1963): Remove this once dispatcher.close() won't resolve until the pubsub unsubscribe
    // has been processed
    await TestUtils.delay(5000)

    await ipfs.stop()
  })

  describe('loadStream', () => {
    test('no tip response', async () => {
      const loaded = await streamLoader.loadStream(stream.id, 1)

      // If no valid tip is received, should return genesis state
      expect(loaded.log.length).toEqual(1)
      expect(loaded.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)
      expect(loaded.content).toEqual(CONTENT0)
    })

    test('Invalid tip', async () => {
      const queryPublished = getQueryPublishedPromise(dispatcher, stream.id, originalPubsubPublish)

      const loadStreamPromise = streamLoader.loadStream(stream.id, 1)

      const queryMessage = await queryPublished

      const invalidTip = TestUtils.randomCID()
      await receiveMessage(asIpfsMessage(makeResponse(stream.id, queryMessage.id, invalidTip)))

      const loaded = await loadStreamPromise

      // If no valid tip is received, should return genesis state
      expect(loaded.log.length).toEqual(1)
      expect(loaded.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)
      expect(loaded.content).toEqual(CONTENT0)
    })

    test('Considers multiple tips - second tip better', async () => {
      const queryPublished = getQueryPublishedPromise(dispatcher, stream.id, originalPubsubPublish)

      const loadStreamPromise = streamLoader.loadStream(stream.id, 1)

      const queryMessage = await queryPublished

      // publish 2 tips back-to-back.  The loadStream should consider both tips
      await receiveMessage(asIpfsMessage(makeResponse(stream.id, queryMessage.id, commitCids[0])))
      await receiveMessage(asIpfsMessage(makeResponse(stream.id, queryMessage.id, commitCids[1])))

      const loaded = await loadStreamPromise

      expect(loaded.log.length).toEqual(2)
      expect(loaded.anchorStatus).toEqual(AnchorStatus.ANCHORED)
      expect(loaded.content).toEqual(CONTENT0)
    })

    test('Considers multiple tips - first tip better', async () => {
      const queryPublished = getQueryPublishedPromise(dispatcher, stream.id, originalPubsubPublish)

      const loadStreamPromise = streamLoader.loadStream(stream.id, 1)

      const queryMessage = await queryPublished

      // publish 2 tips back-to-back.  The loadStream should consider both tips.
      await receiveMessage(asIpfsMessage(makeResponse(stream.id, queryMessage.id, commitCids[1])))
      await receiveMessage(asIpfsMessage(makeResponse(stream.id, queryMessage.id, commitCids[0])))

      const loaded = await loadStreamPromise

      expect(loaded.log.length).toEqual(2)
      expect(loaded.anchorStatus).toEqual(AnchorStatus.ANCHORED)
      expect(loaded.content).toEqual(CONTENT0)
    })

    test('Considers many tips', async () => {
      const queryPublished = getQueryPublishedPromise(dispatcher, stream.id, originalPubsubPublish)

      const loadStreamPromise = streamLoader.loadStream(stream.id, 1)

      const queryMessage = await queryPublished

      // publish multiple tips back-to-back.  The loadStream should consider them all and pick the
      // best state
      await receiveMessage(asIpfsMessage(makeResponse(stream.id, queryMessage.id, commitCids[1])))
      await receiveMessage(asIpfsMessage(makeResponse(stream.id, queryMessage.id, commitCids[3])))
      await receiveMessage(asIpfsMessage(makeResponse(stream.id, queryMessage.id, commitCids[0])))
      await receiveMessage(asIpfsMessage(makeResponse(stream.id, queryMessage.id, commitCids[4])))
      await receiveMessage(asIpfsMessage(makeResponse(stream.id, queryMessage.id, commitCids[2])))

      const loaded = await loadStreamPromise

      expect(loaded.log.length).toEqual(5)
      expect(loaded.anchorStatus).toEqual(AnchorStatus.ANCHORED)
      expect(loaded.content).toEqual(CONTENT2)
    })

    test('Considers multiple tips - first tip invalid', async () => {
      const queryPublished = getQueryPublishedPromise(dispatcher, stream.id, originalPubsubPublish)

      const loadStreamPromise = streamLoader.loadStream(stream.id, 1)

      const queryMessage = await queryPublished

      const invalidTip = TestUtils.randomCID()
      await receiveMessage(asIpfsMessage(makeResponse(stream.id, queryMessage.id, invalidTip)))
      await receiveMessage(asIpfsMessage(makeResponse(stream.id, queryMessage.id, commitCids[1])))

      const loaded = await loadStreamPromise

      expect(loaded.log.length).toEqual(2)
      expect(loaded.anchorStatus).toEqual(AnchorStatus.ANCHORED)
      expect(loaded.content).toEqual(CONTENT0)
    })
  })

  describe('syncStream', () => {
    test('no tip response', async () => {
      const loaded = await streamLoader.syncStream(states[1], 1)

      // If no valid tip is received, state should be unmodified
      expect(loaded).toEqual(states[1])
      expect(loaded.log.length).toEqual(2)
      expect(loaded.anchorStatus).toEqual(AnchorStatus.ANCHORED)
      expect(loaded.content).toEqual(CONTENT0)
    })

    test('Invalid tip', async () => {
      const queryPublished = getQueryPublishedPromise(dispatcher, stream.id, originalPubsubPublish)

      const syncStreamPromise = streamLoader.syncStream(states[1], 1)

      const queryMessage = await queryPublished

      const invalidTip = TestUtils.randomCID()
      await receiveMessage(asIpfsMessage(makeResponse(stream.id, queryMessage.id, invalidTip)))

      const loaded = await syncStreamPromise

      // If no valid tip is received, state should be unmodified
      expect(loaded).toEqual(states[1])
      expect(loaded.log.length).toEqual(2)
      expect(loaded.anchorStatus).toEqual(AnchorStatus.ANCHORED)
      expect(loaded.content).toEqual(CONTENT0)
    })

    test('Considers multiple tips - second tip better', async () => {
      const queryPublished = getQueryPublishedPromise(dispatcher, stream.id, originalPubsubPublish)

      const syncStreamPromise = streamLoader.syncStream(states[0], 1)

      const queryMessage = await queryPublished

      // publish 2 tips back-to-back.  The loadStream should consider both tips
      await receiveMessage(asIpfsMessage(makeResponse(stream.id, queryMessage.id, commitCids[1])))
      await receiveMessage(asIpfsMessage(makeResponse(stream.id, queryMessage.id, commitCids[3])))

      const loaded = await syncStreamPromise

      expect(loaded).toEqual(states[3])
      expect(loaded.log.length).toEqual(4)
      expect(loaded.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)
      expect(loaded.content).toEqual(CONTENT0)
      expect(loaded.next.content).toEqual(CONTENT2)
    })

    test('Considers multiple tips - first tip better', async () => {
      const queryPublished = getQueryPublishedPromise(dispatcher, stream.id, originalPubsubPublish)

      const syncStreamPromise = streamLoader.syncStream(states[0], 1)

      const queryMessage = await queryPublished

      // publish 2 tips back-to-back.  The loadStream should consider both tips
      await receiveMessage(asIpfsMessage(makeResponse(stream.id, queryMessage.id, commitCids[3])))
      await receiveMessage(asIpfsMessage(makeResponse(stream.id, queryMessage.id, commitCids[1])))

      const loaded = await syncStreamPromise

      expect(loaded).toEqual(states[3])
      expect(loaded.log.length).toEqual(4)
      expect(loaded.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)
      expect(loaded.content).toEqual(CONTENT0)
      expect(loaded.next.content).toEqual(CONTENT2)
    })

    test('Considers many tips', async () => {
      const queryPublished = getQueryPublishedPromise(dispatcher, stream.id, originalPubsubPublish)

      const syncStreamPromise = streamLoader.syncStream(states[1], 1)

      const queryMessage = await queryPublished

      // publish multiple tips back-to-back.  The loadStream should consider them all and pick the
      // best state
      await receiveMessage(asIpfsMessage(makeResponse(stream.id, queryMessage.id, commitCids[1])))
      await receiveMessage(asIpfsMessage(makeResponse(stream.id, queryMessage.id, commitCids[3])))
      await receiveMessage(asIpfsMessage(makeResponse(stream.id, queryMessage.id, commitCids[0])))
      await receiveMessage(asIpfsMessage(makeResponse(stream.id, queryMessage.id, commitCids[4])))
      await receiveMessage(asIpfsMessage(makeResponse(stream.id, queryMessage.id, commitCids[2])))

      const loaded = await syncStreamPromise

      expect(loaded).toEqual(states[4])
      expect(loaded.log.length).toEqual(5)
      expect(loaded.anchorStatus).toEqual(AnchorStatus.ANCHORED)
      expect(loaded.content).toEqual(CONTENT2)
    })

    test('Considers multiple tips - first tip invalid', async () => {
      const queryPublished = getQueryPublishedPromise(dispatcher, stream.id, originalPubsubPublish)

      const syncStreamPromise = streamLoader.syncStream(states[1], 1)

      const queryMessage = await queryPublished

      const invalidTip = TestUtils.randomCID()
      await receiveMessage(asIpfsMessage(makeResponse(stream.id, queryMessage.id, invalidTip)))
      await receiveMessage(asIpfsMessage(makeResponse(stream.id, queryMessage.id, commitCids[4])))

      const loaded = await syncStreamPromise

      expect(loaded).toEqual(states[4])
      expect(loaded.log.length).toEqual(5)
      expect(loaded.anchorStatus).toEqual(AnchorStatus.ANCHORED)
      expect(loaded.content).toEqual(CONTENT2)
    })
  })

  describe('resyncStream', () => {
    test('no pubsub response, existing tip valid', async () => {
      const loaded = await streamLoader.resyncStream(stream.id, commitCids[1], 1)

      expect(loaded.log.length).toEqual(2)
      expect(loaded.anchorStatus).toEqual(AnchorStatus.ANCHORED)
      expect(loaded.content).toEqual(CONTENT0)
      expect(states[1].log.length).toEqual(2)
      expect(states[1].content).toEqual(CONTENT0)
      expect(loaded).toEqual(states[1])
    })

    test('existing tip is best', async () => {
      const queryPublished = getQueryPublishedPromise(dispatcher, stream.id, originalPubsubPublish)

      const syncStreamPromise = streamLoader.resyncStream(stream.id, commitCids[4], 1)

      const queryMessage = await queryPublished

      await receiveMessage(asIpfsMessage(makeResponse(stream.id, queryMessage.id, commitCids[2])))

      const loaded = await syncStreamPromise

      expect(loaded).toEqual(states[4])
      expect(loaded.log.length).toEqual(5)
      expect(loaded.anchorStatus).toEqual(AnchorStatus.ANCHORED)
      expect(loaded.content).toEqual(CONTENT2)
    })

    test('received tip is best', async () => {
      const queryPublished = getQueryPublishedPromise(dispatcher, stream.id, originalPubsubPublish)

      const syncStreamPromise = streamLoader.resyncStream(stream.id, commitCids[2], 1)

      const queryMessage = await queryPublished

      await receiveMessage(asIpfsMessage(makeResponse(stream.id, queryMessage.id, commitCids[4])))

      const loaded = await syncStreamPromise

      expect(loaded).toEqual(states[4])
      expect(loaded.log.length).toEqual(5)
      expect(loaded.anchorStatus).toEqual(AnchorStatus.ANCHORED)
      expect(loaded.content).toEqual(CONTENT2)
    })
  })
})
