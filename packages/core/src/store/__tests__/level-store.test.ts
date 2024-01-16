import tmp from 'tmp-promise'
import { LevelDbStore } from '../level-db-store.js'
import { LoggerProvider } from '@ceramicnetwork/common'
import { CommonTestUtils as TestUtils } from '@ceramicnetwork/common-test-utils'

describe('LevelStore', () => {
  let tmpFolder: any
  let levelStore: LevelDbStore

  beforeEach(async () => {
    tmpFolder = await tmp.dir({ unsafeCleanup: true })
    levelStore = new LevelDbStore(
      new LoggerProvider().getDiagnosticsLogger(),
      tmpFolder.path,
      'fakeNetwork'
    )

    // add a small delay after creating the leveldb instance before trying to use it.
    await TestUtils.delay(100)
  })

  afterEach(async () => {
    await levelStore.close()
    await tmpFolder.cleanup()
  })

  test('put/get to the default store', async () => {
    await expect(levelStore.get('foo')).rejects.toThrow(/Key not found in database/)
    await levelStore.put('foo', 'bar')
    expect(await levelStore.get('foo')).toEqual('bar')
  })

  test('put/get to a use cuse store', async () => {
    await expect(levelStore.get('foo', 'use-case')).rejects.toThrow(/Key not found in database/)
    await levelStore.put('foo', 'bar', 'use-case')
    expect(await levelStore.get('foo', 'use-case')).toEqual('bar')
  })

  test('del from the default store', async () => {
    await expect(levelStore.get('foo')).rejects.toThrow(/Key not found in database/)
    await levelStore.put('foo', 'bar')
    await levelStore.del('foo')
    await expect(levelStore.get('foo')).rejects.toThrow(/Key not found in database/)
  })

  test('del from a use case store', async () => {
    await expect(levelStore.get('foo', 'use-case')).rejects.toThrow(/Key not found in database/)
    await levelStore.put('foo', 'bar', 'use-case')
    await levelStore.del('foo', 'use-case')
    await expect(levelStore.get('foo', 'use-case')).rejects.toThrow(/Key not found in database/)
  })

  test('exists in the default store', async () => {
    expect(await levelStore.exists('foo')).toBeFalsy()
    await levelStore.put('foo', 'bar')
    expect(await levelStore.exists('foo')).toBeTruthy()
    await levelStore.del('foo')
    expect(await levelStore.exists('foo')).toBeFalsy()
  })

  test('exists in a use case store', async () => {
    expect(await levelStore.exists('foo', 'use-case')).toBeFalsy()
    await levelStore.put('foo', 'bar', 'use-case')
    expect(await levelStore.exists('foo', 'use-case')).toBeTruthy()
    await levelStore.del('foo', 'use-case')
    expect(await levelStore.exists('foo', 'use-case')).toBeFalsy()
  })

  test('isEmpty with the default store', async () => {
    expect(await levelStore.isEmpty()).toBeTruthy()
    await levelStore.put('foo', 'bar')
    expect(await levelStore.isEmpty()).toBeFalsy()
    await levelStore.del('foo')
    expect(await levelStore.isEmpty()).toBeTruthy()
  })

  test('isEmpty with a use case store', async () => {
    expect(await levelStore.isEmpty({ useCaseName: 'use-case' })).toBeTruthy()
    await levelStore.put('foo', 'bar', 'use-case')
    expect(await levelStore.isEmpty({ useCaseName: 'use-case' })).toBeFalsy()
    await levelStore.del('foo', 'use-case')
    expect(await levelStore.isEmpty({ useCaseName: 'use-case' })).toBeTruthy()
  })

  test('find in the default store', async () => {
    expect(await levelStore.find()).toEqual([])
    await levelStore.put('hey', 'ho')
    await levelStore.put('foo', 'bar')
    expect(await levelStore.find()).toEqual([
      { key: 'foo', value: 'bar' },
      { key: 'hey', value: 'ho' },
    ])
  })

  test('find in a use case store', async () => {
    expect(await levelStore.find({ useCaseName: 'use-case' })).toEqual([])
    await levelStore.put('hey', 'ho', 'use-case')
    await levelStore.put('foo', 'bar', 'use-case')
    expect(await levelStore.find({ useCaseName: 'use-case' })).toEqual([
      { key: 'foo', value: 'bar' },
      { key: 'hey', value: 'ho' },
    ])
  })

  test('findKeys in the default store', async () => {
    expect(await levelStore.findKeys()).toEqual([])
    await levelStore.put('hey', 'ho')
    await levelStore.put('foo', 'bar')
    expect(await levelStore.findKeys()).toEqual(['foo', 'hey'])
  })

  test('findKeys in a use case store', async () => {
    expect(await levelStore.findKeys({ useCaseName: 'use-case' })).toEqual([])
    await levelStore.put('hey', 'ho', 'use-case')
    await levelStore.put('foo', 'bar', 'use-case')
    expect(await levelStore.findKeys({ useCaseName: 'use-case' })).toEqual(['foo', 'hey'])
  })

  test('The default store is separated from use case store', async () => {
    await levelStore.put('foo', 'bar')
    expect(await levelStore.get('foo')).toEqual('bar')
    await expect(levelStore.get('foo', 'use-case')).rejects.toThrow(/Key not found in database/)
    expect(await levelStore.findKeys()).toEqual(['foo'])
    expect(await levelStore.findKeys({ useCaseName: 'use-case' })).toEqual([])
  })

  test('A use case store is separated from the default store', async () => {
    await levelStore.put('foo', 'bar', 'use-case')
    expect(await levelStore.get('foo', 'use-case')).toEqual('bar')
    await expect(levelStore.get('foo')).rejects.toThrow(/Key not found in database/)
    expect(await levelStore.findKeys({ useCaseName: 'use-case' })).toEqual(['foo'])
    expect(await levelStore.findKeys()).toEqual([])
  })

  test('A use case store  is separated from another use case store', async () => {
    await levelStore.put('foo', 'bar', 'use-case-1')
    expect(await levelStore.get('foo', 'use-case-1')).toEqual('bar')
    await expect(levelStore.get('foo', 'use-case-2')).rejects.toThrow(/Key not found in database/)
    expect(await levelStore.findKeys({ useCaseName: 'use-case-1' })).toEqual(['foo'])
    expect(await levelStore.findKeys({ useCaseName: 'use-case-2' })).toEqual([])
  })
})
