import { jest } from '@jest/globals'
import tmp from 'tmp-promise'
import { DataSource } from 'typeorm'
import { SqliteIndexApi } from '../sqlite/sqlite-index-api.js'
import { StreamID } from '@ceramicnetwork/streamid'
import { listMidTables } from '../sqlite/init-tables.js'

describe('init', () => {
  let tmpFolder: tmp.DirectoryResult
  let dataSource: DataSource

  beforeEach(async () => {
    tmpFolder = await tmp.dir({ unsafeCleanup: true })
    dataSource = new DataSource({
      type: 'sqlite',
      database: `${tmpFolder.path}/tmp-ceramic.sqlite`,
    })
  })

  afterEach(async () => {
    await dataSource.close()
    await tmpFolder.cleanup()
  })

  test('initialize DataSource', async () => {
    const initializeSpy = jest.spyOn(dataSource, 'initialize')
    const indexApi = new SqliteIndexApi(dataSource, [])
    await indexApi.init()
    expect(initializeSpy).toBeCalledTimes(1)
  })
  describe('create tables', () => {
    const streamIdA = 'kjzl6cwe1jw145m7jxh4jpa6iw1ps3jcjordpo81e0w04krcpz8knxvg5ygiabd'
    const streamIdB = 'k2t6wyfsu4pfzxkvkqs4sxhgk2vy60icvko3jngl56qzmdewud4lscf5p93wna'

    test('create new table from scratch', async () => {
      const modelsToIndex = [StreamID.fromString(streamIdA)]
      const indexApi = new SqliteIndexApi(dataSource, modelsToIndex)
      await indexApi.init()
      const created = await listMidTables(dataSource)
      const tableNames = modelsToIndex.map((m) => `mid_${m.toString()}`)
      expect(created).toEqual(tableNames)
    })

    test('create new table with existing ones', async () => {
      // First init with one model
      const modelsA = [StreamID.fromString(streamIdA)]
      const indexApiA = new SqliteIndexApi(dataSource, modelsA)
      await indexApiA.init()
      const createdA = await listMidTables(dataSource)
      const tableNamesA = modelsA.map((m) => `mid_${m.toString()}`)
      expect(createdA).toEqual(tableNamesA)

      // Next add another one
      const modelsB = [...modelsA, StreamID.fromString(streamIdB)]
      const indexApiB = new SqliteIndexApi(dataSource, modelsB)
      await indexApiB.init()
      const createdB = await listMidTables(dataSource)
      const tableNamesB = modelsB.map((m) => `mid_${m.toString()}`)
      expect(createdB).toEqual(tableNamesB)
    })
  })
})
