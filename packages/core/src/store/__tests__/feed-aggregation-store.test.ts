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
import { FeedAggregationStore } from '../feed-aggregation-store.js'
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
  feedAggregationStore = new FeedAggregationStore()
  const open = async (name: string): Promise<IKVStore> => {
    feedKVStore = await kvFactory.open(name)
    return feedKVStore
  }
  await feedAggregationStore.open({ open })
})

afterEach(async () => {
  const keys = await feedAggregationStore.findKeys()
  const removeAll = keys.map((k) => feedAggregationStore.remove(Number(k)))
  await Promise.all(removeAll)
})

afterAll(async () => {
  await feedAggregationStore.close()
  await kvFactory.close()
  await tmpFolder.cleanup()
})

describe('deleteStale', () => {
  const TIMESTAMPS = [1000, 2000, 3000, 4000, 5000]

  test('delete old entries', async () => {
    const threshold = 3000
    const freshEnough = TIMESTAMPS.filter((t) => t >= threshold)
    for (const t of TIMESTAMPS) {
      await feedAggregationStore.save(t, CommonTestUtils.randomStreamID())
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
      await feedAggregationStore.save(t, CommonTestUtils.randomStreamID())
    }
    const threshold = 1000 // No entries before that
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
    const fauxNow = new Date()
    MockDate.set(fauxNow) // "Freeze" Date.now to `fauxNow`
    const streamId = CommonTestUtils.randomStreamID()
    await feedAggregationStore.put(streamId)
    const keys = await feedAggregationStore.findKeys()
    expect(keys.length).toEqual(1)
    const first = Number(keys[0])
    expect(first).toEqual(fauxNow.valueOf())
    const stored = await feedAggregationStore.load(first)
    expect(stored).toEqual(streamId)
    MockDate.reset() // Unfreeze Date.now
  })

  test('use explicit timestamp', async () => {
    const streamId = CommonTestUtils.randomStreamID()
    const timestamp = 1000
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
    const store = new FeedAggregationStore(10, 100)
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
