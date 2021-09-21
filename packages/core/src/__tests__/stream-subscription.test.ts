import Ceramic from '../ceramic'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import tmp from 'tmp-promise'
import { StreamUtils, IpfsApi, StreamState } from '@ceramicnetwork/common'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import * as u8a from 'uint8arrays'
import { swarmConnect, withFleet } from './ipfs-util'
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'
import KeyDidResolver from 'key-did-resolver'
import { Resolver } from 'did-resolver'
import { DID } from 'dids'
import { delay } from './delay'

const seed = u8a.fromString(
  '6e34b2e1a9624113d81ece8a8a22e6e97f0e145c25c1d4d2d0e62753b4060c83',
  'base16'
)

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

const createCeramic = async (
  ipfs: IpfsApi,
  anchorOnRequest = false,
  streamCacheLimit = 100
): Promise<Ceramic> => {
  const ceramic = await Ceramic.create(ipfs, {
    stateStoreDirectory: await tmp.tmpName(),
    anchorOnRequest,
    streamCacheLimit,
    restoreStreams: false,
    pubsubTopic: '/ceramic/inmemory/test', // necessary so Ceramic instances can talk to each other
  })
  const did = makeDID(seed, ceramic)
  ceramic.did = did
  await did.authenticate()

  return ceramic
}

const INITIAL_CONTENT = { test: 'initial' }
const UPDATED_CONTENT = { test: 'updated' }

describe('Stream subscription', () => {
  jest.setTimeout(240000)

  it('can receive updates from another client on same node', async () => {
    await withFleet(1, async ([ipfs1]) => {
      const ceramic = await createCeramic(ipfs1)
      const stream = await TileDocument.create(ceramic, INITIAL_CONTENT, null, {
        anchor: false,
        publish: false,
      })

      let receivedContent
      stream.updates$.subscribe((tileSnapshot) => {
        receivedContent = tileSnapshot.content
      })

      await stream.update(UPDATED_CONTENT)

      expect(receivedContent).toEqual(UPDATED_CONTENT)

      await ceramic.close()
    })
  })

  it('can receive updates from a different node', async () => {
    await withFleet(2, async ([ipfs1, ipfs2]) => {
      await swarmConnect(ipfs2, ipfs1)

      const ceramic1 = await createCeramic(ipfs1)
      const ceramic2 = await createCeramic(ipfs2)

      const stream1 = await TileDocument.create(ceramic1, INITIAL_CONTENT, null, {
        anchor: false,
        publish: false,
      })
      const stream2 = await TileDocument.load(ceramic2, stream1.id)
      expect(stream1.content).toEqual(stream2.content)

      let receivedContent
      stream1.updates$.subscribe((tileSnapshot) => {
        receivedContent = tileSnapshot.content
      })

      await stream2.update(UPDATED_CONTENT)

      await delay(1000) // todo shouldn't be needed

      expect(receivedContent).toEqual(UPDATED_CONTENT)

      await ceramic1.close()
      await ceramic2.close()
    })
  })
})
