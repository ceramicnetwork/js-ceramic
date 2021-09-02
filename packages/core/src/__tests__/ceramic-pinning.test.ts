import Ceramic from '../ceramic'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import tmp from 'tmp-promise'
import { IpfsApi, CeramicApi, SyncOptions } from '@ceramicnetwork/common'
import * as u8a from 'uint8arrays'
import { createIPFS } from './ipfs-util'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'
import KeyDidResolver from 'key-did-resolver'
import { Resolver } from 'did-resolver'
import { DID } from 'dids'
import { StreamID } from '@ceramicnetwork/streamid'
import first from 'it-first'

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
  stateStoreDirectory,
  anchorOnRequest = false
): Promise<Ceramic> => {
  const ceramic = await Ceramic.create(ipfs, {
    stateStoreDirectory,
    anchorOnRequest,
    pubsubTopic: '/ceramic/inmemory/test', // necessary so Ceramic instances can talk to each other
  })
  await ceramic.setDID(makeDID(seed, ceramic))
  await ceramic.did.authenticate()

  return ceramic
}

async function createStream(
  ceramic: CeramicApi,
  controller: string,
  family: string
): Promise<TileDocument> {
  return TileDocument.create(
    ceramic,
    null,
    { deterministic: true, controllers: [controller], family },
    { anchor: false, publish: false, sync: SyncOptions.NEVER_SYNC }
  )
}

async function isPinned(ceramic: CeramicApi, streamId: StreamID): Promise<boolean> {
  const iterator = await ceramic.pin.ls(streamId)
  return (await first(iterator)) == streamId.toString()
}

describe('Ceramic stream pinning', () => {
  jest.setTimeout(60000)
  let ipfs1: IpfsApi
  let tmpFolder: any

  beforeEach(async () => {
    tmpFolder = await tmp.dir({ unsafeCleanup: true })
    ipfs1 = await createIPFS()
  })

  afterEach(async () => {
    await ipfs1.stop(() => console.log('IPFS1 stopped'))
    await tmpFolder.cleanup()
  })

  it('Stream not pinned will not retain data on restart', async () => {
    let ceramic = await createCeramic(ipfs1, tmpFolder.path)
    const stream1 = await createStream(ceramic, ceramic.did.id, 'test')
    const content = { some: 'data' }
    await stream1.update(content)
    expect(stream1.content).toEqual(content)
    await ceramic.close()

    ceramic = await createCeramic(ipfs1, tmpFolder.path)
    const stream2 = await createStream(ceramic, ceramic.did.id, 'test')
    expect(stream2.content).not.toEqual(content)
    await ceramic.close()
  })

  it('Stream pinned will retain data on restart', async () => {
    let ceramic = await createCeramic(ipfs1, tmpFolder.path)
    const stream1 = await createStream(ceramic, ceramic.did.id, 'test')
    await ceramic.pin.add(stream1.id)
    await expect(isPinned(ceramic, stream1.id)).resolves.toBeTruthy()
    const content = { some: 'data' }
    await stream1.update(content)
    expect(stream1.content).toEqual(content)
    await ceramic.close()

    ceramic = await createCeramic(ipfs1, tmpFolder.path)
    const stream2 = await ceramic.loadStream(stream1.id)
    expect(stream2.content).toEqual(content)
    await ceramic.close()
  })

  it('Stream pinned will retain data on restart, load though create', async () => {
    let ceramic = await createCeramic(ipfs1, tmpFolder.path)
    const stream1 = await createStream(ceramic, ceramic.did.id, 'test')
    await ceramic.pin.add(stream1.id)
    const content = { some: 'data' }
    await stream1.update(content)
    expect(stream1.content).toEqual(content)
    await ceramic.close()

    ceramic = await createCeramic(ipfs1, tmpFolder.path)
    const stream2 = await createStream(ceramic, ceramic.did.id, 'test')
    expect(stream2.content).toEqual(content)
    await ceramic.close()
  })

  it('Stream can be pinned on creation', async () => {
    const ceramic = await createCeramic(ipfs1, tmpFolder.path)
    const stream = await TileDocument.create(ceramic, { foo: 'bar' }, null, {
      anchor: false,
      publish: false,
      pin: true,
    })
    await expect(isPinned(ceramic, stream.id)).resolves.toBeTruthy()

    await ceramic.close()
  })

  it('Stream can be pinned and unpinned on update', async () => {
    const ceramic = await createCeramic(ipfs1, tmpFolder.path)
    const stream = await TileDocument.create(ceramic, { foo: 'bar' }, null, {
      anchor: false,
      publish: false,
    })
    await expect(isPinned(ceramic, stream.id)).resolves.toBeFalsy()
    await stream.update({ foo: 'baz' }, null, { anchor: false, publish: false, pin: true })
    await expect(isPinned(ceramic, stream.id)).resolves.toBeTruthy()
    await stream.update({ foo: 'foobarbaz' }, null, { anchor: false, publish: false, pin: false })
    await expect(isPinned(ceramic, stream.id)).resolves.toBeFalsy()

    await ceramic.close()
  })

  it('Stream can be pinned and unpinned on load', async () => {
    const ceramic = await createCeramic(ipfs1, tmpFolder.path)
    const stream = await TileDocument.create(ceramic, { foo: 'bar' }, null, {
      anchor: false,
      publish: false,
    })
    await expect(isPinned(ceramic, stream.id)).resolves.toBeFalsy()
    await TileDocument.load(ceramic, stream.id, { sync: SyncOptions.NEVER_SYNC, pin: true })
    await expect(isPinned(ceramic, stream.id)).resolves.toBeTruthy()
    await TileDocument.load(ceramic, stream.id, { sync: SyncOptions.NEVER_SYNC, pin: false })
    await expect(isPinned(ceramic, stream.id)).resolves.toBeFalsy()

    await ceramic.close()
  })
})
