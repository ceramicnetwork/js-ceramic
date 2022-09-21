import tmp from 'tmp-promise'
import knex, { Knex } from 'knex'
import { StreamID } from '@ceramicnetwork/streamid'
import { SqliteIndexApi } from '../sqlite-index-api.js'
import { readCsvFixture } from './read-csv-fixture.util.js'
import { chunks } from '../../../__tests__/chunks.util.js'
import { InsertionOrder } from '../insertion-order.js'
import { LoggerProvider } from '@ceramicnetwork/common'

const MODEL_ID = 'kjzl6cwe1jw145m7jxh4jpa6iw1ps3jcjordpo81e0w04krcpz8knxvg5ygiabd'
const MODELS_TO_INDEX = [StreamID.fromString(MODEL_ID)]
const MODEL = MODELS_TO_INDEX[0]
const logger = new LoggerProvider().getDiagnosticsLogger()

let EXPECTED: Array<string>

let tmpFolder: tmp.DirectoryResult
let order: InsertionOrder
let dbConnection: Knex

beforeEach(async () => {
  tmpFolder = await tmp.dir({ unsafeCleanup: true })
  const filename = `${tmpFolder.path}/tmp-ceramic.sqlite`
  dbConnection = knex({
    client: 'sqlite3',
    useNullAsDefault: true,
    connection: {
      filename: filename,
    },
  })
  const indexAPI = new SqliteIndexApi(dbConnection, true, logger)
  await indexAPI.indexModels(
    MODELS_TO_INDEX.map((model) => {
      return { model }
    })
  )
  order = new InsertionOrder(dbConnection)
  // Rows in insertion-order.fixture.csv are in insertion order.
  // The responses in the tests below are ok if they are in the same order as in the CSV.
  const rows = await readCsvFixture(new URL('./insertion-order.fixture.csv', import.meta.url))
  for (const row of rows) {
    await indexAPI.indexStream(row)
  }
  EXPECTED = rows.map((r) => r.streamID.toString())
})

afterEach(async () => {
  await dbConnection.destroy()
  await tmpFolder.cleanup()
})

describe('forward pagination', () => {
  test('pagination', async () => {
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
      expect(result.edges.length).toEqual(expected.length)
      expect(result.edges.map((e) => String(e.node))).toEqual(expected)
      const hasNextPage = Boolean(pages[i + 1])
      expect(result.pageInfo.hasNextPage).toEqual(hasNextPage)
      expect(result.pageInfo.hasPreviousPage).toEqual(false)
      expect(result.pageInfo.endCursor).toBeTruthy()
      expect(result.pageInfo.startCursor).toBeTruthy()
    }
  })
  test('using edge cursor', async () => {
    const pageSize = 5
    const pages = chunks(EXPECTED, pageSize)
    const expectedFirstPage = pages[0]
    const firstPage = await order.page({
      model: MODEL,
      first: pageSize,
    })
    expect(firstPage.edges.map((e) => String(e.node))).toEqual(expectedFirstPage)
    const secondEntry = firstPage.edges[1]
    const customPage = await order.page({
      model: MODEL,
      first: 3,
      after: secondEntry.cursor,
    })
    // Returns 3 entries after the 2nd one
    expect(customPage.edges.length).toEqual(3)
    expect(customPage.edges.map((e) => String(e.node))).toEqual(expectedFirstPage.slice(2))
  })
})

describe('backward pagination', () => {
  const PAGE_SIZE = 5
  let pages: Array<Array<string>>
  beforeEach(() => {
    pages = chunks(EXPECTED.reverse(), PAGE_SIZE).map((arr) => arr.reverse())
  })

  test('pagination', async () => {
    let beforeCursor: string | undefined = undefined
    for (let i = 0; i < pages.length; i++) {
      const result = await order.page({
        model: MODEL,
        last: PAGE_SIZE,
        before: beforeCursor,
      })
      beforeCursor = result.pageInfo.startCursor
      const expected = pages[i]
      expect(result.edges.length).toEqual(expected.length)
      expect(result.edges.map((e) => String(e.node))).toEqual(expected)
      const hasPreviousPage = Boolean(pages[i + 1])
      expect(result.pageInfo.hasNextPage).toEqual(false)
      expect(result.pageInfo.hasPreviousPage).toEqual(hasPreviousPage)
      expect(result.pageInfo.endCursor).toBeTruthy()
      expect(result.pageInfo.startCursor).toBeTruthy()
    }
  })

  test('using edge cursor', async () => {
    const expectedFirstPage = pages[0]
    const firstPage = await order.page({
      model: MODEL,
      last: PAGE_SIZE,
    })
    expect(firstPage.edges.map((e) => String(e.node))).toEqual(expectedFirstPage)
    const secondLastEntry = firstPage.edges[firstPage.edges.length - 2]
    const customPage = await order.page({
      model: MODEL,
      last: 3,
      before: secondLastEntry.cursor,
    })
    // Returns 3 entries before the 2nd last one
    expect(customPage.edges.length).toEqual(3)
    expect(customPage.edges.map((e) => String(e.node))).toEqual(expectedFirstPage.slice(0, 3))
  })
})

test('filtered by account', async () => {
  const presentAccount = 'did:key:foo' // We have that in the populated table
  const absentAccount = 'did:key:blah' // We do not have that in the populated table
  const withPresentAccount = await order.page({
    model: MODEL,
    account: presentAccount,
    first: 5,
  })
  expect(withPresentAccount.edges.map((e) => String(e.node))).toEqual(EXPECTED.slice(0, 5))
  // Should return an empty page
  const withAbsentAccount = await order.page({
    model: MODEL,
    account: absentAccount,
    first: 5,
  })
  expect(withAbsentAccount.edges).toEqual([])
  expect(withAbsentAccount.pageInfo.hasNextPage).toEqual(false)
  expect(withAbsentAccount.pageInfo.hasPreviousPage).toEqual(false)
  expect(withAbsentAccount.pageInfo.endCursor).toBeUndefined()
  expect(withAbsentAccount.pageInfo.startCursor).toBeUndefined()
})
