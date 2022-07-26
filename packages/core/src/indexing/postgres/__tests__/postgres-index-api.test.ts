import { jest } from '@jest/globals'
import { PostgresIndexApi } from '../postgres-index-api.js'
import { StreamID } from '@ceramicnetwork/streamid'
import knex, { Knex } from 'knex'
import pgSetup from '@databases/pg-test/jest/globalSetup'
import pgTeardown from '@databases/pg-test/jest/globalTeardown'
import { asTableName } from '../../as-table-name.util.js'
import { IndexQueryNotAvailableError } from '../../index-query-not-available.error.js'
import { listMidTables } from '../init-tables.js'
import { Model } from '@ceramicnetwork/stream-model'

const STREAM_ID_A = 'kjzl6cwe1jw145m7jxh4jpa6iw1ps3jcjordpo81e0w04krcpz8knxvg5ygiabd'
const STREAM_ID_B = 'kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s'
const CONTROLLER = 'did:key:foo'

let dbConnection: Knex
jest.setTimeout(150000) // 2.5mins timeout for initial docker fetch+init

beforeAll(async () => {
  await pgSetup()
})

beforeEach(async () => {
  dbConnection = knex({
    client: 'pg',
    connection: process.env.DATABASE_URL,
  })
})

afterEach(async () => {
  await dropTables()
  await dbConnection.destroy()
})

export async function dropTables() {
  await dbConnection.schema.dropTableIfExists(Model.MODEL.toString())
  await dbConnection.schema.dropTableIfExists(STREAM_ID_A)
  await dbConnection.schema.dropTableIfExists(STREAM_ID_B)
}

afterAll(async () => {
  await pgTeardown()
})

describe('init', () => {
  describe('create tables', () => {
    test('create new table from scratch', async () => {
      const modelsToIndex = [StreamID.fromString(STREAM_ID_A)]
      const indexApi = new PostgresIndexApi(dbConnection, modelsToIndex, true)
      await indexApi.init()
      const created = await listMidTables(dbConnection)
      const tableNames = modelsToIndex.map(asTableName)
      expect(created).toEqual(tableNames)
    })

    test('table creation is idempotent', async () => {
      const modelsToIndex = [Model.MODEL, StreamID.fromString(STREAM_ID_A)]
      const indexApi = new PostgresIndexApi(dbConnection, modelsToIndex, true)
      await indexApi.init()
      await indexApi.init()
      const created = await listMidTables(dbConnection)
      const tableNames = modelsToIndex.map(asTableName)
      expect(created).toEqual(tableNames)
    })

    test('create new table from scratch but fail table validation', async () => {
      const INVALID_TABLE_STRUCTURE = {
        stream_id: {
          type: 'character varying',
          maxLength: 254,
          nullable: false,
          defaultValue: null,
        },
      }

      const modelsToIndex = [StreamID.fromString(STREAM_ID_A)]
      const indexApi = new PostgresIndexApi(dbConnection, modelsToIndex, true)
      await indexApi.init()
      const created = await listMidTables(dbConnection)
      const tableNames = modelsToIndex.map(asTableName)
      expect(created).toEqual(tableNames)
      await expect(indexApi.verify(INVALID_TABLE_STRUCTURE)).rejects.toThrow(
        /Schema verification failed for index/
      )
    })

    test('create new table with existing ones', async () => {
      // First init with one model
      const modelsA = [StreamID.fromString(STREAM_ID_A)]
      const indexApiA = new PostgresIndexApi(dbConnection, modelsA, true)
      await indexApiA.init()
      const createdA = await listMidTables(dbConnection)
      const tableNamesA = modelsA.map(asTableName)
      expect(createdA).toEqual(tableNamesA)

      // Next add another one
      const modelsB = [...modelsA, StreamID.fromString(STREAM_ID_B)]
      const indexApiB = new PostgresIndexApi(dbConnection, modelsB, true)
      await indexApiB.init()
      const createdB = await listMidTables(dbConnection)
      const tableNamesB = modelsB.map(asTableName)
      createdB.sort()
      tableNamesB.sort()
      expect(createdB).toEqual(tableNamesB)
    })
  })
})

describe('close', () => {
  test('destroys knex connection', async () => {
    const fauxDbConnection = {
      destroy: jest.fn(),
    } as unknown as Knex
    const indexApi = new PostgresIndexApi(fauxDbConnection, [], true)
    await indexApi.close()
    expect(fauxDbConnection.destroy).toBeCalled()
  })
})

/**
 * Difference between `a` and `b` timestamps is less than or equal to `deltaS`.
 */
function closeDates(a: Date, b: Date, deltaS = 1) {
  const aSeconds = a.getSeconds()
  const bSeconds = b.getSeconds()
  return Math.abs(aSeconds - bSeconds) <= deltaS
}

describe('indexStream', () => {
  const MODELS_TO_INDEX = [STREAM_ID_A, STREAM_ID_B].map(StreamID.fromString)
  const STREAM_CONTENT = {
    model: MODELS_TO_INDEX[0],
    streamID: StreamID.fromString(STREAM_ID_B),
    controller: CONTROLLER,
    lastAnchor: null,
    firstAnchor: null,
  }

  let indexApi: PostgresIndexApi
  beforeEach(async () => {
    indexApi = new PostgresIndexApi(dbConnection, MODELS_TO_INDEX, true)
    await indexApi.init()
  })

  test('new stream', async () => {
    const now = new Date()
    await indexApi.indexStream(STREAM_CONTENT)
    const result: Array<any> = await dbConnection.from(`${MODELS_TO_INDEX[0]}`).select('*')
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
    const result: Array<any> = await dbConnection.from(`${MODELS_TO_INDEX[0]}`).select('*')
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

describe('page', () => {
  const FAUX_DB_CONNECTION = {} as unknown as Knex

  test('call the order if historical sync is allowed', async () => {
    const indexApi = new PostgresIndexApi(FAUX_DB_CONNECTION, [], true)
    const mockPage = jest.fn(async () => {
      return { edges: [], pageInfo: { hasNextPage: false, hasPreviousPage: false } }
    })
    indexApi.insertionOrder.page = mockPage
    await indexApi.page({ model: STREAM_ID_A, first: 100 })
    expect(mockPage).toBeCalled()
  })
  test('throw if historical sync is not allowed', async () => {
    const indexApi = new PostgresIndexApi(FAUX_DB_CONNECTION, [], false)
    await expect(indexApi.page({ model: STREAM_ID_A, first: 100 })).rejects.toThrow(
      IndexQueryNotAvailableError
    )
  })
})
