import { jest } from '@jest/globals'
import tmp from 'tmp-promise'
import { LevelDbStore } from '../level-db-store.js'
import { TestUtils } from '@ceramicnetwork/common'

describe("LevelStore", () => {
  let tmpFolder: any
  let levelStore: LevelDbStore

  beforeEach(async () => {
    tmpFolder = await tmp.dir({ unsafeCleanup: true })
    levelStore = new LevelDbStore(tmpFolder.path, 'fakeNetwork')

    // add a small delay after creating the leveldb instance before trying to use it.
    await TestUtils.delay(100)
  })

  afterEach(async () => {
    await levelStore.close()
    await tmpFolder.cleanup()
  })

  test("Can save and retrieve from the default store", async () => {
    await expect( levelStore.get('foo')).rejects.toThrow(/Key not found in database/)
    await levelStore.put('foo', 'bar')
    expect(await  levelStore.get('foo')).toEqual('bar')
  })

  test("Can save and retrieve from a use cuse store", async () => {
    await expect( levelStore.get('foo', 'use-case')).rejects.toThrow(/Key not found in database/)
    await levelStore.put('foo', 'bar', 'use-case')
    expect(await  levelStore.get('foo', 'use-case')).toEqual('bar')
  })

  test("The default store is separated from use case store", async () => {
    await levelStore.put('foo', 'bar')
    expect(await  levelStore.get('foo')).toEqual('bar')
    await expect( levelStore.get('foo', 'use-case')).rejects.toThrow(/Key not found in database/)
    expect(await levelStore.findKeys()).toEqual(['foo'])
    expect(await levelStore.findKeys({ useCaseName: 'use-case' })).toEqual([])
  })

  test("A use case store is separated from the default store", async () => {
    await levelStore.put('foo', 'bar', 'use-case')
    expect(await  levelStore.get('foo', 'use-case')).toEqual('bar')
    await expect(levelStore.get('foo', )).rejects.toThrow(/Key not found in database/)
    expect(await levelStore.findKeys({ useCaseName: 'use-case' })).toEqual(['foo'])
    expect(await levelStore.findKeys()).toEqual([])
  })

  test("A use case store  is separated from another use case store", async () => {
    await levelStore.put('foo', 'bar', 'use-case-1')
    expect(await  levelStore.get('foo', 'use-case-1')).toEqual('bar')
    await expect(levelStore.get('foo', 'use-case-2')).rejects.toThrow(/Key not found in database/)
    expect(await levelStore.findKeys({ useCaseName: 'use-case-1' })).toEqual(['foo'])
    expect(await levelStore.findKeys({ useCaseName: 'use-case-2' })).toEqual([])
  })
})
