import { jest } from '@jest/globals'
import tmp from 'tmp-promise'
import {
  Stream,
  StreamUtils,
  StreamState,
  LoggerProvider,
  Networks,
  DiagnosticsLogger,
} from '@ceramicnetwork/common'
import { CommonTestUtils as TestUtils } from '@ceramicnetwork/common-test-utils'
import { LevelDbStore, OLD_ELP_DEFAULT_LOCATION } from '../level-db-store.js'
import { StreamStateStore } from '../stream-state-store.js'

class FakeType extends Stream {
  isReadOnly = true
  metadata = {}

  makeReadOnly() {
    throw new Error('Method not implemented.')
  }
}

const streamFromState = function (state: StreamState) {
  return new FakeType(TestUtils.runningState(state), {})
}

const describeIfV3 = process.env.CERAMIC_RECON_MODE ? describe.skip : describe

describeIfV3('LevelDB-backed StateStore', () => {
  let tmpFolder: any
  let levelStore: LevelDbStore
  let stateStore: StreamStateStore
  let logger: DiagnosticsLogger

  beforeEach(async () => {
    logger = new LoggerProvider().getDiagnosticsLogger()
    tmpFolder = await tmp.dir({ unsafeCleanup: true })
    levelStore = new LevelDbStore(logger, tmpFolder.path, 'fakeNetwork')
    stateStore = new StreamStateStore(new LoggerProvider().getDiagnosticsLogger())
    await stateStore.open(levelStore)

    // add a small delay after creating the leveldb instance before trying to use it.
    await TestUtils.delay(100)
  })

  afterEach(async () => {
    await stateStore.close()
    await levelStore.close()
    await tmpFolder.cleanup()
  })

  test('#save and #load', async () => {
    const putSpy = jest.spyOn(stateStore.store, 'put')

    const state = TestUtils.makeStreamState()
    const stream = streamFromState(state)
    await stateStore.saveFromStreamStateHolder(stream)
    const streamId = stream.id.baseID
    expect(putSpy).toBeCalledWith(streamId.toString(), StreamUtils.serializeState(state), undefined)

    const retrieved = await stateStore.load(streamId)
    expect(retrieved).toEqual(state)

    putSpy.mockRestore()
  })

  describe('#load', () => {
    test('#load not found', async () => {
      const streamID = StreamUtils.streamIdFromState(TestUtils.makeStreamState())
      const retrieved = await stateStore.load(streamID)
      expect(retrieved).toBeNull()
    })

    test('#load passes errors', async () => {
      const getSpy = jest.spyOn(stateStore.store, 'get')
      getSpy.mockImplementationOnce(() => {
        throw new Error('something internal to LevelDB')
      })
      const streamID = StreamUtils.streamIdFromState(TestUtils.makeStreamState())
      await expect(stateStore.load(streamID)).rejects.toThrow('something internal to LevelDB')

      await getSpy.mockRestore()
    })
  })

  test('#remove', async () => {
    const state = TestUtils.makeStreamState()
    const stream = streamFromState(state)
    await stateStore.saveFromStreamStateHolder(stream)
    const streamId = stream.id.baseID

    let retrieved = await stateStore.load(streamId)
    expect(retrieved).toEqual(state)

    await stateStore.remove(streamId)

    retrieved = await stateStore.load(streamId)
    expect(retrieved).toBeNull()
  })

  describe('#list', () => {
    test('saved entries', async () => {
      const states = await Promise.all([
        TestUtils.makeStreamState(),
        TestUtils.makeStreamState(),
        TestUtils.makeStreamState(),
      ])
      const streams = states.map((state) => streamFromState(state))

      let list = await stateStore.listStoredStreamIDs()
      expect(list.length).toEqual(0)

      await stateStore.saveFromStreamStateHolder(streamFromState(states[0]))

      list = await stateStore.listStoredStreamIDs()
      expect(list.length).toEqual(1)
      expect(list).toEqual([streams[0].id.toString()])

      await stateStore.saveFromStreamStateHolder(streamFromState(states[1]))
      await stateStore.saveFromStreamStateHolder(streamFromState(states[2]))

      list = await stateStore.listStoredStreamIDs()
      expect(list.length).toEqual(3)
      expect(list.sort()).toEqual(
        [streams[0].id.toString(), streams[1].id.toString(), streams[2].id.toString()].sort()
      )
    })

    test('list with limit', async () => {
      const states = await Promise.all([TestUtils.makeStreamState(), TestUtils.makeStreamState()])

      await stateStore.saveFromStreamStateHolder(streamFromState(states[0]))
      await stateStore.saveFromStreamStateHolder(streamFromState(states[1]))

      let list = await stateStore.listStoredStreamIDs()
      expect(list.length).toEqual(2)

      list = await stateStore.listStoredStreamIDs(null, 1)
      expect(list.length).toEqual(1)
    })

    test('report if streamId is saved', async () => {
      const state = TestUtils.makeStreamState()
      const streamID = StreamUtils.streamIdFromState(state)

      // Stream absent from state store
      let list = await stateStore.listStoredStreamIDs(streamID)
      expect(list).toEqual([])

      // Stream present in state store
      await stateStore.saveFromStreamStateHolder(streamFromState(state))
      list = await stateStore.listStoredStreamIDs(streamID)
      expect(list).toEqual([streamID.toString()])
    })
  })
})

describe('LevelDB-backed StateStore network change tests', () => {
  let tmpFolder: any
  let stateStore: StreamStateStore
  let logger: DiagnosticsLogger

  beforeEach(async () => {
    logger = new LoggerProvider().getDiagnosticsLogger()
    tmpFolder = await tmp.dir({ unsafeCleanup: true })
    stateStore = new StreamStateStore(logger)
  })

  afterEach(async () => {
    await tmpFolder.cleanup()
  })

  test('switch from ELP to Mainnet preserves data', async () => {
    const elpLevelStore = new LevelDbStore(logger, tmpFolder.path, OLD_ELP_DEFAULT_LOCATION)
    await stateStore.open(elpLevelStore)

    const state = TestUtils.makeStreamState()
    const stream = streamFromState(state)
    await stateStore.saveFromStreamStateHolder(stream)
    const retrievedFromElp = await stateStore.load(stream.id.baseID)
    expect(retrievedFromElp).toEqual(state)

    await stateStore.close()

    const mainnetLevelStore = new LevelDbStore(logger, tmpFolder.path, Networks.MAINNET)
    await stateStore.open(mainnetLevelStore)

    const retrievedFromMainnet = await stateStore.load(stream.id.baseID)
    expect(retrievedFromMainnet).toEqual(state)
  })

  test('switch from Clay to Mainnet does not preserve data', async () => {
    const clayLevelStore = new LevelDbStore(logger, tmpFolder.path, Networks.TESTNET_CLAY)
    await stateStore.open(clayLevelStore)

    const state = TestUtils.makeStreamState()
    const stream = streamFromState(state)
    await stateStore.saveFromStreamStateHolder(stream)
    const retrievedFromClay = await stateStore.load(stream.id.baseID)
    expect(retrievedFromClay).toEqual(state)

    await stateStore.close()

    const mainnetLevelStore = new LevelDbStore(logger, tmpFolder.path, Networks.MAINNET)
    await stateStore.open(mainnetLevelStore)

    const retrievedFromMainnet = await stateStore.load(stream.id.baseID)
    expect(retrievedFromMainnet).toEqual(null)
  })
})
