import { jest, expect, it, beforeEach, describe, test } from '@jest/globals'
import tmp from 'tmp-promise'
import {
  AnchorStatus,
  EventType,
  StreamState,
  IpfsApi,
  SignatureStatus,
  LoggerProvider,
  DiagnosticsLogger,
} from '@ceramicnetwork/common'
import { Utils as CoreUtils } from '@ceramicnetwork/core'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { PinStore } from '../pin-store.js'
import { PinStoreFactory } from '../pin-store-factory.js'
import { StreamID } from '@ceramicnetwork/streamid'
import { CID } from 'multiformats/cid'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { createCeramic } from '../../__tests__/create-ceramic.js'
import { RunningState } from '../../state-management/running-state.js'
import { Repository } from '../../state-management/repository.js'
import { IPLDRecordsCache } from '../ipld-records-cache.js'
import { LevelKVFactory } from '../level-kv-factory.js'
import { testIfV3 } from '@ceramicnetwork/common-test-utils'

const FAKE_CID = CID.parse('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu')

const ipfs = {
  dag: {
    get: jest.fn(),
  },
  pin: {
    add: jest.fn(),
  },
} as unknown as IpfsApi

const repository = {
  load: jest.fn(),
} as unknown as Repository

// should pass when updated from tile document

describe('Level data store', () => {
  let store: PinStore
  let logger: DiagnosticsLogger

  const streamId = new StreamID('tile', FAKE_CID)
  const streamState: StreamState = {
    type: 0,
    content: {},
    metadata: { controllers: ['foo'] },
    signature: SignatureStatus.GENESIS,
    anchorStatus: AnchorStatus.NOT_REQUESTED,
    log: [{ cid: FAKE_CID, type: EventType.INIT }],
  }

  beforeEach(async () => {
    logger = new LoggerProvider().getDiagnosticsLogger()
    const levelPath = (await tmp.dir({ unsafeCleanup: true })).path
    const storeFactory = new PinStoreFactory(
      ipfs,
      new IPLDRecordsCache(10),
      repository,
      {
        pinningEndpoints: ['ipfs+context'],
      },
      logger
    )
    const kvFactory = new LevelKVFactory(levelPath, 'inmemory', logger)
    store = storeFactory.createPinStore()
    await store.open(kvFactory)
  })

  it('pins stream correctly without IPFS pinning', async () => {
    await expect(store.stateStore.load(streamId)).resolves.toBeNull()
    const pinSpy = jest.spyOn(store.pinning, 'pin')
    await store.stateStore.saveFromStreamStateHolder({ id: streamId, state: streamState })
    expect(pinSpy).toBeCalledTimes(0)
    await expect(store.stateStore.load(streamId)).resolves.toEqual(streamState)
  })

  it('pins not anchored stream correctly with IPFS pinning', async () => {
    const state: StreamState = {
      ...streamState,
      log: [{ cid: FAKE_CID, type: EventType.INIT }],
    }
    await expect(store.stateStore.load(streamId)).resolves.toBeNull()
    const pinSpy = jest.spyOn(store.pinning, 'pin')
    await store.add(new RunningState(state, false))
    expect(pinSpy).toBeCalledWith(FAKE_CID)
    expect(pinSpy).toBeCalledTimes(1)
    await expect(store.stateStore.load(streamId)).resolves.toEqual(state)
  })

  testIfV3(
    'adds and removes pinned stream',
    async () => {
      const realIpfs = await createIPFS()
      const ceramic = await createCeramic(realIpfs)

      const stream = await TileDocument.create(ceramic, { stuff: 1 }, null, { pin: false })
      await CoreUtils.anchorUpdate(ceramic, stream)

      const pinSpy = jest.spyOn(realIpfs.pin, 'add')
      await ceramic.admin.pin.add(stream.id)
      expect(pinSpy).toBeCalledTimes(5)

      const unpinSpy = jest.spyOn(realIpfs.pin, 'rm')
      await ceramic.admin.pin.rm(stream.id)
      expect(unpinSpy).toBeCalledTimes(3) // genesis commit envelope, genesis commit payload, and anchor commit

      await ceramic.close()
      await realIpfs.stop()
    },
    20000
  )

  testIfV3(
    'list pinned streams',
    async () => {
      const realIpfs = await createIPFS()
      const ceramic = await createCeramic(realIpfs)

      const stream1 = await TileDocument.create(ceramic, { stuff: 1 }, null, {
        anchor: false,
        publish: false,
      })
      await ceramic.admin.pin.add(stream1.id)

      const stream2 = await TileDocument.create(ceramic, { stuff: 2 }, null, {
        anchor: false,
        publish: false,
      })
      await ceramic.admin.pin.add(stream2.id)

      const pinned = []
      const iterator = await ceramic.admin.pin.ls()
      for await (const id of iterator) {
        pinned.push(id)
      }

      expect(pinned.includes(stream1.id.toString())).toBeTruthy()
      expect(pinned.includes(stream2.id.toString())).toBeTruthy()

      const pinnedSingle = []
      for await (const id of await ceramic.admin.pin.ls(new StreamID('tile', FAKE_CID))) {
        pinned.push(id)
      }

      expect(pinnedSingle).toEqual([])

      await ceramic.close()
      await realIpfs.stop()
    },
    10000
  )

  it('pins in different networks', async () => {
    const levelPath = (await tmp.dir({ unsafeCleanup: true })).path
    const localKVFactory = new LevelKVFactory(levelPath, 'local', logger)
    const storeFactoryLocal = new PinStoreFactory(
      ipfs,
      new IPLDRecordsCache(10),
      repository,
      {
        pinningEndpoints: ['ipfs+context'],
      },
      new LoggerProvider().getDiagnosticsLogger()
    )
    const localStore = storeFactoryLocal.createPinStore()
    await localStore.open(localKVFactory)

    await localStore.stateStore.saveFromStreamStateHolder({ id: streamId, state: streamState })
    await expect(localStore.stateStore.load(streamId)).resolves.toEqual(streamState)

    await localStore.close()

    // Now create a net pin store for a different ceramic network
    const inmemoryKVFactory = new LevelKVFactory(levelPath, 'inmemory', logger)
    const storeFactoryInMemory = new PinStoreFactory(
      ipfs,
      new IPLDRecordsCache(10),
      repository,
      {
        pinningEndpoints: ['ipfs+context'],
      },
      new LoggerProvider().getDiagnosticsLogger()
    )
    const inMemoryStore = storeFactoryInMemory.createPinStore()
    await inMemoryStore.open(inmemoryKVFactory)

    // The new pin store shouldn't be able to see streams that were pinned on the other network
    await expect(inMemoryStore.stateStore.load(streamId)).resolves.toBeNull()
  })
})
