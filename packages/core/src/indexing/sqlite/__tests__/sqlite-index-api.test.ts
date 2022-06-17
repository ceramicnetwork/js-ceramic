import { jest } from '@jest/globals'
import tmp from 'tmp-promise'
import { DataSource } from 'typeorm'
import { asTimestamp, SqliteIndexApi } from '../sqlite-index-api.js'
import { StreamID } from '@ceramicnetwork/streamid'
import { listMidTables } from '../init-tables.js'
import knex, { Knex } from 'knex'

const STREAM_ID_A = 'kjzl6cwe1jw145m7jxh4jpa6iw1ps3jcjordpo81e0w04krcpz8knxvg5ygiabd'
const STREAM_ID_B = 'k2t6wyfsu4pfzxkvkqs4sxhgk2vy60icvko3jngl56qzmdewud4lscf5p93wna'
const CONTROLLER = 'did:key:foo'

let tmpFolder: tmp.DirectoryResult
let dataSource: DataSource
let knexConnection: Knex

beforeEach(async () => {
  tmpFolder = await tmp.dir({ unsafeCleanup: true })
  const filename = `${tmpFolder.path}/tmp-ceramic.sqlite`
  dataSource = new DataSource({
    type: 'sqlite',
    database: filename,
  })
  await dataSource.initialize()
  knexConnection = knex({
    client: 'sqlite3',
    useNullAsDefault: true,
    connection: {
      filename: filename,
    },
  })
})

afterEach(async () => {
  await knexConnection.destroy()
  await dataSource.close()
  await tmpFolder.cleanup()
})

describe('init', () => {
  test('initialize DataSource', async () => {
    const dataSource = new DataSource({
      type: 'sqlite',
      database: `${tmpFolder.path}/tmp-ceramic.sqlite`,
    })
    const initializeSpy = jest.spyOn(dataSource, 'initialize')
    const indexApi = new SqliteIndexApi(dataSource, knexConnection, [])
    await indexApi.init()
    expect(initializeSpy).toBeCalledTimes(1)
  })
  describe('create tables', () => {
    test('create new table from scratch', async () => {
      const modelsToIndex = [StreamID.fromString(STREAM_ID_A)]
      const indexApi = new SqliteIndexApi(dataSource, knexConnection, modelsToIndex)
      await indexApi.init()
      const created = await listMidTables(knexConnection)
      const tableNames = modelsToIndex.map((m) => `mid_${m.toString()}`)
      expect(created).toEqual(tableNames)
    })

    test('create new table with existing ones', async () => {
      // First init with one model
      const modelsA = [StreamID.fromString(STREAM_ID_A)]
      const indexApiA = new SqliteIndexApi(dataSource, knexConnection, modelsA)
      await indexApiA.init()
      const createdA = await listMidTables(knexConnection)
      const tableNamesA = modelsA.map((m) => `mid_${m.toString()}`)
      expect(createdA).toEqual(tableNamesA)

      // Next add another one
      const modelsB = [...modelsA, StreamID.fromString(STREAM_ID_B)]
      const indexApiB = new SqliteIndexApi(dataSource, knexConnection, modelsB)
      await indexApiB.init()
      const createdB = await listMidTables(knexConnection)
      const tableNamesB = modelsB.map((m) => `mid_${m.toString()}`)
      expect(createdB).toEqual(tableNamesB)
    })
  })
})

/**
 * Difference between `a` and `b` timestamps is less than or equal to `deltaS`.
 */
function closeDates(a: Date, b: Date, deltaS = 1) {
  const aSeconds = asTimestamp(a)
  const bSeconds = asTimestamp(b)
  return Math.abs(aSeconds - bSeconds) <= deltaS
}

describe('indexStream', () => {
  const MODELS_TO_INDEX = [STREAM_ID_A, STREAM_ID_B].map(StreamID.fromString)
  const STREAM_CONTENT = {
    model: MODELS_TO_INDEX[0],
    streamID: StreamID.fromString(STREAM_ID_B),
    controller: CONTROLLER,
    lastAnchor: null,
  }

  let indexApi: SqliteIndexApi
  beforeEach(async () => {
    indexApi = new SqliteIndexApi(dataSource, knexConnection, MODELS_TO_INDEX)
    await indexApi.init()
  })

  test('new stream', async () => {
    const now = new Date()
    await indexApi.indexStream(STREAM_CONTENT)
    const result: Array<any> = await dataSource.query(`SELECT * FROM mid_${MODELS_TO_INDEX[0]}`)
    expect(result.length).toEqual(1)
    const raw = result[0]
    expect(raw.stream_id).toEqual(STREAM_ID_B)
    expect(raw.controller_did).toEqual(CONTROLLER)
    expect(raw.last_anchored_at).toBeNull()
    const createdAt = new Date(raw.created_at)
    const updatedAt = new Date(raw.updated_at)
    expect(closeDates(createdAt, now)).toBeTruthy()
    expect(closeDates(updatedAt, now)).toBeTruthy()
  })

  test('override stream', async () => {
    const createTime = new Date()
    await indexApi.indexStream(STREAM_CONTENT)
    const updateTime = new Date(createTime.valueOf() + 5000)
    const updatedStreamContent = {
      ...STREAM_CONTENT,
      updatedAt: updateTime,
      lastAnchor: updateTime,
    }
    // It updates the fields if a stream is present.
    await indexApi.indexStream(updatedStreamContent)
    const result: Array<any> = await dataSource.query(`SELECT * FROM mid_${MODELS_TO_INDEX[0]}`)
    expect(result.length).toEqual(1)
    const raw = result[0]
    expect(raw.stream_id).toEqual(STREAM_ID_B)
    expect(raw.controller_did).toEqual(CONTROLLER)
    const lastAnchor = new Date(raw.last_anchored_at)
    expect(closeDates(lastAnchor, updateTime)).toBeTruthy()
    const updatedAt = new Date(raw.updated_at)
    expect(closeDates(updatedAt, updateTime)).toBeTruthy()
    const createdAt = new Date(raw.created_at)
    expect(closeDates(createdAt, createTime)).toBeTruthy()
  })
})
