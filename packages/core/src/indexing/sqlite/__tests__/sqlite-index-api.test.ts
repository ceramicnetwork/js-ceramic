import { jest } from '@jest/globals'
import tmp from 'tmp-promise'
import { DataSource } from 'typeorm'
import { asTimestamp, SqliteIndexApi } from '../sqlite-index-api.js'
import { StreamID } from '@ceramicnetwork/streamid'
import { listMidTables } from '../init-tables.js'
import { IndexStreamArgs } from '../../database-index-api.js'
import csv from 'csv-parser'
import * as fs from 'fs'
import knex, { Knex } from 'knex'

const STREAM_ID_A = 'kjzl6cwe1jw145m7jxh4jpa6iw1ps3jcjordpo81e0w04krcpz8knxvg5ygiabd'
const STREAM_ID_B = 'k2t6wyfsu4pfzxkvkqs4sxhgk2vy60icvko3jngl56qzmdewud4lscf5p93wna'
const CONTROLLER = 'did:key:foo'
const MODELS_TO_INDEX = [StreamID.fromString(STREAM_ID_A)]
const MODEL = MODELS_TO_INDEX[0]

let tmpFolder: tmp.DirectoryResult
let dataSource: DataSource
let knexConnection: Knex

beforeEach(async () => {
  tmpFolder = await tmp.dir({ unsafeCleanup: true })
  dataSource = new DataSource({
    type: 'sqlite',
    database: `${tmpFolder.path}/tmp-ceramic.sqlite`,
  })
  await dataSource.initialize()
  knexConnection = knex({
    client: 'sqlite3',
    useNullAsDefault: true,
  })
})

afterEach(async () => {
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
      const created = await listMidTables(dataSource)
      const tableNames = modelsToIndex.map((m) => `mid_${m.toString()}`)
      expect(created).toEqual(tableNames)
    })

    test('create new table with existing ones', async () => {
      // First init with one model
      const modelsA = [StreamID.fromString(STREAM_ID_A)]
      const indexApiA = new SqliteIndexApi(dataSource, knexConnection, modelsA)
      await indexApiA.init()
      const createdA = await listMidTables(dataSource)
      const tableNamesA = modelsA.map((m) => `mid_${m.toString()}`)
      expect(createdA).toEqual(tableNamesA)

      // Next add another one
      const modelsB = [...modelsA, StreamID.fromString(STREAM_ID_B)]
      const indexApiB = new SqliteIndexApi(dataSource, knexConnection, modelsB)
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
    const createdAt = new Date(raw.created_at * 1000)
    const updatedAt = new Date(raw.updated_at * 1000)
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
    const lastAnchor = new Date(raw.last_anchored_at * 1000)
    expect(closeDates(lastAnchor, updateTime)).toBeTruthy()
    const updatedAt = new Date(raw.updated_at * 1000)
    expect(closeDates(updatedAt, updateTime)).toBeTruthy()
    const createdAt = new Date(raw.created_at * 1000)
    expect(closeDates(createdAt, createTime)).toBeTruthy()
  })
})

function readFixture(filepath: URL) {
  type CsvFixture = IndexStreamArgs & { createdAt?: Date }
  return new Promise<Array<CsvFixture>>((resolve, reject) => {
    const result = new Array<CsvFixture>()
    const csvReader = csv({
      separator: ';',
      mapHeaders: ({ header }) => (header ? header.replace(/\s+/g, '') : null),
    })
    fs.createReadStream(filepath)
      .pipe(csvReader)
      .on('data', (row) => {
        result.push({
          model: MODEL,
          streamID: StreamID.fromString(row.stream_id),
          controller: row.controller,
          lastAnchor: row.last_anchored_at
            ? new Date(Number(row.last_anchored_at) * 1000)
            : undefined,
          createdAt: row.created_at ? new Date(Number(row.created_at) * 1000) : undefined,
        })
      })
      .on('error', (error) => reject(error))
      .on('end', () => {
        resolve(result)
      })
  })
}

describe('page', () => {
  let indexAPI: SqliteIndexApi
  let ALL_ENTRIES_IN_CHRONOLOGICAL_ORDER: Array<string>

  beforeEach(async () => {
    indexAPI = new SqliteIndexApi(dataSource, knexConnection, MODELS_TO_INDEX)
    await indexAPI.init()
    // Rows in chronological-order.fixture.csv are in chronological order.
    // The responses in the tests below are ok if they are in the same order as in the CSV.
    const rows = await readFixture(new URL('./chronological-order.fixture.csv', import.meta.url))
    for (const row of rows) {
      await indexAPI.indexStream(row)
    }
    ALL_ENTRIES_IN_CHRONOLOGICAL_ORDER = rows.map((r) => r.streamID.toString())
  })

  describe('chronological order', () => {
    function chunks<T>(array: Array<T>, chunkSize: number): Array<Array<T>> {
      const result = new Array<Array<T>>()
      for (let i = 0; i < array.length; i += chunkSize) {
        result.push(array.slice(i, i + chunkSize))
      }
      return result
    }

    test('forward pagination', async () => {
      const pageSize = 5
      const pages = chunks(ALL_ENTRIES_IN_CHRONOLOGICAL_ORDER, pageSize)
      let afterCursor: string | undefined = undefined
      for (let i = 0; i < pages.length; i++) {
        const result = await indexAPI.page({
          model: MODEL,
          first: pageSize,
          after: afterCursor,
        })
        afterCursor = result.pageInfo.endCursor
        const expected = pages[i]
        expect(result.entries.length).toEqual(expected.length)
        expect(result.entries.map(String)).toEqual(expected)
        const hasNextPage = Boolean(pages[i + 1])
        expect(result.pageInfo.hasNextPage).toEqual(hasNextPage)
        expect(result.pageInfo.hasPreviousPage).toEqual(false)
        expect(result.pageInfo.endCursor).toBeTruthy()
        expect(result.pageInfo.startCursor).toBeTruthy()
      }
    })
    test('backward pagination', async () => {
      const pageSize = 5
      const pages = chunks(ALL_ENTRIES_IN_CHRONOLOGICAL_ORDER.reverse(), pageSize).map((arr) =>
        arr.reverse()
      )
      let beforeCursor: string | undefined = undefined
      for (let i = 0; i < pages.length; i++) {
        const result = await indexAPI.page({
          model: MODEL,
          last: pageSize,
          before: beforeCursor,
        })
        beforeCursor = result.pageInfo.startCursor
        const expected = pages[i]
        expect(result.entries.length).toEqual(expected.length)
        expect(result.entries.map(String)).toEqual(expected)
        const hasPreviousPage = Boolean(pages[i + 1])
        expect(result.pageInfo.hasNextPage).toEqual(false)
        expect(result.pageInfo.hasPreviousPage).toEqual(hasPreviousPage)
        expect(result.pageInfo.endCursor).toBeTruthy()
        expect(result.pageInfo.startCursor).toBeTruthy()
      }
    })
  })

  test('chronological order, filtered by account', async () => {
    const presentAccount = 'did:key:foo' // We have that in the populated table
    const absentAccount = 'did:key:blah' // We do not have that in the populated table
    const withPresentAccount = await indexAPI.page({
      model: MODEL,
      account: presentAccount,
      first: 5,
    })
    expect(withPresentAccount.entries.map(String)).toEqual(
      ALL_ENTRIES_IN_CHRONOLOGICAL_ORDER.slice(0, 5)
    )
    // Should return an empty page
    const withAbsentAccount = await indexAPI.page({
      model: MODEL,
      account: absentAccount,
      first: 5,
    })
    expect(withAbsentAccount.entries).toEqual([])
    expect(withAbsentAccount.pageInfo.hasNextPage).toEqual(false)
    expect(withAbsentAccount.pageInfo.hasPreviousPage).toEqual(false)
    expect(withAbsentAccount.pageInfo.endCursor).toBeUndefined()
    expect(withAbsentAccount.pageInfo.startCursor).toBeUndefined()
  })
})
