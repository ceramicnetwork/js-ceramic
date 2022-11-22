import { jest } from '@jest/globals'
import { CID } from 'multiformats/cid'
import { PinStore } from '../pin-store.js'
import {
  AnchorStatus,
  SignatureStatus,
  Stream,
  PinningBackend,
  StreamState,
  CommitType,
  TestUtils,
  JSONToBase64Url,
  StreamUtils,
} from '@ceramicnetwork/common'
import { RunningState } from '../../state-management/running-state.js'
import { StreamID } from '@ceramicnetwork/streamid'
import cloneDeep from 'lodash.clonedeep'
import { IKVStore } from '../ikv-store.js'
import { StreamStateStore } from '../stream-state-store.js'

let stateStore: StreamStateStore
let storeWrapperTemplate: IKVStore
let pinning: PinningBackend
const NETWORK = 'fakeNetwork'

const FAKE_STREAM_ID = StreamID.fromString(
  'kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s'
)

beforeEach(() => {
  storeWrapperTemplate = {
    init: jest.fn(),
    close: jest.fn(),
    isEmpty: jest.fn(),
    find: jest.fn(),
    put: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  }

  stateStore = {
    open: jest.fn(),
    close: jest.fn(),
    list: jest.fn(),
    remove: jest.fn(),
    saveFromStreamStateHolder: jest.fn(),
    load: jest.fn(),
  }
  pinning = {
    id: 'test',
    open: jest.fn(),
    close: jest.fn(),
    pin: jest.fn(),
    unpin: jest.fn(),
    ls: jest.fn(),
    info: jest.fn(),
  }
})

const state: StreamState = {
  type: 0,
  content: { num: 0 },
  metadata: {
    controllers: [''],
  },
  signature: SignatureStatus.GENESIS,
  anchorStatus: AnchorStatus.NOT_REQUESTED,
  log: [
    { cid: CID.parse('QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D'), type: CommitType.GENESIS },
  ],
}

class FakeType extends Stream {
  isReadOnly = true
  makeReadOnly() {
    throw new Error('Method not implemented.')
  }
}

test('#open', async () => {
  const pinStore = new PinStore(stateStore, pinning, jest.fn(), jest.fn(), jest.fn())
  const storeWrapper = {
    networkName: NETWORK,
    ...storeWrapperTemplate
  }
  await pinStore.open(storeWrapper)
  expect(stateStore.open).toBeCalledWith(storeWrapper)
  expect(pinning.open).toBeCalled()
})

test('#close', async () => {
  const pinStore = new PinStore(stateStore, pinning, jest.fn(), jest.fn(), jest.fn())
  await pinStore.close()
  expect(stateStore.close).toBeCalled()
  expect(pinning.close).toBeCalled()
})

describe('#add', () => {
  test('save and pin unsigned genesis', async () => {
    const pinStore = new PinStore(stateStore, pinning, jest.fn(), jest.fn(), jest.fn())
    const runningState = new RunningState(state, false)
    const runningStateSpy = jest.spyOn(runningState, 'markAsPinned')
    await pinStore.add(runningState)
    expect(stateStore.saveFromStreamStateHolder).toBeCalledWith(runningState)
    expect(pinning.pin).toBeCalledTimes(1)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(pinning.pin.mock.calls[0][0].toString()).toEqual(state.log[0].cid.toString())
    expect(runningStateSpy).toBeCalledTimes(1)
    expect(runningState.pinnedCommits).toEqual(new Set(state.log.map(({ cid }) => cid.toString())))
  })

  test('pin signed commit payloads and capabilities', async () => {
    const stateWithSignedCommit = Object.assign({}, state, {
      log: [
        { cid: CID.parse('QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D') },
        { cid: CID.parse('QmdmQXB2mzChmMeKY47C43LxUdg1NDJ5MWcKMKxDu7RgQm') },
      ],
    })
    const linkCID = CID.parse('QmbQDovX7wRe9ek7u6QXe9zgCXkTzoUSsTFJEkrYV1HrVR')
    const capCID = CID.parse('QmdC5Hav9zdn2iS75reafXBq1PH4EnqUmoxwoxkS5QtuME')
    const protectedHeaderJSON = { cap: `ipfs://${capCID.toString()}` }
    const encodedProtectedHeader = JSONToBase64Url(protectedHeaderJSON)
    const retrieve = jest.fn(async (cid: CID) => {
      if (cid.equals(stateWithSignedCommit.log[1].cid)) {
        return {
          link: linkCID,
          signatures: [{ protected: encodedProtectedHeader }],
        }
      }
    })

    const pinStore = new PinStore(stateStore, pinning, retrieve, jest.fn(), jest.fn())
    const runningState = new RunningState(stateWithSignedCommit, false)
    const runningStateSpy = jest.spyOn(runningState, 'markAsPinned')
    await pinStore.add(runningState)
    expect(stateStore.saveFromStreamStateHolder).toBeCalledWith(runningState)
    expect(pinning.pin).toBeCalledTimes(4)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(pinning.pin.mock.calls[0][0].toString()).toEqual(
      stateWithSignedCommit.log[0].cid.toString()
    )
    expect(pinning.pin.mock.calls[1][0].toString()).toEqual(
      stateWithSignedCommit.log[1].cid.toString()
    )
    expect(pinning.pin.mock.calls[2][0].toString()).toEqual(capCID.toString())
    expect(pinning.pin.mock.calls[3][0].toString()).toEqual(linkCID.toString())
    expect(runningStateSpy).toBeCalledTimes(1)
    expect(runningState.pinnedCommits).toEqual(
      new Set(stateWithSignedCommit.log.map(({ cid }) => cid.toString()))
    )
  })

  test('save and pin proof without path', async () => {
    const stateWithProof = Object.assign({}, state, {
      log: [
        { cid: CID.parse('QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D') },
        { cid: CID.parse('QmdmQXB2mzChmMeKY47C43LxUdg1NDJ5MWcKMKxDu7RgQm') },
      ],
    })
    const proofCID = CID.parse('QmbQDovX7wRe9ek7u6QXe9zgCXkTzoUSsTFJEkrYV1HrVR')
    const proofRootCID = CID.parse('QmNPqfxJDLPJFMhkUexLv431HNTfQBqh45unLg8ByBfa7h')
    const retrieve = jest.fn(async (cid: CID) => {
      if (cid.equals(stateWithProof.log[1].cid)) {
        return {
          proof: proofCID,
        }
      }
    })
    const resolve = jest.fn(async (query: string) => {
      if (query === `${proofCID}/root`) {
        return proofRootCID
      }
    })
    const pinStore = new PinStore(stateStore, pinning, retrieve, resolve, jest.fn())
    const runningState = new RunningState(stateWithProof, false)
    const runningStateSpy = jest.spyOn(runningState, 'markAsPinned')
    await pinStore.add(runningState)
    expect(stateStore.saveFromStreamStateHolder).toBeCalledWith(runningState)
    expect(pinning.pin).toBeCalledTimes(4)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const pinMock = pinning.pin.mock
    expect(pinMock.calls[0][0].toString()).toEqual(stateWithProof.log[0].cid.toString())
    expect(pinMock.calls[1][0].toString()).toEqual(stateWithProof.log[1].cid.toString())
    expect(pinMock.calls[2][0].toString()).toEqual(proofCID.toString())
    expect(pinMock.calls[3][0].toString()).toEqual(proofRootCID.toString())
    expect(runningStateSpy).toBeCalledTimes(1)
    expect(runningState.pinnedCommits).toEqual(
      new Set(stateWithProof.log.map(({ cid }) => cid.toString()))
    )
  })

  test('save and pin proof with path', async () => {
    const stateWithProof = Object.assign({}, state, {
      log: [
        { cid: CID.parse('QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D') },
        { cid: CID.parse('QmdmQXB2mzChmMeKY47C43LxUdg1NDJ5MWcKMKxDu7RgQm') },
      ],
    })
    const proofCID = CID.parse('QmbQDovX7wRe9ek7u6QXe9zgCXkTzoUSsTFJEkrYV1HrVR')
    const leftCID = CID.parse('QmdC5Hav9zdn2iS75reafXBq1PH4EnqUmoxwoxkS5QtuME')
    const rightCID = CID.parse('QmcyyLvDzCrduuvGVUQEh1DzFvM7UWGfc9sUg87PjjYCw7')
    const proofRootCID = CID.parse('QmNPqfxJDLPJFMhkUexLv431HNTfQBqh45unLg8ByBfa7h')
    const retrieve = jest.fn(async (cid: CID) => {
      if (cid.equals(stateWithProof.log[1].cid)) {
        return {
          proof: proofCID,
          path: 'L/R',
        }
      }
    })
    const resolve = jest.fn(async (query: string) => {
      if (query === `${proofCID}/root`) {
        return proofRootCID
      } else if (query === `${proofCID}/root/L`) {
        return leftCID
      } else if (query === `${proofCID}/root/L/R`) {
        return rightCID
      }
    })
    const pinStore = new PinStore(stateStore, pinning, retrieve, resolve, jest.fn())
    const runningState = new RunningState(stateWithProof, false)
    const runningStateSpy = jest.spyOn(runningState, 'markAsPinned')
    await pinStore.add(runningState)
    expect(stateStore.saveFromStreamStateHolder).toBeCalledWith(runningState)
    expect(pinning.pin).toBeCalledTimes(6)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const pinMock = pinning.pin.mock
    expect(pinMock.calls[0][0].toString()).toEqual(stateWithProof.log[0].cid.toString())
    expect(pinMock.calls[1][0].toString()).toEqual(stateWithProof.log[1].cid.toString())
    expect(pinMock.calls[2][0].toString()).toEqual(proofCID.toString())
    expect(pinMock.calls[3][0].toString()).toEqual(proofRootCID.toString())
    expect(pinMock.calls[4][0].toString()).toEqual(leftCID.toString())
    expect(pinMock.calls[5][0].toString()).toEqual(rightCID.toString())
    expect(runningStateSpy).toBeCalledTimes(1)
    expect(runningState.pinnedCommits).toEqual(
      new Set(stateWithProof.log.map(({ cid }) => cid.toString()))
    )
  })

  test('save and pin only new commits', async () => {
    const pinStore = new PinStore(stateStore, pinning, jest.fn(), jest.fn(), jest.fn())
    const toBeUpdatedState = Object.assign({}, state)
    const runningState = new RunningState(toBeUpdatedState, true)
    const runningStateSpy = jest.spyOn(runningState, 'markAsPinned')
    Object.assign(toBeUpdatedState, {
      log: [
        { cid: CID.parse('QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D') },
        { cid: CID.parse('QmdmQXB2mzChmMeKY47C43LxUdg1NDJ5MWcKMKxDu7RgQm') },
        { cid: CID.parse('QmbQDovX7wRe9ek7u6QXe9zgCXkTzoUSsTFJEkrYV1HrVR') },
      ],
    })
    await pinStore.add(runningState)
    expect(stateStore.saveFromStreamStateHolder).toBeCalledWith(runningState)
    expect(pinning.pin).toBeCalledTimes(2)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const pinMock = pinning.pin.mock
    expect(pinMock.calls[0][0].toString()).toEqual(toBeUpdatedState.log[1].cid.toString())
    expect(pinMock.calls[1][0].toString()).toEqual(toBeUpdatedState.log[2].cid.toString())
    expect(runningStateSpy).toBeCalledTimes(1)
    expect(runningState.pinnedCommits).toEqual(
      new Set(toBeUpdatedState.log.map(({ cid }) => cid.toString()))
    )
  })

  test('save and pin all commits using force', async () => {
    const pinStore = new PinStore(stateStore, pinning, jest.fn(), jest.fn(), jest.fn())
    const toBeUpdatedState = Object.assign({}, state)
    const runningState = new RunningState(toBeUpdatedState, true)
    const runningStateSpy = jest.spyOn(runningState, 'markAsPinned')
    Object.assign(toBeUpdatedState, {
      log: [
        { cid: CID.parse('QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D') },
        { cid: CID.parse('QmdmQXB2mzChmMeKY47C43LxUdg1NDJ5MWcKMKxDu7RgQm') },
        { cid: CID.parse('QmbQDovX7wRe9ek7u6QXe9zgCXkTzoUSsTFJEkrYV1HrVR') },
      ],
    })
    await pinStore.add(runningState, true)
    expect(stateStore.saveFromStreamStateHolder).toBeCalledWith(runningState)
    expect(pinning.pin).toBeCalledTimes(3)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const pinMock = pinning.pin.mock
    expect(pinMock.calls[0][0].toString()).toEqual(toBeUpdatedState.log[0].cid.toString())
    expect(pinMock.calls[1][0].toString()).toEqual(toBeUpdatedState.log[1].cid.toString())
    expect(pinMock.calls[2][0].toString()).toEqual(toBeUpdatedState.log[2].cid.toString())
    expect(runningStateSpy).toBeCalledTimes(1)
    expect(runningState.pinnedCommits).toEqual(
      new Set(toBeUpdatedState.log.map(({ cid }) => cid.toString()))
    )
  })

  test('pinning stream with model pins the model too', async () => {
    const modelState = cloneDeep(state)
    const modelRunningState = { state: modelState, markAsPinned: jest.fn() }
    const midState = cloneDeep(state)
    midState.metadata.model = FAKE_STREAM_ID
    midState.log[0].cid = CID.parse('QmdmQXB2mzChmMeKY47C43LxUdg1NDJ5MWcKMKxDu7RgQm')

    const loadStream = jest.fn(async (streamID: StreamID) => {
      if (streamID.equals(FAKE_STREAM_ID)) {
        return Promise.resolve(modelRunningState)
      }
    })

    const pinStore = new PinStore(stateStore, pinning, jest.fn(), jest.fn(), loadStream)
    const runningState = new RunningState(midState, false)
    const runningStateSpy = jest.spyOn(runningState, 'markAsPinned')
    await pinStore.add(runningState)
    expect(stateStore.saveFromStreamStateHolder).toBeCalledTimes(2)
    expect(stateStore.saveFromStreamStateHolder.mock.calls[0][0]).toEqual(runningState)
    expect(stateStore.saveFromStreamStateHolder.mock.calls[1][0]).toEqual(modelRunningState)
    expect(pinning.pin).toBeCalledTimes(2)
    expect(pinning.pin.mock.calls[0][0].toString()).toEqual(midState.log[0].cid.toString())
    expect(pinning.pin.mock.calls[1][0].toString()).toEqual(modelState.log[0].cid.toString())
    expect(runningStateSpy).toBeCalledTimes(1)
    expect(modelRunningState.markAsPinned).toBeCalledTimes(1)
    expect(runningState.pinnedCommits).toEqual(
      new Set(midState.log.map(({ cid }) => cid.toString()))
    )
  })
})

describe('#rm', () => {
  test('basic rm', async () => {
    const pinStore = new PinStore(stateStore, pinning, jest.fn(), jest.fn(), jest.fn())
    const runningState = new RunningState(state, true)
    const runningStateSpy = jest.spyOn(runningState, 'markAsUnpinned')
    await pinStore.rm(runningState)
    expect(stateStore.remove).toBeCalledWith(StreamUtils.streamIdFromState(state))
    expect(pinning.unpin).toBeCalledWith(state.log[0].cid)
    expect(runningStateSpy).toBeCalledTimes(1)
  })

  test('rm signed commit payloads', async () => {
    const stateWithSignedCommit = Object.assign({}, state, {
      log: [
        { cid: CID.parse('QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D') },
        { cid: CID.parse('QmdmQXB2mzChmMeKY47C43LxUdg1NDJ5MWcKMKxDu7RgQm') },
      ],
    })
    const linkCID = CID.parse('QmbQDovX7wRe9ek7u6QXe9zgCXkTzoUSsTFJEkrYV1HrVR')
    const capCID = CID.parse('QmdC5Hav9zdn2iS75reafXBq1PH4EnqUmoxwoxkS5QtuME')
    const protectedHeaderJSON = { cap: `ipfs://${capCID.toString()}` }
    const encodedProtectedHeader = JSONToBase64Url(protectedHeaderJSON)
    const retrieve = jest.fn(async (cid: CID) => {
      if (cid.equals(stateWithSignedCommit.log[1].cid)) {
        return {
          link: linkCID,
          signatures: [{ protected: encodedProtectedHeader }],
        }
      }
    })

    const pinStore = new PinStore(stateStore, pinning, retrieve, jest.fn(), jest.fn())
    const runningState = new RunningState(stateWithSignedCommit, true)
    const runningStateSpy = jest.spyOn(runningState, 'markAsUnpinned')
    await pinStore.rm(runningState)
    expect(stateStore.remove).toBeCalledWith(StreamUtils.streamIdFromState(stateWithSignedCommit))
    expect(runningStateSpy).toBeCalledTimes(1)
    expect(pinning.unpin).toBeCalledTimes(3) // unsigned genesis commit, signed update commit, plus signed commit payload
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(pinning.unpin.mock.calls[0][0].toString()).toEqual(
      stateWithSignedCommit.log[0].cid.toString()
    )
    expect(pinning.unpin.mock.calls[1][0].toString()).toEqual(
      stateWithSignedCommit.log[1].cid.toString()
    )
    expect(pinning.unpin.mock.calls[2][0].toString()).toEqual(linkCID.toString())
    expect(runningState.pinnedCommits).toBeNull()
  })

  test('dont rm anchor proofs', async () => {
    const stateWithProof = Object.assign({}, state, {
      log: [
        { cid: CID.parse('QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D') },
        { cid: CID.parse('QmdmQXB2mzChmMeKY47C43LxUdg1NDJ5MWcKMKxDu7RgQm') },
      ],
    })
    const proofCID = CID.parse('QmbQDovX7wRe9ek7u6QXe9zgCXkTzoUSsTFJEkrYV1HrVR')
    const leftCID = CID.parse('QmdC5Hav9zdn2iS75reafXBq1PH4EnqUmoxwoxkS5QtuME')
    const rightCID = CID.parse('QmcyyLvDzCrduuvGVUQEh1DzFvM7UWGfc9sUg87PjjYCw7')
    const proofRootCID = CID.parse('QmNPqfxJDLPJFMhkUexLv431HNTfQBqh45unLg8ByBfa7h')
    const retrieve = jest.fn(async (cid: CID) => {
      if (cid.equals(stateWithProof.log[1].cid)) {
        return {
          proof: proofCID,
          path: 'L/R',
        }
      }
    })
    const resolve = jest.fn(async (query: string) => {
      if (query === `${proofCID}/root`) {
        return proofRootCID
      } else if (query === `${proofCID}/root/L`) {
        return leftCID
      } else if (query === `${proofCID}/root/L/R`) {
        return rightCID
      }
    })
    const pinStore = new PinStore(stateStore, pinning, retrieve, resolve, jest.fn())
    const runningState = new RunningState(stateWithProof, false)
    const runningStateSpy = jest.spyOn(runningState, 'markAsUnpinned')
    await pinStore.rm(runningState)
    expect(stateStore.remove).toBeCalledWith(StreamUtils.streamIdFromState(stateWithProof))
    expect(pinning.unpin).toBeCalledTimes(2)
    expect(pinning.unpin.mock.calls[0][0].toString()).toEqual(stateWithProof.log[0].cid.toString())
    expect(pinning.unpin.mock.calls[1][0].toString()).toEqual(stateWithProof.log[1].cid.toString())
    expect(runningStateSpy).toBeCalledTimes(1)
    expect(runningState.pinnedCommits).toBeNull()
  })
})

test('#ls', async () => {
  const pinStore = new PinStore(stateStore, pinning, jest.fn(), jest.fn(), jest.fn())
  const stream = new FakeType(TestUtils.runningState(state), {})
  const list = ['1', '2', '3']
  stateStore.listStoredStreamIDs = jest.fn(async () => list)
  const result = await pinStore.ls(stream.id)
  expect(result).toEqual(list)
  expect(stateStore.listStoredStreamIDs).toBeCalledWith(stream.id)
})
