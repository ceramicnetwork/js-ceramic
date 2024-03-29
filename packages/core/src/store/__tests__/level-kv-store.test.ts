import tmp from 'tmp-promise'
import { LoggerProvider } from '@ceramicnetwork/common'
import { LevelKVFactory } from '../level-kv-factory.js'
import { expect, test, afterEach, beforeEach } from '@jest/globals'
import type { LevelKVStore } from '../level-kv-store.js'

let tmpFolder: any
let factory: LevelKVFactory
let store: LevelKVStore

beforeEach(async () => {
  tmpFolder = await tmp.dir({ unsafeCleanup: true })
  const logger = new LoggerProvider().getDiagnosticsLogger()
  factory = new LevelKVFactory(tmpFolder.path, 'fakeNetwork', logger)
  store = await factory.open()
})

afterEach(async () => {
  await factory.close()
  await tmpFolder.cleanup()
})

test('put/get to the default store', async () => {
  await expect(store.get('foo')).rejects.toThrow(/NotFound/)
  await store.put('foo', 'bar')
  expect(await store.get('foo')).toEqual('bar')
})

test('put/get to a use-case store', async () => {
  const customStore = await factory.open('custom')
  await expect(customStore.get('foo')).rejects.toThrow(/NotFound/)
  await customStore.put('foo', 'bar')
  await expect(customStore.get('foo')).resolves.toEqual('bar')

  await expect(store.get('foo')).rejects.toThrow(/NotFound/)
})

test('del from the default store', async () => {
  await expect(store.get('foo')).rejects.toThrow(/NotFound/)
  await store.put('foo', 'bar')
  await expect(store.get('foo')).resolves.toEqual('bar')
  await store.del('foo')
  await expect(store.get('foo')).rejects.toThrow(/NotFound/)
})

test('del from a use case store', async () => {
  const customStore = await factory.open('custom')
  await expect(customStore.get('foo')).rejects.toThrow(/NotFound/)
  await customStore.put('foo', 'bar')
  await customStore.del('foo')
  await expect(customStore.get('foo')).rejects.toThrow(/NotFound/)
})

test('exists in the default store', async () => {
  expect(await store.exists('foo')).toBeFalsy()
  await store.put('foo', 'bar')
  expect(await store.exists('foo')).toBeTruthy()
  await store.del('foo')
  expect(await store.exists('foo')).toBeFalsy()
})

test('exists in a use case store', async () => {
  const customStore = await factory.open('custom')
  expect(await customStore.exists('foo')).toBeFalsy()
  await customStore.put('foo', 'bar')
  expect(await customStore.exists('foo')).toBeTruthy()
  await customStore.del('foo')
  expect(await customStore.exists('foo')).toBeFalsy()
})

test('isEmpty', async () => {
  expect(await store.isEmpty()).toBeTruthy()
  await store.put('foo', 'bar')
  expect(await store.isEmpty()).toBeFalsy()
  await store.del('foo')
  expect(await store.isEmpty()).toBeTruthy()
})

test('find', async () => {
  expect(await store.find()).toEqual([])
  await store.put('hey', 'ho')
  await store.put('foo', 'bar')
  expect(await store.find()).toEqual([
    { key: 'foo', value: 'bar' },
    { key: 'hey', value: 'ho' },
  ])
})

test('findKeys', async () => {
  expect(await store.findKeys()).toEqual([])
  await store.put('hey', 'ho')
  await store.put('foo', 'bar')
  expect(await store.findKeys()).toEqual(['foo', 'hey'])
})

test('store separation', async () => {
  const customStore = await factory.open('custom')
  const storeKey = 'foo'
  const storeValue = 'bar'
  const customStoreKey = 'foo1'
  const customStoreValue = 'bar1'

  await store.put(storeKey, storeValue)
  await expect(store.get(storeKey)).resolves.toEqual(storeValue)
  await expect(customStore.get(storeKey)).rejects.toThrow(/NotFound/)

  await expect(store.findKeys()).resolves.toEqual([storeKey])
  await expect(customStore.findKeys()).resolves.toEqual([])

  await customStore.put(customStoreKey, customStoreValue)
  await expect(customStore.get(customStoreKey)).resolves.toEqual(customStoreValue)
  await expect(store.get(customStoreKey)).rejects.toThrow(/NotFound/)

  await expect(store.findKeys()).resolves.toEqual([storeKey])
  await expect(customStore.findKeys()).resolves.toEqual([customStoreKey])
})
