import { jest } from '@jest/globals'
import tmp from 'tmp-promise'
import { asTimestamp, SqliteIndexApi } from '../sqlite-index-api.js'
import { StreamID } from '@ceramicnetwork/streamid'
import { listMidTables } from '../init-tables.js'
import knex, { Knex } from 'knex'
import { IndexQueryNotAvailableError } from '../../index-query-not-available.error.js'
import { asTableName } from '../../as-table-name.util.js'
import { Model } from '@ceramicnetwork/stream-model'
import { LoggerProvider } from '@ceramicnetwork/common'
import { CID } from 'multiformats/cid'
import { INDEXED_MODEL_CONFIG_TABLE_NAME, IndexModelArgs } from '../../database-index-api.js'
import {
  COMMON_TABLE_STRUCTURE,
  RELATION_COLUMN_STRUCTURE,
  CONFIG_TABLE_MODEL_INDEX_STRUCTURE,
} from '../migrations/cdb-schema-verfication.js'

const STREAM_ID_A = 'kjzl6cwe1jw145m7jxh4jpa6iw1ps3jcjordpo81e0w04krcpz8knxvg5ygiabd'
const STREAM_ID_B = 'kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s'
const CONTROLLER = 'did:key:foo'
const STREAM_TEST_DATA_PROFILE = JSON.stringify({
  id: 'bea4d783-6496-4a28-bf02-6603e56edf0a',
  name: 'Joeline Bradshaw',
  address: 'Attitudes Road 5270, Adena, Dominica, 509754',
  birthDate: '02.02.2009',
  email: 'zebediah_mundygg3@us.va',
  settings: {
    dark_mode: true,
  },
})
const FAKE_CID = CID.parse('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu')
const logger = new LoggerProvider().getDiagnosticsLogger()

let tmpFolder: tmp.DirectoryResult
let dbConnection: Knex

function modelsToIndexArgs(models: Array<StreamID>): Array<IndexModelArgs> {
  return models.map((model) => {
    return { model }
  })
}

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
})

afterEach(async () => {
  await dbConnection.destroy()
  await tmpFolder.cleanup()
})

describe('init', () => {
  describe('create tables', () => {
    test('create new table from scratch', async () => {
      const modelToIndex = StreamID.fromString(STREAM_ID_A)
      const indexApi = new SqliteIndexApi(dbConnection, true, logger)
      await indexApi.init()
      await indexApi.indexModels(modelsToIndexArgs([modelToIndex]))
      const created = await listMidTables(dbConnection)
      const tableName = asTableName(modelToIndex)
      expect(created.length).toEqual(1)
      expect(created[0]).toEqual(tableName)

      // Built-in table verification should pass
      await expect(indexApi.verifyTables(modelsToIndexArgs([modelToIndex]))).resolves.not.toThrow()

      // Also manually check MID table structure
      const midColumns = await dbConnection.table(asTableName(modelToIndex)).columnInfo()
      expect(JSON.stringify(columns)).toEqual(JSON.stringify(COMMON_TABLE_STRUCTURE))

      // Also manually check config table structure
      const configTableColumns = await dbConnection.table(asTableName(INDEXED_MODEL_CONFIG_TABLE_NAME)).columnInfo()
      expect(JSON.stringify(columns)).toEqual(JSON.stringify(CONFIG_TABLE_MODEL_INDEX_STRUCTURE))
    })

    test('create new table with relations', async () => {
      const indexModelsArgs: Array<IndexModelArgs> = [
        {
          model: StreamID.fromString(STREAM_ID_A),
          relations: { fooRelation: { type: 'account' } },
        },
      ]
      const indexApi = new SqliteIndexApi(dbConnection, true, logger)
      await indexApi.init()
      await indexApi.indexModels(indexModelsArgs)
      const created = await listMidTables(dbConnection)
      const tableNames = indexModelsArgs.map((args) => `${asTableName(args.model)}`)
      expect(created).toEqual(tableNames)

      await expect(indexApi.verifyTables(indexModelsArgs)).resolves.not.toThrow()

      // Also manually check table structure
      const columns = await dbConnection.table(asTableName(indexModelsArgs[0].model)).columnInfo()
      const expectedTableStructure = Object.assign({}, COMMON_TABLE_STRUCTURE, {
        fooRelation: RELATION_COLUMN_STRUCTURE,
      })
      expect(JSON.stringify(columns)).toEqual(JSON.stringify(expectedTableStructure))
    })

    test('table creation is idempotent', async () => {
      const modelsToIndex = [StreamID.fromString(STREAM_ID_A), Model.MODEL]
      const indexApi = new SqliteIndexApi(dbConnection, true, logger)
      await indexApi.init()
      await indexApi.indexModels(modelsToIndexArgs(modelsToIndex))
      // Index the same models again to make sure we don't error trying to re-create the tables
      await indexApi.indexModels(modelsToIndexArgs(modelsToIndex))
      const created = await listMidTables(dbConnection)
      const tableNames = modelsToIndex.map((m) => `${m.toString()}`)
      expect(created).toEqual(tableNames)
    })

    test('create new table with existing ones', async () => {
      // First init with one model
      const modelsA = [StreamID.fromString(STREAM_ID_A)]
      const indexApiA = new SqliteIndexApi(dbConnection, true, logger)
      await indexApiA.init()
      await indexApiA.indexModels(modelsToIndexArgs(modelsA))
      const createdA = await listMidTables(dbConnection)
      const tableNamesA = modelsA.map((m) => `${m.toString()}`)
      expect(createdA).toEqual(tableNamesA)

      // Next add another one
      const modelsB = [...modelsA, StreamID.fromString(STREAM_ID_B)]
      const indexApiB = new SqliteIndexApi(dbConnection, true, logger)
      await indexApiB.indexModels(modelsToIndexArgs(modelsB))
      const createdB = await listMidTables(dbConnection)
      const tableNamesB = modelsB.map((m) => `${m.toString()}`)
      expect(createdB).toEqual(tableNamesB)
    })
  })

  describe('table validation tests', () => {
    /**
     * This test exists mostly to validate the rest of the validation tests.
     * Those tests test that validation fails in certain cases by changing one thing
     * off from what we expect to pass validation.  This test confirms that we are in fact
     * creating tables in this unit test in the correct way that could pass validation if not
     * for the intentional changes we make in the following test.
     *
     * NOTE: If this test ever fails and needs updating, update the other validation tests
     * as well to make sure that validation is failing for the reason we expect.
     */
    test('Can manually create table that passes validation', async () => {
      const modelToIndex = StreamID.fromString(STREAM_ID_A)
      const indexApi = new SqliteIndexApi(dbConnection, true, logger)
      await indexApi.init()

      // Create the table in the database with all expected fields but one (leaving off 'updated_at')
      await dbConnection.schema.createTable(asTableName(modelToIndex), (table) => {
        table.string('stream_id', 1024).primary().unique().notNullable()
        table.string('controller_did', 1024).notNullable()
        table.string('stream_content').notNullable()
        table.string('tip').notNullable()
        table.integer('last_anchored_at').nullable()
        table.integer('first_anchored_at').nullable()
        table.integer('created_at').notNullable()
        table.integer('updated_at').notNullable()
      })

      await expect(indexApi.verifyTables(modelsToIndexArgs([modelToIndex]))).resolves.not.toThrow()
    })

    test('Fail table validation', async () => {
      const modelToIndex = StreamID.fromString(STREAM_ID_A)
      const indexApi = new SqliteIndexApi(dbConnection, true, logger)
      await indexApi.init()

      // Create the table in the database with all expected fields but one (leaving off 'updated_at')
      await dbConnection.schema.createTable(asTableName(modelToIndex), (table) => {
        table.string('stream_id', 1024).primary().unique().notNullable()
        table.string('controller_did', 1024).notNullable()
        table.string('stream_content').notNullable()
        table.string('tip').notNullable()
        table.integer('last_anchored_at').nullable()
        table.integer('first_anchored_at').nullable()
        table.integer('created_at').notNullable()
      })

      await expect(indexApi.verifyTables(modelsToIndexArgs([modelToIndex]))).rejects.toThrow(
        /Schema verification failed for index/
      )
    })

    test('Fail table validation if relation column missing', async () => {
      const modelToIndex = StreamID.fromString(STREAM_ID_A)
      const indexModelsArgs: Array<IndexModelArgs> = [
        {
          model: StreamID.fromString(STREAM_ID_A),
          relations: { fooRelation: { type: 'account' } },
        },
      ]

      const indexApi = new SqliteIndexApi(dbConnection, true, logger)
      await indexApi.init()

      // Create the table in the database with all expected fields but one (leaving off 'updated_at')
      await dbConnection.schema.createTable(asTableName(modelToIndex), (table) => {
        table.string('stream_id', 1024).primary().unique().notNullable()
        table.string('controller_did', 1024).notNullable()
        table.string('stream_content').notNullable()
        table.string('tip').notNullable()
        table.integer('last_anchored_at').nullable()
        table.integer('first_anchored_at').nullable()
        table.integer('created_at').notNullable()
        table.integer('updated_at').notNullable()
      })

      await expect(indexApi.verifyTables(indexModelsArgs)).rejects.toThrow(
        /Schema verification failed for index/
      )
    })
  })
})

describe('close', () => {
  test('destroys knex connection', async () => {
    const fauxDbConnection = {
      destroy: jest.fn(),
    } as unknown as Knex
    const indexApi = new SqliteIndexApi(fauxDbConnection, [], true, logger)
    await indexApi.close()
    expect(fauxDbConnection.destroy).toBeCalled()
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

describe('indexModels', () => {
  test('populates the INDEXED_MODEL_CONFIG_TABLE_NAME table on indexModels()', async () => {
    const modelsToIndex = [StreamID.fromString(STREAM_ID_A), Model.MODEL]
    const indexApi = new SqliteIndexApi(dbConnection, true, logger)
    await indexApi.init()
    await indexApi.indexModels(modelsToIndexArgs(modelsToIndex))

    expect(await dbConnection(INDEXED_MODEL_CONFIG_TABLE_NAME)
      .select('model', 'is_indexed')
      .orderBy('model', 'desc')
    ).toEqual([
      {
        "model": "kjzl6cwe1jw145m7jxh4jpa6iw1ps3jcjordpo81e0w04krcpz8knxvg5ygiabd",
        "is_indexed": 1
      },
      {
        "model": "kh4q0ozorrgaq2mezktnrmdwleo1d",
        "is_indexed": 1
      }
    ])
  })

  test('updates the INDEXED_MODEL_CONFIG_TABLE_NAME table on stopIndexingModels()', async () => {
    const modelsToIndex = [StreamID.fromString(STREAM_ID_A), Model.MODEL]
    const indexApi = new SqliteIndexApi(dbConnection, true, logger)
    await indexApi.init()
    await indexApi.indexModels(modelsToIndexArgs(modelsToIndex))
    await indexApi.stopIndexingModels([StreamID.fromString(STREAM_ID_A)])

    expect(await dbConnection(INDEXED_MODEL_CONFIG_TABLE_NAME)
      .select('model', 'is_indexed')
      .orderBy('model', 'desc')
    ).toEqual([
      {
        "model": "kjzl6cwe1jw145m7jxh4jpa6iw1ps3jcjordpo81e0w04krcpz8knxvg5ygiabd",
        "is_indexed": 0
      },
      {
        "model": "kh4q0ozorrgaq2mezktnrmdwleo1d",
        "is_indexed": 1
      }
    ])
  })

  test('re-indexing models', async () => {
    const modelsToIndex = [StreamID.fromString(STREAM_ID_A), Model.MODEL]
    const indexApi = new SqliteIndexApi(dbConnection, true, logger)
    await indexApi.init()

    await indexApi.indexModels(modelsToIndexArgs(modelsToIndex))
    expect(await dbConnection(INDEXED_MODEL_CONFIG_TABLE_NAME)
      .select('model', 'is_indexed')
      .orderBy('model', 'desc')
    ).toEqual([
      {
        "model": "kjzl6cwe1jw145m7jxh4jpa6iw1ps3jcjordpo81e0w04krcpz8knxvg5ygiabd",
        "is_indexed": 1
      },
      {
        "model": "kh4q0ozorrgaq2mezktnrmdwleo1d",
        "is_indexed": 1
      }
    ])


    await indexApi.stopIndexingModels([StreamID.fromString(STREAM_ID_A)])
    expect(await dbConnection(INDEXED_MODEL_CONFIG_TABLE_NAME)
      .select('model', 'is_indexed')
      .orderBy('model', 'desc')
    ).toEqual([
      {
        "model": "kjzl6cwe1jw145m7jxh4jpa6iw1ps3jcjordpo81e0w04krcpz8knxvg5ygiabd",
        "is_indexed": 0
      },
      {
        "model": "kh4q0ozorrgaq2mezktnrmdwleo1d",
        "is_indexed": 1
      }
    ])

    await indexApi.indexModels(modelsToIndexArgs([StreamID.fromString(STREAM_ID_A)]))
    expect(await dbConnection(INDEXED_MODEL_CONFIG_TABLE_NAME)
      .select('model', 'is_indexed')
      .orderBy('model', 'desc')
    ).toEqual([
      {
        "model": "kjzl6cwe1jw145m7jxh4jpa6iw1ps3jcjordpo81e0w04krcpz8knxvg5ygiabd",
        "is_indexed": 1
      },
      {
        "model": "kh4q0ozorrgaq2mezktnrmdwleo1d",
        "is_indexed": 1
      }
    ])
  })

  test('modelsToIndex is properly populated after init()', async () => {
    const modelsToIndex = [StreamID.fromString(STREAM_ID_A), Model.MODEL]
    const indexApi = new SqliteIndexApi(dbConnection, true, logger)
    await indexApi.init()
    await indexApi.indexModels(modelsToIndexArgs(modelsToIndex))

    const anotherIndexApi = new SqliteIndexApi(dbConnection, true, logger)
    await anotherIndexApi.init()

    expect(anotherIndexApi.getActiveModelsToIndex().map(streamID => streamID.toString()).sort())
      .toEqual([
        "kh4q0ozorrgaq2mezktnrmdwleo1d",
        "kjzl6cwe1jw145m7jxh4jpa6iw1ps3jcjordpo81e0w04krcpz8knxvg5ygiabd"
      ])
  })

  test('modelsToIndex is properly updated after indexModels()', async () => {
    const modelsToIndex = [StreamID.fromString(STREAM_ID_A), Model.MODEL]
    const indexApi = new SqliteIndexApi(dbConnection, true, logger)
    await indexApi.init()
    expect(indexApi.getActiveModelsToIndex()).toEqual([])
    await indexApi.indexModels(modelsToIndexArgs(modelsToIndex))
    expect(indexApi.getActiveModelsToIndex().map(streamID => streamID.toString()).sort()).toEqual([
      "kh4q0ozorrgaq2mezktnrmdwleo1d",
      "kjzl6cwe1jw145m7jxh4jpa6iw1ps3jcjordpo81e0w04krcpz8knxvg5ygiabd"
    ])
  })

  test('modelsToIndex is properly updated after stopIndexingModels()', async () => {
    const modelsToIndex = [StreamID.fromString(STREAM_ID_A), Model.MODEL]
    const indexApi = new SqliteIndexApi(dbConnection, true, logger)
    await indexApi.init()
    await indexApi.indexModels(modelsToIndexArgs(modelsToIndex))
    expect(indexApi.getActiveModelsToIndex().map(streamID => streamID.toString()).sort()).toEqual([
      "kh4q0ozorrgaq2mezktnrmdwleo1d",
      "kjzl6cwe1jw145m7jxh4jpa6iw1ps3jcjordpo81e0w04krcpz8knxvg5ygiabd"
    ])
    await indexApi.stopIndexingModels([StreamID.fromString("kjzl6cwe1jw145m7jxh4jpa6iw1ps3jcjordpo81e0w04krcpz8knxvg5ygiabd")])
    expect(indexApi.getActiveModelsToIndex().map(streamID => streamID.toString())).toEqual([
      "kh4q0ozorrgaq2mezktnrmdwleo1d"
    ])
  })
})

describe('indexStream', () => {
  const MODELS_TO_INDEX = [STREAM_ID_A, STREAM_ID_B].map(StreamID.fromString)
  const STREAM_CONTENT = {
    model: MODELS_TO_INDEX[0],
    streamID: StreamID.fromString(STREAM_ID_B),
    controller: CONTROLLER,
    streamContent: STREAM_TEST_DATA_PROFILE,
    tip: FAKE_CID,
    lastAnchor: null,
    firstAnchor: null,
  }

  let indexApi: SqliteIndexApi
  beforeEach(async () => {
    indexApi = new SqliteIndexApi(dbConnection, true, logger)
    await indexApi.init()
    await indexApi.indexModels(modelsToIndexArgs(MODELS_TO_INDEX))
  })

  test('new stream', async () => {
    const now = new Date()
    await indexApi.indexStream(STREAM_CONTENT)
    const result: Array<any> = await dbConnection.from(`${MODELS_TO_INDEX[0]}`).select('*')
    expect(result.length).toEqual(1)
    const raw = result[0]
    expect(raw.stream_id).toEqual(STREAM_ID_B)
    expect(raw.controller_did).toEqual(CONTROLLER)
    expect(raw.stream_content).toEqual(STREAM_TEST_DATA_PROFILE)
    expect(raw.last_anchored_at).toBeNull()
    expect(raw.first_anchored_at).toBeNull()
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
      firstAnchor: updateTime,
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
    const firstAnchor = new Date(raw.last_anchored_at)
    expect(closeDates(firstAnchor, updateTime)).toBeTruthy()
    const updatedAt = new Date(raw.updated_at)
    expect(closeDates(updatedAt, updateTime)).toBeTruthy()
    const createdAt = new Date(raw.created_at)
    expect(closeDates(createdAt, createTime)).toBeTruthy()
  })
})

describe('page', () => {
  const FAUX_DB_CONNECTION = {} as unknown as Knex

  test('call the order if historical sync is allowed', async () => {
    const indexApi = new SqliteIndexApi(FAUX_DB_CONNECTION, true, logger)
    const mockPage = jest.fn(async () => {
      return { edges: [], pageInfo: { hasNextPage: false, hasPreviousPage: false } }
    })
    indexApi.insertionOrder.page = mockPage
    await indexApi.page({ model: STREAM_ID_A, first: 100 })
    expect(mockPage).toBeCalled()
  })
  test('throw if historical sync is not allowed', async () => {
    const indexApi = new SqliteIndexApi(FAUX_DB_CONNECTION, false, logger)
    await expect(indexApi.page({ model: STREAM_ID_A, first: 100 })).rejects.toThrow(
      IndexQueryNotAvailableError
    )
  })
})
