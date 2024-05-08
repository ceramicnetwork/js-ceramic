import {
  test,
  describe,
  expect,
  beforeAll,
  afterAll,
  jest,
  beforeEach,
  afterEach,
} from '@jest/globals'
import tmp, { type DirectoryResult } from 'tmp-promise'
import { LevelKVFactory } from '../level-kv-factory.js'
import { LoggerProvider } from '@ceramicnetwork/common'
import { FeedAggregationStore, MonotonicKey } from '../feed-aggregation-store.js'
import { CommonTestUtils } from '@ceramicnetwork/common-test-utils'
import { IKVStore } from '../ikv-store.js'
import { Deferred } from '../../anchor/processing-loop.js'
import MockDate from 'mockdate'

const logger = new LoggerProvider().getDiagnosticsLogger()

let tmpFolder: DirectoryResult
let kvFactory: LevelKVFactory
let feedKVStore: IKVStore
let feedAggregationStore: FeedAggregationStore

beforeAll(async () => {
  tmpFolder = await tmp.dir({ unsafeCleanup: true })
  kvFactory = new LevelKVFactory(tmpFolder.path, `fake-${Math.random()}`, logger)
  feedAggregationStore = new FeedAggregationStore(logger)
  const open = async (name: string): Promise<IKVStore> => {
    feedKVStore = await kvFactory.open(name)
    return feedKVStore
  }
  await feedAggregationStore.open({ open })
})

afterEach(async () => {
  const keys = await feedAggregationStore.findKeys()
  const removeAll = keys.map((k) => feedAggregationStore.remove(k))
  await Promise.all(removeAll)
})

afterAll(async () => {
  await feedAggregationStore.close()
  await kvFactory.close()
  await tmpFolder.cleanup()
})

describe('deleteStale', () => {
  const TIMESTAMPS = [1000, 2000, 3000, 4000, 5000] // ns

  test('delete old entries', async () => {
    const threshold = 3 // ms, while TIMESTAMPS are in ns
    const freshEnough = TIMESTAMPS.filter((t) => t >= threshold * 1000)
    for (const t of TIMESTAMPS) {
      await feedAggregationStore.save(t.toString(), CommonTestUtils.randomStreamID())
    }
    const keysA = await feedAggregationStore.findKeys()
    expect(keysA.length).toEqual(TIMESTAMPS.length)
    const batchSpy = jest.spyOn(feedKVStore, 'batch')
    const keysDeletedSize = await feedAggregationStore.deleteStale(threshold)
    const keysB = await feedAggregationStore.findKeys()
    expect(keysB.length).toEqual(freshEnough.length)
    expect(batchSpy).toBeCalled()
    expect(keysDeletedSize).toEqual(2)
    batchSpy.mockRestore()
  })

  test('do nothing if no old entries', async () => {
    for (const t of TIMESTAMPS) {
      await feedAggregationStore.save(t.toString(), CommonTestUtils.randomStreamID())
    }
    const threshold = 1 // No entries before that
    const keysA = await feedAggregationStore.findKeys()
    expect(keysA.length).toEqual(TIMESTAMPS.length)
    const batchSpy = jest.spyOn(feedKVStore, 'batch')
    const keysDeletedSize = await feedAggregationStore.deleteStale(threshold)
    expect(keysDeletedSize).toEqual(0)
    const keysB = await feedAggregationStore.findKeys()
    expect(keysB.length).toEqual(TIMESTAMPS.length) // No changes!
    expect(batchSpy).not.toBeCalled()
    batchSpy.mockRestore()
  })
})

describe('put', () => {
  test('use current timestamp', async () => {
    const now = new Date()
    MockDate.set(now)
    const streamId = CommonTestUtils.randomStreamID()
    await feedAggregationStore.put(streamId)
    const keys = await feedAggregationStore.findKeys()
    expect(keys.length).toEqual(1)
    const first = keys[0]
    const key = `${now.valueOf()}000000`
    expect(first).toEqual(key)
    const stored = await feedAggregationStore.load(first)
    expect(stored).toEqual(streamId)
    MockDate.reset()
  })

  test('use explicit key', async () => {
    const streamId = CommonTestUtils.randomStreamID()
    const timestamp = '1000'
    await feedAggregationStore.put(streamId, timestamp)
    const keys = await feedAggregationStore.findKeys()
    expect(keys.length).toEqual(1)
    const stored = await feedAggregationStore.load(timestamp)
    expect(stored).toEqual(streamId)
  })
})

describe('periodic clean up', () => {
  let kvFactory: LevelKVFactory

  beforeEach(() => {
    kvFactory = new LevelKVFactory(tmpFolder.path, `fake-2-${Math.random()}`, logger)
  })

  afterEach(async () => {
    await kvFactory.close()
  })

  test('every cleanupInterval', async () => {
    const store = new FeedAggregationStore(logger, 10, 100)
    const tasks = store.tasks
    let addCalledTimes = 0
    const addCalledMax = 3
    const defer = new Deferred()
    const deleteStaleSpy = jest.spyOn(store, 'deleteStale')
    const addOriginal = tasks.add.bind(tasks)
    const addSpy = jest.spyOn(tasks, 'add').mockImplementation(async (...args: any[]) => {
      addOriginal(...args)
      addCalledTimes += 1
      if (addCalledTimes >= addCalledMax) {
        await store.close()
        defer.resolve()
      }
    })
    await store.open(kvFactory)
    await defer
    expect(addSpy).toBeCalledTimes(addCalledMax)
    expect(deleteStaleSpy).toBeCalledTimes(addCalledMax)
  })
})

describe('MonotonicKey', () => {
  test('uses current time and counter', () => {
    const generator = new MonotonicKey()
    const now = new Date()
    MockDate.set(now)
    const nowSpy = jest.spyOn(Date, 'now')
    const entries = [generator.next(), generator.next(), generator.next()]
    const nowString = now.valueOf().toString()
    expect(entries).toEqual([`${nowString}000000`, `${nowString}000001`, `${nowString}000002`])
    MockDate.reset()
    expect(nowSpy).toBeCalledTimes(entries.length)
  })
})
