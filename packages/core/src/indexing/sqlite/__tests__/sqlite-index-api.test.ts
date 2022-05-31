import { jest } from '@jest/globals'
import tmp from 'tmp-promise'
import { DataSource } from 'typeorm'
import { asTimestamp, SqliteIndexApi } from '../sqlite-index-api.js'
import { StreamID } from '@ceramicnetwork/streamid'
import { listMidTables } from '../init-tables.js'
import { delay } from '../../../__tests__/delay'

const STREAM_ID_A = 'kjzl6cwe1jw145m7jxh4jpa6iw1ps3jcjordpo81e0w04krcpz8knxvg5ygiabd'
const STREAM_ID_B = 'k2t6wyfsu4pfzxkvkqs4sxhgk2vy60icvko3jngl56qzmdewud4lscf5p93wna'

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

describe('init', () => {
  test('initialize DataSource', async () => {
    const initializeSpy = jest.spyOn(dataSource, 'initialize')
    const indexApi = new SqliteIndexApi(dataSource, [])
    await indexApi.init()
    expect(initializeSpy).toBeCalledTimes(1)
  })
  describe('create tables', () => {
    test('create new table from scratch', async () => {
      const modelsToIndex = [StreamID.fromString(STREAM_ID_A)]
      const indexApi = new SqliteIndexApi(dataSource, modelsToIndex)
      await indexApi.init()
      const created = await listMidTables(dataSource)
      const tableNames = modelsToIndex.map((m) => `mid_${m.toString()}`)
      expect(created).toEqual(tableNames)
    })

    test('create new table with existing ones', async () => {
      // First init with one model
      const modelsA = [StreamID.fromString(STREAM_ID_A)]
      const indexApiA = new SqliteIndexApi(dataSource, modelsA)
      await indexApiA.init()
      const createdA = await listMidTables(dataSource)
      const tableNamesA = modelsA.map((m) => `mid_${m.toString()}`)
      expect(createdA).toEqual(tableNamesA)

      // Next add another one
      const modelsB = [...modelsA, StreamID.fromString(STREAM_ID_B)]
      const indexApiB = new SqliteIndexApi(dataSource, modelsB)
      await indexApiB.init()
      const createdB = await listMidTables(dataSource)
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
  const CONTROLLER = 'did:key:foo'
  const STREAM_CONTENT = {
    model: MODELS_TO_INDEX[0],
    streamID: StreamID.fromString(STREAM_ID_B),
    controller: CONTROLLER,
    lastAnchor: null,
  }

  let indexApi: SqliteIndexApi
  beforeEach(async () => {
    indexApi = new SqliteIndexApi(dataSource, MODELS_TO_INDEX)
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
    const createdAt = new Date(raw.created_at * 1000)
    const updatedAt = new Date(raw.updated_at * 1000)
    expect(closeDates(createdAt, now)).toBeTruthy()
    expect(closeDates(updatedAt, now)).toBeTruthy()
  })

  test('override stream', async () => {
    const createTime = new Date()
    await indexApi.indexStream(STREAM_CONTENT)
    await delay(2000) // 2 seconds, because of 1 second precision
    const updateTime = new Date()
    const updatedStreamContent = {
      ...STREAM_CONTENT,
      lastAnchor: updateTime,
    }
    // It updates the fields if a stream is present.
    await indexApi.indexStream(updatedStreamContent)
    const result: Array<any> = await dataSource.query(`SELECT * FROM mid_${MODELS_TO_INDEX[0]}`)
    expect(result.length).toEqual(1)
    const raw = result[0]
    expect(raw.stream_id).toEqual(STREAM_ID_B)
    expect(raw.controller_did).toEqual(CONTROLLER)
    const lastAnchor = new Date(raw.last_anchored_at * 1000)
    expect(closeDates(lastAnchor, updateTime)).toBeTruthy()
    const updatedAt = new Date(raw.updated_at * 1000)
    expect(closeDates(updatedAt, updateTime)).toBeTruthy()
    const createdAt = new Date(raw.created_at * 1000)
    expect(closeDates(createdAt, createTime)).toBeTruthy()
  })
})
