import { jest } from '@jest/globals'
import { Ceramic } from '../ceramic.js'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import tmp from 'tmp-promise'
import { IpfsApi, CeramicApi, SyncOptions, TestUtils } from '@ceramicnetwork/common'
import * as u8a from 'uint8arrays'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import * as ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'
import * as KeyDidResolver from 'key-did-resolver'
import { Resolver } from 'did-resolver'
import { DID } from 'dids'

const seed = u8a.fromString(
  '6e34b2e1a9624113d81ece8a8a22e6e97f0e145c25c1d4d2d0e62753b4060c83',
  'base16'
)

const mockExistsSync = jest.fn()
jest.unstable_mockModule('fs', () => {
  const originalModule = jest.requireActual('fs') as any
  return {
    ...originalModule,
    existsSync: mockExistsSync,
  }
})

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
  const { Ceramic } = await import('../ceramic.js')

  const databaseFolder = await tmp.dir({ unsafeCleanup: true })
  const connectionString = new URL(`sqlite://${databaseFolder.path}/ceramic.sqlite`)
  const ceramic = await Ceramic.create(ipfs, {
    stateStoreDirectory,
    anchorOnRequest,
    indexing: {
      db: connectionString.href,
      models: [],
    },
    pubsubTopic: '/ceramic/inmemory/test', // necessary so Ceramic instances can talk to each other
  })
  ceramic.did = makeDID(seed, ceramic)
  await ceramic.did.authenticate()

  return ceramic
}

async function createDeterministicStream(
  ceramic: CeramicApi,
  controller: string,
  family: string,
  pin: boolean
): Promise<TileDocument> {
  return TileDocument.create(
    ceramic,
    null,
    { deterministic: true, controllers: [controller], family },
    { anchor: false, publish: false, pin, sync: SyncOptions.NEVER_SYNC }
  )
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
    jest.resetAllMocks()
    jest.restoreAllMocks()
    await ipfs1.stop()
    await tmpFolder.cleanup()
  })

  it('Stream not pinned will not retain data on restart', async () => {
    let ceramic = await createCeramic(ipfs1, tmpFolder.path)
    const stream1 = await createDeterministicStream(ceramic, ceramic.did.id, 'test', false)
    const content = { some: 'data' }
    await stream1.update(content)
    expect(stream1.content).toEqual(content)
    await ceramic.close()

    ceramic = await createCeramic(ipfs1, tmpFolder.path)
    const stream2 = await createDeterministicStream(ceramic, ceramic.did.id, 'test', false)
    expect(stream2.content).not.toEqual(content)
    await ceramic.close()
  })

  it('Stream pinned will retain data on restart', async () => {
    let ceramic = await createCeramic(ipfs1, tmpFolder.path)
    const stream1 = await createDeterministicStream(ceramic, ceramic.did.id, 'test', true)
    await expect(TestUtils.isPinned(ceramic, stream1.id)).resolves.toBeTruthy()
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
    const stream1 = await createDeterministicStream(ceramic, ceramic.did.id, 'test', true)
    const content = { some: 'data' }
    await stream1.update(content)
    expect(stream1.content).toEqual(content)
    await ceramic.close()

    ceramic = await createCeramic(ipfs1, tmpFolder.path)
    const stream2 = await createDeterministicStream(ceramic, ceramic.did.id, 'test', true)
    expect(stream2.content).toEqual(content)
    await ceramic.close()
  })

  it('Node detects if ipfs data is lost', async () => {
    const content0 = { foo: 'bar' }
    const content1 = { foo: 'baz' }
    const ceramic = await createCeramic(ipfs1, tmpFolder.path)
    const stream = await TileDocument.create(ceramic, content0, null, {
      pin: true,
      anchor: false,
      publish: false,
    })
    await stream.update(content1)
    expect(stream.content).toEqual(content1)
    await ceramic.close()

    //.jsipfs repo does not exist
    mockExistsSync.mockReturnValue(false)

    // Re-create the ipfs node with a clean repo, losing all the pinned ipfs data, but preserving
    // the state store data for the Ceramic node.
    await ipfs1.stop()
    ipfs1 = await createIPFS()

    // Starting up the Ceramic node should fail as it detects that the IPFS commit data is missing.
    await expect(createCeramic(ipfs1, tmpFolder.path)).rejects.toThrow(/IPFS data missing/)
  })

  it('Node detects if ipfs data is lost and ~/.jsipfs directory exists', async () => {
    const content0 = { foo: 'bar' }
    const content1 = { foo: 'baz' }
    const ceramic = await createCeramic(ipfs1, tmpFolder.path)
    const stream = await TileDocument.create(ceramic, content0, null, {
      pin: true,
      anchor: false,
      publish: false,
    })
    await stream.update(content1)
    expect(stream.content).toEqual(content1)
    await ceramic.close()

    //.jsipfs repo exists
    mockExistsSync.mockReturnValue(true)

    // Re-create the ipfs node with a clean repo, losing all the pinned ipfs data, but preserving
    // the state store data for the Ceramic node.
    await ipfs1.stop()
    ipfs1 = await createIPFS()

    // Starting up the Ceramic node should fail as it detects that the IPFS commit data is missing.
    await expect(createCeramic(ipfs1, tmpFolder.path)).rejects.toThrow(
      /.jsipfs directory has been detected/
    )
  })

  it('Stream is pinned by default', async () => {
    const ceramic = await createCeramic(ipfs1, tmpFolder.path)
    const stream = await TileDocument.create(ceramic, { foo: 'bar' }, null, {
      anchor: false,
      publish: false,
    })
    await expect(TestUtils.isPinned(ceramic, stream.id)).resolves.toBeTruthy()

    await ceramic.close()
  })

  it('Stream can be created without pinning', async () => {
    const ceramic = await createCeramic(ipfs1, tmpFolder.path)
    const stream = await TileDocument.create(ceramic, { foo: 'bar' }, null, {
      anchor: false,
      publish: false,
      pin: false,
    })
    await expect(TestUtils.isPinned(ceramic, stream.id)).resolves.toBeFalsy()

    await ceramic.close()
  })

  it('Updating stream does not pin by default', async () => {
    const ceramic = await createCeramic(ipfs1, tmpFolder.path)
    const stream = await TileDocument.create(ceramic, { foo: 'bar' }, null, {
      anchor: false,
      publish: false,
      pin: false,
    })
    await stream.update({ foo: 'baz' })
    await expect(TestUtils.isPinned(ceramic, stream.id)).resolves.toBeFalsy()

    await ceramic.close()
  })

  it('Update preserves existing pin state by default', async () => {
    const ceramic = await createCeramic(ipfs1, tmpFolder.path)
    const stream = await TileDocument.create(ceramic, { foo: 'bar' }, null, {
      anchor: false,
      publish: false,
    })
    await expect(TestUtils.isPinned(ceramic, stream.id)).resolves.toBeTruthy()
    await stream.update({ foo: 'baz' }, null, { anchor: false, publish: false })
    await expect(TestUtils.isPinned(ceramic, stream.id)).resolves.toBeTruthy()
    await ceramic.pin.rm(stream.id, { publish: false })
    await expect(TestUtils.isPinned(ceramic, stream.id)).resolves.toBeFalsy()
    await stream.update({ foo: 'foobarbaz' })
    await expect(TestUtils.isPinned(ceramic, stream.id)).resolves.toBeFalsy()
    await ceramic.close()
  })

  it('Stream can be pinned and unpinned on update', async () => {
    const ceramic = await createCeramic(ipfs1, tmpFolder.path)
    const stream = await TileDocument.create(ceramic, { foo: 'bar' }, null, {
      anchor: false,
      publish: false,
      pin: false,
    })
    await expect(TestUtils.isPinned(ceramic, stream.id)).resolves.toBeFalsy()
    await stream.update({ foo: 'baz' }, null, { anchor: false, publish: false, pin: true })
    await expect(TestUtils.isPinned(ceramic, stream.id)).resolves.toBeTruthy()
    await stream.update({ foo: 'foobarbaz' }, null, { anchor: false, publish: false, pin: false })
    await expect(TestUtils.isPinned(ceramic, stream.id)).resolves.toBeFalsy()
    await ceramic.close()
  })

  it('Load preserves existing pin state by default', async () => {
    const ceramic = await createCeramic(ipfs1, tmpFolder.path)
    const stream = await TileDocument.create(ceramic, { foo: 'bar' }, null, {
      anchor: false,
      publish: false,
    })
    await expect(TestUtils.isPinned(ceramic, stream.id)).resolves.toBeTruthy()
    await TileDocument.load(ceramic, stream.id)
    await expect(TestUtils.isPinned(ceramic, stream.id)).resolves.toBeTruthy()
    await ceramic.pin.rm(stream.id, { publish: false })
    await expect(TestUtils.isPinned(ceramic, stream.id)).resolves.toBeFalsy()
    await TileDocument.load(ceramic, stream.id, { sync: SyncOptions.NEVER_SYNC })
    await expect(TestUtils.isPinned(ceramic, stream.id)).resolves.toBeFalsy()

    await ceramic.close()
  })

  it('Stream can be pinned and unpinned on load', async () => {
    const ceramic = await createCeramic(ipfs1, tmpFolder.path)
    const stream = await TileDocument.create(ceramic, { foo: 'bar' }, null, {
      anchor: false,
      publish: false,
      pin: false,
    })
    await expect(TestUtils.isPinned(ceramic, stream.id)).resolves.toBeFalsy()
    await TileDocument.load(ceramic, stream.id, { sync: SyncOptions.NEVER_SYNC, pin: true })
    await expect(TestUtils.isPinned(ceramic, stream.id)).resolves.toBeTruthy()
    await TileDocument.load(ceramic, stream.id, { sync: SyncOptions.NEVER_SYNC, pin: false })
    await expect(TestUtils.isPinned(ceramic, stream.id)).resolves.toBeFalsy()

    await ceramic.close()
  })

  it('Unpin command does not publish tip by default', async () => {
    const ceramic = await createCeramic(ipfs1, tmpFolder.path)
    const publishTipSpy = jest.spyOn(ceramic.dispatcher, 'publishTip')
    const stream = await TileDocument.create(ceramic, { foo: 'bar' }, null, {
      anchor: false,
      publish: false,
    })
    await ceramic.pin.add(stream.id)
    await stream.update({ foo: 'baz' }, null, { anchor: false, publish: false })

    expect(publishTipSpy).toBeCalledTimes(0)
    await ceramic.pin.rm(stream.id)
    expect(publishTipSpy).toBeCalledTimes(0)

    await ceramic.close()
  })

  it('Unpin command can be made to publish tip', async () => {
    const ceramic = await createCeramic(ipfs1, tmpFolder.path)
    const publishTipSpy = jest.spyOn(ceramic.dispatcher, 'publishTip')
    const stream = await TileDocument.create(ceramic, { foo: 'bar' }, null, {
      anchor: false,
      publish: false,
      pin: false,
    })
    await ceramic.pin.add(stream.id)
    await stream.update({ foo: 'baz' }, null, { anchor: false, publish: false })

    expect(publishTipSpy).toBeCalledTimes(0)

    await ceramic.pin.rm(stream.id, { publish: true })

    expect(publishTipSpy).toBeCalledTimes(1)

    await ceramic.close()
  })

  it('Double pin', async () => {
    const ceramic = await createCeramic(ipfs1, tmpFolder.path)
    const stream = await TileDocument.create(ceramic, { foo: 'bar' }, null, {
      anchor: false,
      publish: false,
      pin: false,
    })
    const pinSpy = jest.spyOn(ipfs1.pin, 'add')
    const saveStateSpy = jest.spyOn(ceramic.repository.pinStore.stateStore, 'save')
    await ceramic.pin.add(stream.id)

    // 2 CIDs pinned for the one genesis commit (signed envelope + payload)
    expect(pinSpy).toBeCalledTimes(2)
    expect(saveStateSpy).toBeCalledTimes(1)

    // Pin a second time, shouldn't cause any more calls to ipfs.pin.add
    await ceramic.pin.add(stream.id)
    expect(pinSpy).toBeCalledTimes(2)
    expect(saveStateSpy).toBeCalledTimes(1)

    // Now force re-pin and make sure underlying state and ipfs records get re-pinned
    await ceramic.pin.add(stream.id, true)
    expect(pinSpy).toBeCalledTimes(4)
    expect(saveStateSpy).toBeCalledTimes(2)

    await ceramic.close()
  })

  it('only pin new commits', async () => {
    const ceramic = await createCeramic(ipfs1, tmpFolder.path)
    const stream = await TileDocument.create(ceramic, { foo: 'bar' }, null, {
      anchor: false,
      publish: false,
      pin: false,
    })
    const pinSpy = jest.spyOn(ipfs1.pin, 'add')
    const saveStateSpy = jest.spyOn(ceramic.repository.pinStore.stateStore, 'save')
    await ceramic.pin.add(stream.id)

    // 2 CIDs pinned for the one genesis commit (signed envelope + payload)
    expect(pinSpy).toBeCalledTimes(2)
    expect(saveStateSpy).toBeCalledTimes(1)

    // Doing an update to a pinned stream automatically re-pins it, but only pins the new CIDs
    await stream.update({ foo: 'baz' })
    expect(pinSpy).toBeCalledTimes(4)
    expect(saveStateSpy).toBeCalledTimes(2)

    await ceramic.close()
  })

  it('re-pin after unpin', async () => {
    const ceramic = await createCeramic(ipfs1, tmpFolder.path)
    const stream = await TileDocument.create(ceramic, { foo: 'bar' }, null, {
      anchor: false,
      publish: false,
      pin: false,
    })
    const pinSpy = jest.spyOn(ipfs1.pin, 'add')
    const unpinSpy = jest.spyOn(ipfs1.pin, 'rm')
    const saveStateSpy = jest.spyOn(ceramic.repository.pinStore.stateStore, 'save')
    const removeStateSpy = jest.spyOn(ceramic.repository.pinStore.stateStore, 'remove')

    // Pin stream
    await ceramic.pin.add(stream.id)
    expect(pinSpy).toBeCalledTimes(2)
    expect(saveStateSpy).toBeCalledTimes(1)

    // Unpin
    await ceramic.pin.rm(stream.id)
    expect(unpinSpy).toBeCalledTimes(2)
    expect(removeStateSpy).toBeCalledTimes(1)

    // re-pin
    await ceramic.pin.add(stream.id)
    expect(pinSpy).toBeCalledTimes(4)
    expect(saveStateSpy).toBeCalledTimes(2)

    await ceramic.close()
  })
})
