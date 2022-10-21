import { jest } from '@jest/globals'
import { LocalPinApi } from '../local-pin-api.js'
import { StreamID } from '@ceramicnetwork/streamid'
import * as random from '@stablelib/random'
import { CommitType, StreamState, LoggerProvider, SyncOptions } from '@ceramicnetwork/common'
import { Repository } from '../state-management/repository.js'
import { CID } from 'multiformats/cid'
import { RunningState } from '../state-management/running-state.js'

const STREAM_ID = StreamID.fromString(
  'k2t6wyfsu4pg0t2n4j8ms3s33xsgqjhtto04mvq8w5a2v5xo48idyz38l7ydki'
)
const FAKE_CID = CID.parse('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu')

const streamState = {
  type: 0,
  log: [{ cid: FAKE_CID, type: CommitType.GENESIS }],
} as unknown as StreamState
const state$ = new RunningState(streamState, true)
const repository = {
  load: jest.fn(() => Promise.resolve(state$)),
  fromMemoryOrStore: jest.fn(() => Promise.resolve(state$)),
  pin: jest.fn(),
  unpin: jest.fn(),
  list: jest.fn(),
} as unknown as Repository
const pinApi = new LocalPinApi(repository, new LoggerProvider().getDiagnosticsLogger())

async function toArray<A>(iterable: AsyncIterable<A>): Promise<A[]> {
  const result: A[] = []
  for await (const i of iterable) result.push(i)
  return result
}

test('add', async () => {
  await pinApi.add(STREAM_ID)
  expect(repository.load).toBeCalledWith(STREAM_ID, { sync: SyncOptions.PREFER_CACHE, pin: true })
  expect(repository.pin).toBeCalledWith(state$, undefined)
})

test('rm', async () => {
  await pinApi.rm(STREAM_ID)
  expect(repository.unpin).toBeCalledWith(state$, undefined)
})

describe('ls', () => {
  test('no streamId: list all', async () => {
    const length = Math.floor(Math.random() * 10)
    const expected = Array.from({ length }).map(() => random.randomString(10))
    repository.listPinned = jest.fn(async () => expected)
    const iterable = await pinApi.ls()
    const actual = await toArray(iterable)
    expect(actual).toEqual(expected)
    expect(repository.listPinned).toBeCalledWith(null)
  })
  test('streamId: present: list it', async () => {
    const expected = [STREAM_ID.toString()]
    repository.listPinned = jest.fn(async () => expected)
    const iterable = await pinApi.ls(STREAM_ID)
    const actual = await toArray(iterable)
    expect(actual).toEqual(expected)
    expect(repository.listPinned).toBeCalledWith(STREAM_ID)
  })
  test('streamId: absent: empty list', async () => {
    const expected = []
    repository.listPinned = jest.fn(async () => expected)
    const iterable = await pinApi.ls(STREAM_ID)
    const actual = await toArray(iterable)
    expect(actual).toEqual(expected)
    expect(repository.listPinned).toBeCalledWith(STREAM_ID)
  })
})
