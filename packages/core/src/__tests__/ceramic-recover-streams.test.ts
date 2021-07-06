import Ceramic from '../ceramic'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import tmp from 'tmp-promise'
import {
  StreamUtils,
  StreamState,
  IpfsApi,
  AnchorStatus,
  AnchorService,
} from '@ceramicnetwork/common'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import * as u8a from 'uint8arrays'
import { createIPFS } from './ipfs-util'
import { anchorUpdate } from '../state-management/__tests__/anchor-update'
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'
import KeyDidResolver from 'key-did-resolver'
import { Resolver } from 'did-resolver'
import { DID } from 'dids'

const PUBSUB_TOPIC = '/ceramic/inmemory/test'
const SEED = u8a.fromString(
  '6e34b2e1a9624113d81ece8a8a22e6e97f0e145c25c1d4d2d0e62753b4060c83',
  'base16'
)

const expectEqualStates = (state1: StreamState, state2: StreamState): void => {
  expect(StreamUtils.serializeState(state1)).toEqual(StreamUtils.serializeState(state2))
}

const makeDID = function (seed: Uint8Array, ceramic: Ceramic): DID {
  const provider = new Ed25519Provider(seed)

  const keyDidResolver = KeyDidResolver.getResolver()
  const threeIdResolver = ThreeIdResolver.getResolver(ceramic)
  const resolver = new Resolver({
    ...threeIdResolver,
    ...keyDidResolver,
  })
  return new DID({ provider, resolver })
}

async function createCeramic(
  ipfs: IpfsApi,
  stateStoreDirectory: string,
  anchorService?: AnchorService
) {
  const config = {
    stateStoreDirectory,
    anchorOnRequest: false,
    pubsubTopic: PUBSUB_TOPIC, // necessary so Ceramic instances can talk to each other
  }
  const [modules, params] = Ceramic._processConfig(ipfs, config)
  if (anchorService) {
    modules.anchorService = anchorService
  }

  const ceramic = new Ceramic(modules, params)
  const doPeerDiscovery = false
  const restoreStreams = true
  await ceramic._init(doPeerDiscovery, restoreStreams)

  ceramic.did = makeDID(SEED, ceramic)
  return ceramic
}

jest.setTimeout(60000)
let ipfs1: IpfsApi
let ipfs2: IpfsApi

beforeEach(async () => {
  [ipfs1, ipfs2] = await Promise.all(Array.from({ length: 2 }).map(() => createIPFS()))
})

afterEach(async () => {
  await ipfs1.stop()
  await ipfs2.stop()
})

it('restart anchor polling on #recoverStreams', async () => {
  const stateStoreDirectory = await tmp.tmpName()

  // Store
  const ceramic1 = await createCeramic(ipfs1, stateStoreDirectory)
  const stream1 = await TileDocument.create(ceramic1, { test: 456 })
  stream1.subscribe()
  await ceramic1.pin.add(stream1.id)
  expect(stream1.state.anchorStatus).toEqual(AnchorStatus.PENDING)
  const anchorService = ceramic1.context.anchorService
  await ceramic1.close()

  // Retrieve after being closed
  // Re-use the same anchor service so that the CAS state isn't lost
  const ceramic2 = await createCeramic(ipfs2, stateStoreDirectory, anchorService)

  const stream2 = await ceramic2.loadStream(stream1.id)
  stream2.subscribe()
  expect(stream2.state.anchorStatus).toEqual(AnchorStatus.PENDING)
  // stream2 is exact replica of stream1
  expectEqualStates(stream1.state, stream2.state)
  // Now CAS anchors
  await anchorUpdate(ceramic2, stream2)
  // And the stream is anchored
  expect(stream2.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
  await ceramic2.close()
})

it("Don't create new anchor request on #recoverStreams", async () => {
  const stateStoreDirectory = await tmp.tmpName()

  const ceramic1 = await createCeramic(ipfs1, stateStoreDirectory)
  const stream1 = await TileDocument.create(ceramic1, { test: 456 })
  stream1.subscribe()
  await ceramic1.pin.add(stream1.id)
  expect(stream1.state.anchorStatus).toEqual(AnchorStatus.PENDING)
  await ceramic1.close()

  // New anchor service so CAS state is lost
  const ceramic2 = await createCeramic(ipfs2, stateStoreDirectory)
  const stream2 = await ceramic2.loadStream(stream1.id)
  stream2.subscribe()
  expect(stream2.state.anchorStatus).toEqual(AnchorStatus.FAILED)
  await ceramic2.close()
})
