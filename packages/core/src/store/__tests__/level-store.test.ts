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

  test("The main store is separated from a sub-channel", async () => {
    await levelStore.put('foo', 'bar')
    expect(await  levelStore.get('foo')).toEqual('bar')
    await expect( levelStore.get('foo', 'sub-channel')).rejects.toThrow(/Key not found in database/)
  })

  test("A sub-channel is separated from the main store", async () => {
    await levelStore.put('foo', 'bar', 'sub-channel')
    expect(await  levelStore.get('foo', 'sub-channel')).toEqual('bar')
    await expect(levelStore.get('foo', )).rejects.toThrow(/Key not found in database/)
  })

  test("A sub-channel is separated from another sub-channel", async () => {
    await levelStore.put('foo', 'bar', 'sub-channel')
    expect(await  levelStore.get('foo', 'sub-channel')).toEqual('bar')
    await expect(levelStore.get('foo', 'another-sub-channel')).rejects.toThrow(/Key not found in database/)
  })
})
