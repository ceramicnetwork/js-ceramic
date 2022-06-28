import { jest } from '@jest/globals'
import tmp from 'tmp-promise'
import { LevelStateStore } from '../level-state-store.js'
import {
  AnchorStatus,
  Stream,
  CommitType,
  SignatureStatus,
  StreamUtils,
  TestUtils,
  StreamState,
} from '@ceramicnetwork/common'

class FakeType extends Stream {
  isReadOnly = true
  makeReadOnly() {
    throw new Error('Method not implemented.')
  }
}

const makeStreamState = function (): StreamState {
  const cid = TestUtils.randomCID()
  return {
    type: 0,
    content: { num: 0 },
    metadata: {
      controllers: [''],
    },
    signature: SignatureStatus.GENESIS,
    anchorStatus: AnchorStatus.NOT_REQUESTED,
    log: [
      {
        type: CommitType.GENESIS,
        cid,
      },
    ],
  }
}

const streamFromState = function (state: StreamState) {
  return new FakeType(TestUtils.runningState(state), {})
}

describe('LevelDB state store', () => {
  let tmpFolder: any
  let stateStore: LevelStateStore

  beforeEach(async () => {
    tmpFolder = await tmp.dir({ unsafeCleanup: true })
    stateStore = new LevelStateStore(tmpFolder.path)
    stateStore.open('fakeNetwork')

    // add a small delay after creating the leveldb instance before trying to use it.
    await TestUtils.delay(100)
  })

  afterEach(async () => {
    await stateStore.close()
    await tmpFolder.cleanup()
  })

  test('#save and #load', async () => {
    const putSpy = jest.spyOn(stateStore.store, 'put')

    const state = makeStreamState()
    const stream = streamFromState(state)
    await stateStore.save(stream)
    const streamId = stream.id.baseID
    expect(putSpy).toBeCalledWith(streamId.toString(), StreamUtils.serializeState(state))

    const retrieved = await stateStore.load(streamId)
    expect(retrieved).toEqual(state)

    putSpy.mockRestore()
  })

  describe('#load', () => {
    test('#load not found', async () => {
      const streamID = StreamUtils.streamIdFromState(makeStreamState())
      const retrieved = await stateStore.load(streamID)
      expect(retrieved).toBeNull()
    })

    test('#load passes errors', async () => {
      const getSpy = jest.spyOn(stateStore.store, 'get')
      getSpy.mockImplementationOnce(() => {
        throw new Error('something internal to LevelDB')
      })
      const streamID = StreamUtils.streamIdFromState(makeStreamState())
      await expect(stateStore.load(streamID)).rejects.toThrow('something internal to LevelDB')

      await getSpy.mockRestore()
    })
  })

  test('#remove', async () => {
    const state = makeStreamState()
    const stream = streamFromState(state)
    await stateStore.save(stream)
    const streamId = stream.id.baseID

    let retrieved = await stateStore.load(streamId)
    expect(retrieved).toEqual(state)

    await stateStore.remove(streamId)

    retrieved = await stateStore.load(streamId)
    expect(retrieved).toBeNull()
  })

  describe('#list', () => {
    test('saved entries', async () => {
      const streamSpy = jest.spyOn(stateStore.store, 'stream')

      const states = await Promise.all([makeStreamState(), makeStreamState(), makeStreamState()])
      const streams = states.map((state) => streamFromState(state))

      let list = await stateStore.list()
      expect(list.length).toEqual(0)
      expect(streamSpy).toBeCalledWith({ keys: true, values: false })
      streamSpy.mockRestore()

      await stateStore.save(streamFromState(states[0]))

      list = await stateStore.list()
      expect(list.length).toEqual(1)
      expect(list).toEqual([streams[0].id.toString()])

      await stateStore.save(streamFromState(states[1]))
      await stateStore.save(streamFromState(states[2]))

      list = await stateStore.list()
      expect(list.length).toEqual(3)
      expect(list.sort()).toEqual(
        [streams[0].id.toString(), streams[1].id.toString(), streams[2].id.toString()].sort()
      )
    })

    test('list with limit', async () => {
      const states = await Promise.all([makeStreamState(), makeStreamState()])

      await stateStore.save(streamFromState(states[0]))
      await stateStore.save(streamFromState(states[1]))

      let list = await stateStore.list()
      expect(list.length).toEqual(2)

      list = await stateStore.list(null, 1)
      expect(list.length).toEqual(1)
    })

    test('report if streamId is saved', async () => {
      const state = makeStreamState()
      const streamID = StreamUtils.streamIdFromState(state)

      // Stream absent from state store
      let list = await stateStore.list(streamID)
      expect(list).toEqual([])

      // Stream present in state store
      await stateStore.save(streamFromState(state))
      list = await stateStore.list(streamID)
      expect(list).toEqual([streamID.toString()])
    })
  })
})
