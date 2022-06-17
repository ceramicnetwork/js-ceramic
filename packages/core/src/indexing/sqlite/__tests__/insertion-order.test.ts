import { DataSource } from 'typeorm'
import tmp from 'tmp-promise'
import knex from 'knex'
import { StreamID } from '@ceramicnetwork/streamid'
import { SqliteIndexApi } from '../sqlite-index-api.js'
import { readCsvFixture } from './read-csv-fixture.util.js'
import { chunks } from './chunks.util.js'
import { InsertionOrder } from '../insertion-order.js'

const MODEL_ID = 'kjzl6cwe1jw145m7jxh4jpa6iw1ps3jcjordpo81e0w04krcpz8knxvg5ygiabd'
const MODELS_TO_INDEX = [StreamID.fromString(MODEL_ID)]
const MODEL = MODELS_TO_INDEX[0]

let EXPECTED: Array<string>

let tmpFolder: tmp.DirectoryResult
let dataSource: DataSource
let order: InsertionOrder

beforeEach(async () => {
  tmpFolder = await tmp.dir({ unsafeCleanup: true })
  const filename = `${tmpFolder.path}/tmp-ceramic.sqlite`
  dataSource = new DataSource({
    type: 'sqlite',
    database: filename,
  })
  await dataSource.initialize()
  const knexConnection = knex({
    client: 'sqlite3',
    useNullAsDefault: true,
    connection: {
      filename: filename,
    },
  })
  const indexAPI = new SqliteIndexApi(dataSource, knexConnection, MODELS_TO_INDEX)
  await indexAPI.init()
  order = new InsertionOrder(knexConnection)
  // Rows in insertion-order.fixture.csv are in insertion order.
  // The responses in the tests below are ok if they are in the same order as in the CSV.
  const rows = await readCsvFixture(new URL('./insertion-order.fixture.csv', import.meta.url))
  for (const row of rows) {
    await indexAPI.indexStream(row)
  }
  EXPECTED = rows.map((r) => r.streamID.toString())
})

afterEach(async () => {
  await dataSource.close()
  await tmpFolder.cleanup()
})

test('forward pagination', async () => {
  const pageSize = 5
  const pages = chunks(EXPECTED, pageSize)
  let afterCursor: string | undefined = undefined
  for (let i = 0; i < pages.length; i++) {
    const result = await order.page({
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
  const pages = chunks(EXPECTED.reverse(), pageSize).map((arr) => arr.reverse())
  let beforeCursor: string | undefined = undefined
  for (let i = 0; i < pages.length; i++) {
    const result = await order.page({
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

test('filtered by account', async () => {
  const presentAccount = 'did:key:foo' // We have that in the populated table
  const absentAccount = 'did:key:blah' // We do not have that in the populated table
  const withPresentAccount = await order.page({
    model: MODEL,
    account: presentAccount,
    first: 5,
  })
  expect(withPresentAccount.entries.map(String)).toEqual(EXPECTED.slice(0, 5))
  // Should return an empty page
  const withAbsentAccount = await order.page({
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
