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
})
