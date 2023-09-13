import { jest } from '@jest/globals'
import { StreamID } from '@ceramicnetwork/streamid'
import knex, { Knex } from 'knex'
import tmp from 'tmp-promise'
import pgSetup from '@databases/pg-test/jest/globalSetup'
import pgTeardown from '@databases/pg-test/jest/globalTeardown'
import { asTableName } from '../as-table-name.util.js'
import { IndexQueryNotAvailableError } from '../index-query-not-available.error.js'
import { Model } from '@ceramicnetwork/stream-model'
import { LoggerProvider, Networks } from '@ceramicnetwork/common'
import { CID } from 'multiformats/cid'
import {
  asTimestamp,
  fieldsIndexName,
  INDEXED_MODEL_CONFIG_TABLE_NAME,
  IndexModelArgs,
  PostgresIndexApi,
  SqliteIndexApi,
} from '../database-index-api.js'
import {
  DatabaseType,
  defaultIndices,
  migrateConfigTable,
} from '../migrations/1-create-model-table.js'
import { STRUCTURES } from '../migrations/cdb-schema-verification.js'
import { readCsvFixture } from './read-csv-fixture.util.js'
import { CONFIG_TABLE_NAME } from '../config.js'
import { ISyncQueryApi } from '../history-sync/interfaces.js'
import { TablesManager } from '../tables-manager.js'

const STREAM_ID_A = 'kjzl6cwe1jw145m7jxh4jpa6iw1ps3jcjordpo81e0w04krcpz8knxvg5ygiabd'
const STREAM_ID_B = 'kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s'
const CONTROLLER = 'did:key:foo'
const STREAM_TEST_DATA_PROFILE_A = {
  id: 'bea4d783-6496-4a28-bf02-6603e56edf0a',
  name: 'Joeline Bradshaw',
  address: 'Attitudes Road 5270, Adena, Dominica, 509754',
  birthDate: '02.02.2009',
  email: 'zebediah_mundygg3@us.va',
  settings: {
    dark_mode: true,
  },
}
const STREAM_TEST_DATA_PROFILE_B = {
  id: '509a7076-b4db-476c-8800-88db91c34796',
  name: 'Rainier Enciso',
  address: 'Activation St 7366, Krasnoyarsk, Mauritius, 875222',
  birthDate: '29.12.1974',
  email: 'dia_demelodked@toddler.jq',
  settings: {
    dark_mode: false,
  },
}
const FAKE_CID_A = CID.parse('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_CID_B = CID.parse('bafybeig6xv5nwphfmvcnektpnojts44jqcuam7bmye2pb54adnrtccjlsu')
const logger = new LoggerProvider().getDiagnosticsLogger()

let tmpFolder: tmp.DirectoryResult
let dbConnection: Knex
jest.setTimeout(150000) // 2.5mins timeout for initial docker fetch+init

function modelsToIndexArgs(models: Array<StreamID>): Array<IndexModelArgs> {
  return models.map((model) => {
    return { model }
  })
}

class CompleteQueryApi implements ISyncQueryApi {
  syncComplete(model: string): boolean {
    return true
  }
}

class IncompleteQueryApi implements ISyncQueryApi {
  syncComplete(model: string): boolean {
    return false
  }
}

describe('postgres', () => {
  const STRUCTURE = STRUCTURES[DatabaseType.POSTGRES]

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

  async function dropTables() {
    await dbConnection.schema.dropTableIfExists(CONFIG_TABLE_NAME)
    await dbConnection.schema.dropTableIfExists(INDEXED_MODEL_CONFIG_TABLE_NAME)
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
        const modelToIndex = StreamID.fromString(STREAM_ID_A)
        const indexApi = new PostgresIndexApi(dbConnection, true, logger, Networks.INMEMORY)
        indexApi.setSyncQueryApi(new CompleteQueryApi())
        await indexApi.init()
        await indexApi.indexModels(modelsToIndexArgs([modelToIndex]))
        const created = await indexApi.tablesManager.listMidTables()
        const tableName = asTableName(modelToIndex)
        expect(created.length).toEqual(1)
        expect(created[0]).toEqual(tableName)

        // Built-in table verification should pass
        await expect(
          indexApi.tablesManager.verifyTables(modelsToIndexArgs([modelToIndex]))
        ).resolves.not.toThrow()

        // Also manually check MID table structure
        let columns = await dbConnection.table(asTableName(modelToIndex)).columnInfo()
        expect(JSON.stringify(columns)).toEqual(JSON.stringify(STRUCTURE.COMMON_TABLE))

        // Also manually check config table structure
        columns = await dbConnection
          .table(asTableName(INDEXED_MODEL_CONFIG_TABLE_NAME))
          .columnInfo()
        expect(JSON.stringify(columns)).toEqual(JSON.stringify(STRUCTURE.CONFIG_TABLE_MODEL_INDEX))
      })

      test('create new table with indices', async () => {
        const modelToIndex = StreamID.fromString(STREAM_ID_A)
        const indexApi = new PostgresIndexApi(dbConnection, true, logger, Networks.INMEMORY)
        indexApi.setSyncQueryApi(new CompleteQueryApi())
        await indexApi.init()
        const modelToIndexArgs = {
          model: modelToIndex,
          indices: [
            {
              name: 'test_model_index',
              fields: [
                {
                  path: ['name'],
                },
                {
                  path: ['address'],
                },
              ],
            },
          ],
        }
        await indexApi.indexModels([modelToIndexArgs])
        const created = await indexApi.tablesManager.listMidTables()
        const tableName = asTableName(modelToIndex)
        expect(created.length).toEqual(1)
        expect(created[0]).toEqual(tableName)

        //verify behavior if we call index again
        await indexApi.indexModels([modelToIndexArgs])
        const created2 = await indexApi.tablesManager.listMidTables()
        const tableName2 = asTableName(modelToIndex)
        expect(created2.length).toEqual(1)
        expect(created2[0]).toEqual(tableName2)

        // Built-in table verification should pass
        await expect(indexApi.tablesManager.verifyTables([modelToIndexArgs])).resolves.not.toThrow()

        // Also manually check MID table structure
        let columns = await dbConnection.table(asTableName(modelToIndex)).columnInfo()
        expect(JSON.stringify(columns)).toEqual(JSON.stringify(STRUCTURE.COMMON_TABLE))

        // Also manually check config table structure
        columns = await dbConnection
          .table(asTableName(INDEXED_MODEL_CONFIG_TABLE_NAME))
          .columnInfo()
        expect(JSON.stringify(columns)).toEqual(JSON.stringify(STRUCTURE.CONFIG_TABLE_MODEL_INDEX))
      })

      test('create new table with relations', async () => {
        const indexModelsArgs: Array<IndexModelArgs> = [
          {
            model: StreamID.fromString(STREAM_ID_A),
            relations: { fooRelation: { type: 'account' } },
          },
        ]
        const indexApi = new PostgresIndexApi(dbConnection, true, logger, Networks.INMEMORY)
        indexApi.setSyncQueryApi(new CompleteQueryApi())
        await indexApi.init()
        await indexApi.indexModels(indexModelsArgs)
        const created = await indexApi.tablesManager.listMidTables()
        const tableNames = indexModelsArgs.map((args) => `${asTableName(args.model)}`)
        expect(created.sort()).toEqual(tableNames.sort())

        await expect(indexApi.tablesManager.verifyTables(indexModelsArgs)).resolves.not.toThrow()

        // Also manually check table structure
        const columns = await dbConnection.table(asTableName(indexModelsArgs[0].model)).columnInfo()
        const expectedTableStructure = Object.assign({}, STRUCTURE.COMMON_TABLE, {
          custom_fooRelation: STRUCTURE.RELATION_COLUMN,
        })
        expect(JSON.stringify(columns)).toEqual(JSON.stringify(expectedTableStructure))
      })

      test('table creation is idempotent', async () => {
        const modelsToIndex = [{ model: Model.MODEL }, { model: StreamID.fromString(STREAM_ID_A) }]
        const indexApi = new PostgresIndexApi(dbConnection, true, logger, Networks.INMEMORY)
        indexApi.setSyncQueryApi(new CompleteQueryApi())
        await indexApi.init()
        await indexApi.indexModels(modelsToIndex)
        // Index the same models again to make sure we don't error trying to re-create the tables
        await indexApi.indexModels(modelsToIndex)
        const created = await indexApi.tablesManager.listMidTables()
        const tableNames = modelsToIndex.map((idx) => asTableName(idx.model))
        expect(created.sort()).toEqual(tableNames.sort())
      })

      test('create new table with existing ones', async () => {
        // First init with one model
        const modelsA = [StreamID.fromString(STREAM_ID_A)]
        const indexApiA = new PostgresIndexApi(dbConnection, true, logger, Networks.INMEMORY)
        indexApiA.setSyncQueryApi(new CompleteQueryApi())
        await indexApiA.init()
        await indexApiA.indexModels(modelsToIndexArgs(modelsA))
        const createdA = await indexApiA.tablesManager.listMidTables()
        const tableNamesA = modelsA.map(asTableName)
        expect(createdA.sort()).toEqual(tableNamesA.sort())

        // Next add another one
        const modelsB = [...modelsA, StreamID.fromString(STREAM_ID_B)]
        const indexApiB = new PostgresIndexApi(dbConnection, true, logger, Networks.INMEMORY)
        indexApiB.setSyncQueryApi(new CompleteQueryApi())
        await indexApiB.indexModels(modelsToIndexArgs(modelsB))
        const createdB = await indexApiB.tablesManager.listMidTables()
        const tableNamesB = modelsB.map(asTableName)
        expect(createdB.sort()).toEqual(tableNamesB.sort())
      })

      test('checks or persists the network used for indexing', async () => {
        const indexApiA = new PostgresIndexApi(dbConnection, true, logger, Networks.INMEMORY)
        indexApiA.setSyncQueryApi(new CompleteQueryApi())
        await indexApiA.init()

        // Throws if initialized with a different network
        const indexApiB = new PostgresIndexApi(dbConnection, true, logger, Networks.MAINNET)
        indexApiB.setSyncQueryApi(new CompleteQueryApi())
        await expect(indexApiB.init()).rejects.toThrow(
          'Initialization failed for config table: ceramic_config. The database is configured to use the network inmemory but the current network is mainnet.'
        )

        // Does not throw if initialized with the stored network
        const indexApiC = new PostgresIndexApi(dbConnection, true, logger, Networks.INMEMORY)
        indexApiC.setSyncQueryApi(new CompleteQueryApi())
        await expect(indexApiC.init()).resolves.toBeUndefined()
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
        const tableName = asTableName(modelToIndex)
        const indexApi = new PostgresIndexApi(dbConnection, true, logger, Networks.INMEMORY)
        indexApi.setSyncQueryApi(new CompleteQueryApi())
        await indexApi.init()

        // Create the table in the database with all expected fields but one (leaving off 'updated_at')
        await dbConnection.schema.createTable(tableName, (table) => {
          // create unique index name <64 chars that are still capable of being referenced to MID table
          const indexName = tableName.substring(tableName.length - 10)

          table
            .string('stream_id')
            .primary(`idx_${indexName}_pkey`)
            .unique(`constr_${indexName}_unique`)
          table.string('controller_did', 1024).notNullable()
          table.jsonb('stream_content').notNullable()
          table.string('tip').notNullable()
          table.dateTime('last_anchored_at').nullable()
          table.dateTime('first_anchored_at').nullable()
          table.dateTime('created_at').notNullable().defaultTo(dbConnection.fn.now())
          table.dateTime('updated_at').notNullable().defaultTo(dbConnection.fn.now())

          const tableIndices = defaultIndices(tableName)
          for (const indexToCreate of tableIndices.indices) {
            table.index(indexToCreate.keys, indexToCreate.name, {
              storageEngineIndexType: indexToCreate.indexType,
            })
          }
        })

        await expect(
          indexApi.tablesManager.verifyTables(modelsToIndexArgs([modelToIndex]))
        ).resolves.not.toThrow()
      })

      test('Can manually create config table that migrates and passes validation', async () => {
        // Create the table in the database with all expected fields but one (leaving off 'updated_at')
        await dbConnection.schema.createTable(INDEXED_MODEL_CONFIG_TABLE_NAME, (table) => {
          // create unique index name <64 chars that are still capable of being referenced to MID table
          table.string('model', 1024).unique().notNullable().primary()
          table.boolean('is_indexed').notNullable().defaultTo(true)
          table.boolean('enable_historical_sync').notNullable().defaultTo(false)
          table.dateTime('created_at').notNullable().defaultTo(dbConnection.fn.now())
          table.dateTime('updated_at').notNullable().defaultTo(dbConnection.fn.now())
          table.string('updated_by', 1024).notNullable()

          table.index(['is_indexed'], `idx_ceramic_is_indexed`, {
            indexType: 'btree',
          })
        })

        await expect(
          migrateConfigTable(dbConnection, INDEXED_MODEL_CONFIG_TABLE_NAME, true)
        ).resolves.not.toThrow()

        const dbType = DatabaseType.POSTGRES
        const manager = new TablesManager(dbType, dbConnection, logger)

        await expect(
          manager._verifyConfigTable({
            tableName: INDEXED_MODEL_CONFIG_TABLE_NAME,
            validSchema: STRUCTURES[dbType].CONFIG_TABLE_MODEL_INDEX,
          })
        ).resolves.not.toThrow()
      })

      test('Fail table validation', async () => {
        const modelToIndex = StreamID.fromString(STREAM_ID_A)
        const tableName = asTableName(modelToIndex)

        const indexApi = new PostgresIndexApi(dbConnection, true, logger, Networks.INMEMORY)
        indexApi.setSyncQueryApi(new CompleteQueryApi())
        await indexApi.init()

        // Create the table in the database with all expected fields but one (leaving off 'updated_at')
        await dbConnection.schema.createTable(tableName, (table) => {
          // create unique index name <64 chars that are still capable of being referenced to MID table
          const indexName = tableName.substring(tableName.length - 10)

          table
            .string('stream_id')
            .primary(`idx_${indexName}_pkey`)
            .unique(`constr_${indexName}_unique`)
          table.string('controller_did', 1024).notNullable()
          table.jsonb('stream_content').notNullable()
          table.string('tip').notNullable()
          table.dateTime('last_anchored_at').nullable()
          table.dateTime('first_anchored_at').nullable()
          table.dateTime('created_at').notNullable().defaultTo(dbConnection.fn.now())

          const tableIndices = defaultIndices(tableName)
          for (const indexToCreate of tableIndices.indices) {
            if (!indexToCreate.keys.includes('updated_at')) {
              //updated_at not added as part of table
              table.index(indexToCreate.keys, indexToCreate.name, {
                storageEngineIndexType: indexToCreate.indexType,
              })
            }
          }
        })

        await expect(
          indexApi.tablesManager.verifyTables(modelsToIndexArgs([modelToIndex]))
        ).rejects.toThrow(/Schema verification failed for index/)
      })

      test('Fail table validation if indices are missing', async () => {
        const modelToIndex = StreamID.fromString(STREAM_ID_A)
        const tableName = asTableName(modelToIndex)
        const indexApi = new PostgresIndexApi(dbConnection, true, logger, Networks.INMEMORY)
        await indexApi.init()

        // Create the table in the database with all expected fields but one (leaving off 'updated_at')
        await dbConnection.schema.createTable(tableName, (table) => {
          // create unique index name <64 chars that are still capable of being referenced to MID table
          const indexName = tableName.substring(tableName.length - 10)

          table
            .string('stream_id')
            .primary(`idx_${indexName}_pkey`)
            .unique(`constr_${indexName}_unique`)
          table.string('controller_did', 1024).notNullable()
          table.jsonb('stream_content').notNullable()
          table.string('tip').notNullable()
          table.dateTime('last_anchored_at').nullable()
          table.dateTime('first_anchored_at').nullable()
          table.dateTime('created_at').notNullable().defaultTo(dbConnection.fn.now())
          table.dateTime('updated_at').notNullable().defaultTo(dbConnection.fn.now())
        })

        await expect(
          indexApi.tablesManager.verifyTables(modelsToIndexArgs([modelToIndex]))
        ).rejects.toThrow(/Schema verification failed for index/)
      })

      test('Fail table validation if relation column missing', async () => {
        const modelToIndex = StreamID.fromString(STREAM_ID_A)
        const tableName = asTableName(modelToIndex)
        const indexModelsArgs: Array<IndexModelArgs> = [
          {
            model: StreamID.fromString(STREAM_ID_A),
            relations: { fooRelation: { type: 'account' } },
          },
        ]

        const indexApi = new PostgresIndexApi(dbConnection, true, logger, Networks.INMEMORY)
        indexApi.setSyncQueryApi(new CompleteQueryApi())
        await indexApi.init()

        // Create the table in the database with all expected fields but one (leaving off 'updated_at')
        await dbConnection.schema.createTable(tableName, (table) => {
          // create unique index name <64 chars that are still capable of being referenced to MID table
          const indexName = tableName.substring(tableName.length - 10)

          table
            .string('stream_id')
            .primary(`idx_${indexName}_pkey`)
            .unique(`constr_${indexName}_unique`)
          table.string('controller_did', 1024).notNullable()
          table.jsonb('stream_content').notNullable()
          table.string('tip').notNullable()
          table.dateTime('last_anchored_at').nullable()
          table.dateTime('first_anchored_at').nullable()
          table.dateTime('created_at').notNullable().defaultTo(dbConnection.fn.now())
          table.dateTime('updated_at').notNullable().defaultTo(dbConnection.fn.now())

          const tableIndices = defaultIndices(tableName)
          for (const indexToCreate of tableIndices.indices) {
            table.index(indexToCreate.keys, indexToCreate.name, {
              storageEngineIndexType: indexToCreate.indexType,
            })
          }
        })

        await expect(indexApi.tablesManager.verifyTables(indexModelsArgs)).rejects.toThrow(
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
      const indexApi = new PostgresIndexApi(fauxDbConnection, true, logger, Networks.INMEMORY)
      indexApi.setSyncQueryApi(new CompleteQueryApi())
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

  describe('indexModels', () => {
    test('populates the INDEXED_MODEL_CONFIG_TABLE_NAME table on indexModels()', async () => {
      const modelToIndex = StreamID.fromString(STREAM_ID_A)
      const modelToIndexArgs = {
        model: modelToIndex,
        indices: [
          {
            name: 'test_model_index',
            fields: [
              {
                path: ['name'],
              },
              {
                path: ['address'],
              },
            ],
          },
        ],
      }
      const modelsToIndex = [Model.MODEL]
      const indexApi = new PostgresIndexApi(dbConnection, true, logger, Networks.INMEMORY)
      indexApi.setSyncQueryApi(new CompleteQueryApi())
      await indexApi.init()
      await indexApi.indexModels(modelsToIndexArgs(modelsToIndex).concat(modelToIndexArgs))

      expect(
        await dbConnection(INDEXED_MODEL_CONFIG_TABLE_NAME)
          .select('model', 'is_indexed')
          .orderBy('model', 'desc')
      ).toEqual([
        {
          model: 'kjzl6cwe1jw145m7jxh4jpa6iw1ps3jcjordpo81e0w04krcpz8knxvg5ygiabd',
          is_indexed: true,
        },
        {
          model: 'kh4q0ozorrgaq2mezktnrmdwleo1d',
          is_indexed: true,
        },
      ])
    })

    test('updates the INDEXED_MODEL_CONFIG_TABLE_NAME table on stopIndexingModels()', async () => {
      const modelsToIndex = [StreamID.fromString(STREAM_ID_A), Model.MODEL]
      const indexApi = new PostgresIndexApi(dbConnection, true, logger, Networks.INMEMORY)
      indexApi.setSyncQueryApi(new CompleteQueryApi())
      await indexApi.init()
      await indexApi.indexModels(modelsToIndexArgs(modelsToIndex))
      await indexApi.stopIndexingModels([{ streamID: StreamID.fromString(STREAM_ID_A) }])

      expect(
        await dbConnection(INDEXED_MODEL_CONFIG_TABLE_NAME)
          .select('model', 'is_indexed')
          .orderBy('model', 'desc')
      ).toEqual([
        {
          model: 'kjzl6cwe1jw145m7jxh4jpa6iw1ps3jcjordpo81e0w04krcpz8knxvg5ygiabd',
          is_indexed: false,
        },
        {
          model: 'kh4q0ozorrgaq2mezktnrmdwleo1d',
          is_indexed: true,
        },
      ])
    })

    test('re-indexing models', async () => {
      const modelsToIndex = [{ model: StreamID.fromString(STREAM_ID_A) }, { model: Model.MODEL }]
      const indexApi = new PostgresIndexApi(dbConnection, true, logger, Networks.INMEMORY)
      indexApi.setSyncQueryApi(new CompleteQueryApi())
      await indexApi.init()

      await indexApi.indexModels(modelsToIndex)
      expect(
        await dbConnection(INDEXED_MODEL_CONFIG_TABLE_NAME)
          .select('model', 'is_indexed')
          .orderBy('model', 'desc')
      ).toEqual([
        {
          model: 'kjzl6cwe1jw145m7jxh4jpa6iw1ps3jcjordpo81e0w04krcpz8knxvg5ygiabd',
          is_indexed: true,
        },
        {
          model: 'kh4q0ozorrgaq2mezktnrmdwleo1d',
          is_indexed: true,
        },
      ])

      await indexApi.stopIndexingModels([{ streamID: StreamID.fromString(STREAM_ID_A) }])
      expect(
        await dbConnection(INDEXED_MODEL_CONFIG_TABLE_NAME)
          .select('model', 'is_indexed')
          .orderBy('model', 'desc')
      ).toEqual([
        {
          model: 'kjzl6cwe1jw145m7jxh4jpa6iw1ps3jcjordpo81e0w04krcpz8knxvg5ygiabd',
          is_indexed: false,
        },
        {
          model: 'kh4q0ozorrgaq2mezktnrmdwleo1d',
          is_indexed: true,
        },
      ])

      await indexApi.indexModels(modelsToIndexArgs([StreamID.fromString(STREAM_ID_A)]))
      expect(
        await dbConnection(INDEXED_MODEL_CONFIG_TABLE_NAME)
          .select('model', 'is_indexed')
          .orderBy('model', 'desc')
      ).toEqual([
        {
          model: 'kjzl6cwe1jw145m7jxh4jpa6iw1ps3jcjordpo81e0w04krcpz8knxvg5ygiabd',
          is_indexed: true,
        },
        {
          model: 'kh4q0ozorrgaq2mezktnrmdwleo1d',
          is_indexed: true,
        },
      ])
    })

    test('modelsToIndex is properly populated after init()', async () => {
      const modelsToIndex = [StreamID.fromString(STREAM_ID_A), Model.MODEL]
      const indexApi = new PostgresIndexApi(dbConnection, true, logger, Networks.INMEMORY)
      indexApi.setSyncQueryApi(new CompleteQueryApi())
      await indexApi.init()
      await indexApi.indexModels(modelsToIndexArgs(modelsToIndex))

      const anotherIndexApi = new PostgresIndexApi(dbConnection, true, logger, Networks.INMEMORY)
      indexApi.setSyncQueryApi(new CompleteQueryApi())
      await anotherIndexApi.init()

      expect(
        anotherIndexApi
          .getIndexedModels()
          .map((idx) => idx.streamID.toString())
          .sort()
      ).toEqual([
        'kh4q0ozorrgaq2mezktnrmdwleo1d',
        'kjzl6cwe1jw145m7jxh4jpa6iw1ps3jcjordpo81e0w04krcpz8knxvg5ygiabd',
      ])
    })

    test('modelsToIndex is properly updated after indexModels()', async () => {
      const modelsToIndex = [StreamID.fromString(STREAM_ID_A), Model.MODEL]
      const indexApi = new PostgresIndexApi(dbConnection, true, logger, Networks.INMEMORY)
      indexApi.setSyncQueryApi(new CompleteQueryApi())
      await indexApi.init()
      expect(indexApi.getIndexedModels()).toEqual([])
      await indexApi.indexModels(modelsToIndexArgs(modelsToIndex))
      expect(
        indexApi
          .getIndexedModels()
          .map((idx) => idx.streamID.toString())
          .sort()
      ).toEqual([
        'kh4q0ozorrgaq2mezktnrmdwleo1d',
        'kjzl6cwe1jw145m7jxh4jpa6iw1ps3jcjordpo81e0w04krcpz8knxvg5ygiabd',
      ])
    })

    test('modelsToIndex is properly updated after stopIndexingModels()', async () => {
      const modelsToIndex = [StreamID.fromString(STREAM_ID_A), Model.MODEL]
      const indexApi = new PostgresIndexApi(dbConnection, true, logger, Networks.INMEMORY)
      indexApi.setSyncQueryApi(new CompleteQueryApi())
      await indexApi.init()
      await indexApi.indexModels(modelsToIndexArgs(modelsToIndex))
      expect(
        indexApi
          .getIndexedModels()
          .map((idx) => idx.streamID.toString())
          .sort()
      ).toEqual([
        'kh4q0ozorrgaq2mezktnrmdwleo1d',
        'kjzl6cwe1jw145m7jxh4jpa6iw1ps3jcjordpo81e0w04krcpz8knxvg5ygiabd',
      ])
      await indexApi.stopIndexingModels([
        {
          streamID: StreamID.fromString(
            'kjzl6cwe1jw145m7jxh4jpa6iw1ps3jcjordpo81e0w04krcpz8knxvg5ygiabd'
          ),
        },
      ])
      expect(indexApi.getIndexedModels().map((idx) => idx.streamID.toString())).toEqual([
        'kh4q0ozorrgaq2mezktnrmdwleo1d',
      ])
    })
  })

  describe('indexStream', () => {
    const MODELS_TO_INDEX = [STREAM_ID_A, STREAM_ID_B].map(StreamID.fromString)
    const MODEL_DATA = [
      {
        model: StreamID.fromString(STREAM_ID_A),
        indices: [
          {
            name: 'test_model_index',
            fields: [
              {
                path: ['name'],
              },
              {
                path: ['address'],
              },
            ],
          },
        ],
      },
      {
        model: StreamID.fromString(STREAM_ID_B),
      },
    ]
    const STREAM_CONTENT_A = {
      model: MODELS_TO_INDEX[0],
      streamID: StreamID.fromString(STREAM_ID_B),
      streamContent: STREAM_TEST_DATA_PROFILE_A,
      tip: FAKE_CID_A,
      controller: CONTROLLER,
      lastAnchor: null,
      firstAnchor: null,
    }
    const STREAM_CONTENT_B = {
      model: MODELS_TO_INDEX[0],
      streamID: StreamID.fromString(STREAM_ID_A),
      streamContent: STREAM_TEST_DATA_PROFILE_B,
      tip: FAKE_CID_B,
      controller: CONTROLLER,
      lastAnchor: null,
      firstAnchor: null,
    }

    let indexApi: PostgresIndexApi
    beforeEach(async () => {
      indexApi = new PostgresIndexApi(dbConnection, true, logger, Networks.INMEMORY)
      indexApi.setSyncQueryApi(new CompleteQueryApi())
      await indexApi.init()
      await indexApi.indexModels(MODEL_DATA)
    })

    test('new stream', async () => {
      const now = new Date()
      await indexApi.indexStream(STREAM_CONTENT_A)
      const result: Array<any> = await dbConnection.from(`${MODELS_TO_INDEX[0]}`).select('*')
      expect(result.length).toEqual(1)
      const raw = result[0]
      expect(raw.stream_id).toEqual(STREAM_ID_B)
      expect(raw.controller_did).toEqual(CONTROLLER)
      expect(raw.stream_content).toEqual(STREAM_TEST_DATA_PROFILE_A)
      expect(raw.tip).toEqual(FAKE_CID_A.toString())
      expect(raw.last_anchored_at).toBeNull()
      expect(raw.first_anchored_at).toBeNull()
      const createdAt = new Date(raw.created_at)
      const updatedAt = new Date(raw.updated_at)
      expect(closeDates(createdAt, now)).toBeTruthy()
      expect(closeDates(updatedAt, now)).toBeTruthy()
    })

    test('override stream', async () => {
      const createTime = new Date()
      await indexApi.indexStream(STREAM_CONTENT_A)
      const updateTime = new Date(createTime.valueOf() + 5000)
      const updatedStreamContent = {
        ...STREAM_CONTENT_A,
        streamContent: {
          ...STREAM_CONTENT_A.streamContent,
          name: STREAM_CONTENT_A.streamContent.name.concat(' Fauci'),
        },
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
      expect(raw.stream_content).toEqual(updatedStreamContent.streamContent)
    })

    test('verify jsonb index creation and invocation while querying', async () => {
      await indexApi.indexStream(STREAM_CONTENT_A)

      // create index on jsonb content and disable seq scans
      await dbConnection.raw(`SET enable_seqscan = off;`)
      let result = await dbConnection.raw(
        `CREATE INDEX idx_postgres_jsonb ON ${STREAM_ID_A}((stream_content->'settings'->'dark_mode'))`
      )
      expect(result.command).toEqual('CREATE')

      // query indexed jsonb data
      result = await dbConnection.raw(
        `EXPLAIN SELECT *
       FROM ${MODELS_TO_INDEX[0]}
       WHERE stream_content->'settings'->'dark_mode' = ?;`,
        true
      )
      expect(result.command).toEqual('EXPLAIN')
      expect(result.rows.length).toBeGreaterThan(1)
      expect(result.rows[0]['QUERY PLAN'].includes('idx_postgres_jsonb')).toBeTruthy()
    })

    test('create new stream with indices', async () => {
      const model = StreamID.fromString(STREAM_ID_A)
      const tableName = asTableName(model)

      //create a stream
      const streamContent = {
        model: model,
        streamID: StreamID.fromString(STREAM_ID_B),
        controller: CONTROLLER,
        streamContent: STREAM_TEST_DATA_PROFILE_A,
        tip: FAKE_CID_A,
        lastAnchor: null,
        firstAnchor: null,
      }
      await indexApi.indexStream(streamContent)

      // Also manually check MID table structure
      const expectedIndices = [MODEL_DATA[0].indices[0]].map(
        (idx) => `'${fieldsIndexName(idx, tableName)}'`
      )
      expect(expectedIndices[0]).toEqual(`'idx_xvg5ygiabd_name_addre'`)
      expect(expectedIndices.length).toEqual(1)

      const rememberedModels = indexApi.getIndexedModels()
      expect(rememberedModels.length).toEqual(2)
      expect(rememberedModels[0].indices.length).toEqual(expectedIndices.length)
      expect(rememberedModels[1].indices).toBeUndefined()

      const foundModels = await indexApi.getIndexedModelsFromDatabase()
      if (!foundModels[0].streamID.equals(rememberedModels[0].streamID)) {
        // the order that we get back from the database might not be the same order that we used
        // when we called indexModels() during test setup, so we do this to make sure we are
        // comparing the streams in the same order.
        foundModels.reverse()
      }
      expect(foundModels).toEqual(rememberedModels)
      expect(foundModels.length).toEqual(2)
      expect(foundModels[0].indices.length).toEqual(expectedIndices.length)
      expect(rememberedModels[1].indices).toBeUndefined()

      const actualIndices = await dbConnection.raw(`
select *
from pg_indexes
where tablename like '${tableName}'
and indexname in (${expectedIndices});
  `)
      expect(actualIndices.rowCount).toEqual(expectedIndices.length)
    })

    test('query and filter jsonb stream content', async () => {
      await indexApi.indexStream(STREAM_CONTENT_A)
      await indexApi.indexStream(STREAM_CONTENT_B)

      let result: Array<any> = await dbConnection.select('*').from(`${MODELS_TO_INDEX[0]}`)
      expect(result.length).toEqual(2)

      // filter content from existing model per controller
      result = await dbConnection
        .from(`${MODELS_TO_INDEX[0]}`)
        .select(
          dbConnection.raw(
            `*, stream_content->'settings'->'dark_mode' AS dark_mode, stream_content->>'id' AS id`
          )
        )
        .whereRaw(`stream_content->'settings'->'dark_mode' = ?`, true)

      expect(result.length).toEqual(1)
      const raw = result[0]
      expect(raw.dark_mode).toEqual(STREAM_TEST_DATA_PROFILE_A.settings.dark_mode)
      expect(raw.id).toEqual(STREAM_TEST_DATA_PROFILE_A.id)
    })
  })

  describe('page', () => {
    const FAUX_DB_CONNECTION = {} as unknown as Knex

    test('call the order if historical sync is allowed', async () => {
      const indexApi = new PostgresIndexApi(FAUX_DB_CONNECTION, true, logger, Networks.INMEMORY)
      indexApi.setSyncQueryApi(new CompleteQueryApi())
      indexApi.indexedModels = [{ streamID: StreamID.fromString(STREAM_ID_A) }]
      const mockPage = jest.fn(async () => {
        return { edges: [], pageInfo: { hasNextPage: false, hasPreviousPage: false } }
      })
      indexApi.insertionOrder.page = mockPage
      await indexApi.page({ model: STREAM_ID_A, first: 100 })
      expect(mockPage).toBeCalled()
    })
    test('throw if historical sync is not allowed', async () => {
      const indexApi = new PostgresIndexApi(FAUX_DB_CONNECTION, false, logger, Networks.INMEMORY)
      indexApi.setSyncQueryApi(new IncompleteQueryApi())
      indexApi.indexedModels = [{ streamID: StreamID.fromString(STREAM_ID_A) }]
      await expect(indexApi.page({ model: STREAM_ID_A, first: 100 })).rejects.toThrow(
        IndexQueryNotAvailableError
      )
    })
  })

  describe('count', () => {
    const MODEL_ID = 'kjzl6cwe1jw145m7jxh4jpa6iw1ps3jcjordpo81e0w04krcpz8knxvg5ygiabd'
    const MODELS_TO_INDEX = [StreamID.fromString(MODEL_ID)]
    const MODEL = MODELS_TO_INDEX[0]

    test('all', async () => {
      const indexApi = new PostgresIndexApi(dbConnection, true, logger, Networks.INMEMORY)
      indexApi.setSyncQueryApi(new CompleteQueryApi())
      await indexApi.init()
      await indexApi.indexModels(
        MODELS_TO_INDEX.map((m) => {
          return { model: m }
        })
      )
      const rows = await readCsvFixture(new URL('./insertion-order.fixture.csv', import.meta.url))
      for (const row of rows) {
        await indexApi.indexStream(row)
      }
      // all
      await expect(indexApi.count({ model: MODEL })).resolves.toEqual(rows.length)
      // by account
      const account = 'did:key:blah'
      const expected = rows.filter((r) => r.controller === account).length
      await expect(indexApi.count({ model: MODEL, account: account })).resolves.toEqual(expected)
    })
  })
})

describe('sqlite', () => {
  const STRUCTURE = STRUCTURES[DatabaseType.SQLITE]

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
        const indexApi = new SqliteIndexApi(dbConnection, true, logger, Networks.INMEMORY)
        indexApi.setSyncQueryApi(new CompleteQueryApi())
        await indexApi.init()
        await indexApi.indexModels(modelsToIndexArgs([modelToIndex]))
        const created = await indexApi.tablesManager.listMidTables()
        const tableName = asTableName(modelToIndex)
        expect(created.length).toEqual(1)
        expect(created[0]).toEqual(tableName)

        // Built-in table verification should pass
        await expect(
          indexApi.tablesManager.verifyTables(modelsToIndexArgs([modelToIndex]))
        ).resolves.not.toThrow()

        // Also manually check MID table structure
        const midColumns = await dbConnection.table(asTableName(modelToIndex)).columnInfo()
        expect(JSON.stringify(midColumns)).toEqual(JSON.stringify(STRUCTURE.COMMON_TABLE))

        // Also manually check config table structure
        const configTableColumns = await dbConnection
          .table(asTableName(INDEXED_MODEL_CONFIG_TABLE_NAME))
          .columnInfo()
        expect(JSON.stringify(configTableColumns)).toEqual(
          JSON.stringify(STRUCTURE.CONFIG_TABLE_MODEL_INDEX)
        )
      })

      test('create new table with indices', async () => {
        const modelToIndex = StreamID.fromString(STREAM_ID_A)
        const indexApi = new SqliteIndexApi(dbConnection, true, logger, Networks.INMEMORY)
        indexApi.setSyncQueryApi(new CompleteQueryApi())
        await indexApi.init()
        const modelToIndexArgs = {
          model: modelToIndex,
          indices: [
            {
              name: 'test_model_index',
              fields: [
                {
                  path: ['name'],
                },
                {
                  path: ['address'],
                },
              ],
            },
          ],
        }
        await indexApi.indexModels([modelToIndexArgs])
        const created = await indexApi.tablesManager.listMidTables()
        const tableName = asTableName(modelToIndex)
        expect(created.length).toEqual(1)
        expect(created[0]).toEqual(tableName)

        //verify behavior if we call index again
        await indexApi.indexModels([modelToIndexArgs])
        const created2 = await indexApi.tablesManager.listMidTables()
        const tableName2 = asTableName(modelToIndex)
        expect(created2.length).toEqual(1)
        expect(created2[0]).toEqual(tableName2)

        // Built-in table verification should pass
        await expect(indexApi.tablesManager.verifyTables([modelToIndexArgs])).resolves.not.toThrow()

        // Also manually check MID table structure
        let columns = await dbConnection.table(asTableName(modelToIndex)).columnInfo()
        expect(JSON.stringify(columns)).toEqual(JSON.stringify(STRUCTURE.COMMON_TABLE))

        // Also manually check config table structure
        columns = await dbConnection
          .table(asTableName(INDEXED_MODEL_CONFIG_TABLE_NAME))
          .columnInfo()
        expect(JSON.stringify(columns)).toEqual(JSON.stringify(STRUCTURE.CONFIG_TABLE_MODEL_INDEX))
      })

      test('create new table with relations', async () => {
        const indexModelsArgs: Array<IndexModelArgs> = [
          {
            model: StreamID.fromString(STREAM_ID_A),
            relations: { fooRelation: { type: 'account' } },
          },
        ]
        const indexApi = new SqliteIndexApi(dbConnection, true, logger, Networks.INMEMORY)
        indexApi.setSyncQueryApi(new CompleteQueryApi())
        await indexApi.init()
        await indexApi.indexModels(indexModelsArgs)
        const created = await indexApi.tablesManager.listMidTables()
        const tableNames = indexModelsArgs.map((args) => `${asTableName(args.model)}`)
        expect(created.sort()).toEqual(tableNames.sort())

        await expect(indexApi.tablesManager.verifyTables(indexModelsArgs)).resolves.not.toThrow()

        // Also manually check table structure
        const columns = await dbConnection.table(asTableName(indexModelsArgs[0].model)).columnInfo()
        const expectedTableStructure = Object.assign({}, STRUCTURE.COMMON_TABLE, {
          custom_fooRelation: STRUCTURE.RELATION_COLUMN,
        })
        expect(JSON.stringify(columns)).toEqual(JSON.stringify(expectedTableStructure))
      })

      test('table creation is idempotent', async () => {
        const modelsToIndex = [{ model: StreamID.fromString(STREAM_ID_A) }, { model: Model.MODEL }]
        const indexApi = new SqliteIndexApi(dbConnection, true, logger, Networks.INMEMORY)
        indexApi.setSyncQueryApi(new CompleteQueryApi())
        await indexApi.init()
        await indexApi.indexModels(modelsToIndex)
        // Index the same models again to make sure we don't error trying to re-create the tables
        await indexApi.indexModels(modelsToIndex)
        const created = await indexApi.tablesManager.listMidTables()
        const tableNames = modelsToIndex.map((m) => `${m.model.toString()}`)
        expect(created.sort()).toEqual(tableNames.sort())
      })

      test('create new table with existing ones', async () => {
        // First init with one model
        const modelsA = [StreamID.fromString(STREAM_ID_A)]
        const indexApiA = new SqliteIndexApi(dbConnection, true, logger, Networks.INMEMORY)
        indexApiA.setSyncQueryApi(new CompleteQueryApi())
        await indexApiA.init()
        await indexApiA.indexModels(modelsToIndexArgs(modelsA))
        const createdA = await indexApiA.tablesManager.listMidTables()
        const tableNamesA = modelsA.map((m) => `${m.toString()}`)
        expect(createdA.sort()).toEqual(tableNamesA.sort())

        // Next add another one
        const modelsB = [...modelsA, StreamID.fromString(STREAM_ID_B)]
        const indexApiB = new SqliteIndexApi(dbConnection, true, logger, Networks.INMEMORY)
        indexApiB.setSyncQueryApi(new CompleteQueryApi())
        await indexApiB.indexModels(modelsToIndexArgs(modelsB))
        const createdB = await indexApiB.tablesManager.listMidTables()
        const tableNamesB = modelsB.map((m) => `${m.toString()}`)
        expect(createdB.sort()).toEqual(tableNamesB.sort())
      })

      test('checks or persists the network used for indexing', async () => {
        const indexApiA = new SqliteIndexApi(dbConnection, true, logger, Networks.INMEMORY)
        indexApiA.setSyncQueryApi(new CompleteQueryApi())
        await indexApiA.init()

        // Throws if initialized with a different network
        const indexApiB = new SqliteIndexApi(dbConnection, true, logger, Networks.MAINNET)
        indexApiB.setSyncQueryApi(new CompleteQueryApi())
        await expect(indexApiB.init()).rejects.toThrow(
          'Initialization failed for config table: ceramic_config. The database is configured to use the network inmemory but the current network is mainnet.'
        )

        // Does not throw if initialized with the stored network
        const indexApiC = new SqliteIndexApi(dbConnection, true, logger, Networks.INMEMORY)
        indexApiC.setSyncQueryApi(new CompleteQueryApi())
        await expect(indexApiC.init()).resolves.toBeUndefined()
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
        const indexApi = new SqliteIndexApi(dbConnection, true, logger, Networks.INMEMORY)
        indexApi.setSyncQueryApi(new CompleteQueryApi())
        await indexApi.init()

        // Create the table in the database with all expected fields but one (leaving off 'updated_at')
        const tableName = asTableName(modelToIndex)
        await dbConnection.schema.createTable(tableName, (table) => {
          table.string('stream_id', 1024).primary().unique().notNullable()
          table.string('controller_did', 1024).notNullable()
          table.string('stream_content').notNullable()
          table.string('tip').notNullable()
          table.integer('last_anchored_at').nullable()
          table.integer('first_anchored_at').nullable()
          table.integer('created_at').notNullable()
          table.integer('updated_at').notNullable()

          const tableIndices = defaultIndices(tableName)
          for (const indexToCreate of tableIndices.indices) {
            table.index(indexToCreate.keys, indexToCreate.name, {
              storageEngineIndexType: indexToCreate.indexType,
            })
          }
        })

        await expect(
          indexApi.tablesManager.verifyTables(modelsToIndexArgs([modelToIndex]))
        ).resolves.not.toThrow()
      })

      test('Can manually create config table that migrates and passes validation', async () => {
        // Create the table in the database with all expected fields but one (leaving off 'updated_at')
        await dbConnection.schema.createTable(INDEXED_MODEL_CONFIG_TABLE_NAME, (table) => {
          // create unique index name <64 chars that are still capable of being referenced to MID table
          table.string('model', 1024).unique().notNullable().primary()
          table.boolean('is_indexed').notNullable().defaultTo(true)
          table.boolean('enable_historical_sync').notNullable().defaultTo(false)
          table.dateTime('created_at').notNullable().defaultTo(dbConnection.fn.now())
          table.dateTime('updated_at').notNullable().defaultTo(dbConnection.fn.now())
          table.string('updated_by', 1024).notNullable()

          table.index(['is_indexed'], `idx_ceramic_is_indexed`, {
            indexType: 'btree',
          })
        })

        await expect(
          migrateConfigTable(dbConnection, INDEXED_MODEL_CONFIG_TABLE_NAME, true)
        ).resolves.not.toThrow()

        const dbType = DatabaseType.SQLITE
        const manager = new TablesManager(dbType, dbConnection, logger)

        await expect(
          manager._verifyConfigTable({
            tableName: INDEXED_MODEL_CONFIG_TABLE_NAME,
            validSchema: STRUCTURES[dbType].CONFIG_TABLE_MODEL_INDEX,
          })
        ).resolves.not.toThrow()
      })

      test('Fail table validation', async () => {
        const modelToIndex = StreamID.fromString(STREAM_ID_A)
        const indexApi = new SqliteIndexApi(dbConnection, true, logger, Networks.INMEMORY)
        indexApi.setSyncQueryApi(new CompleteQueryApi())
        await indexApi.init()

        // Create the table in the database with all expected fields but one (leaving off 'updated_at')
        const tableName = asTableName(modelToIndex)
        await dbConnection.schema.createTable(tableName, (table) => {
          table.string('stream_id', 1024).primary().unique().notNullable()
          table.string('controller_did', 1024).notNullable()
          table.string('stream_content').notNullable()
          table.string('tip').notNullable()
          table.integer('last_anchored_at').nullable()
          table.integer('first_anchored_at').nullable()
          table.integer('created_at').notNullable()

          const tableIndices = defaultIndices(tableName)
          for (const indexToCreate of tableIndices.indices) {
            if (!indexToCreate.keys.includes('updated_at')) {
              //updated_at not added as part of table
              table.index(indexToCreate.keys, indexToCreate.name, {
                storageEngineIndexType: indexToCreate.indexType,
              })
            }
          }
        })

        await expect(
          indexApi.tablesManager.verifyTables(modelsToIndexArgs([modelToIndex]))
        ).rejects.toThrow(/Schema verification failed for index/)
      })

      test('Fail table validation if indices are missing', async () => {
        const modelToIndex = StreamID.fromString(STREAM_ID_A)
        const indexApi = new SqliteIndexApi(dbConnection, true, logger, Networks.INMEMORY)
        await indexApi.init()

        // Create the table in the database with all expected fields but one (leaving off 'updated_at')
        const tableName = asTableName(modelToIndex)
        await dbConnection.schema.createTable(tableName, (table) => {
          table.string('stream_id', 1024).primary().unique().notNullable()
          table.string('controller_did', 1024).notNullable()
          table.string('stream_content').notNullable()
          table.string('tip').notNullable()
          table.integer('last_anchored_at').nullable()
          table.integer('first_anchored_at').nullable()
          table.integer('created_at').notNullable()
        })

        await expect(
          indexApi.tablesManager.verifyTables(modelsToIndexArgs([modelToIndex]))
        ).rejects.toThrow(/Schema verification failed for index/)
      })

      test('Fail table validation if relation column missing', async () => {
        const modelToIndex = StreamID.fromString(STREAM_ID_A)
        const indexModelsArgs: Array<IndexModelArgs> = [
          {
            model: StreamID.fromString(STREAM_ID_A),
            relations: { fooRelation: { type: 'account' } },
          },
        ]

        const indexApi = new SqliteIndexApi(dbConnection, true, logger, Networks.INMEMORY)
        indexApi.setSyncQueryApi(new CompleteQueryApi())
        await indexApi.init()

        // Create the table in the database with all expected fields but one (leaving off 'updated_at')
        const tableName = asTableName(modelToIndex)
        await dbConnection.schema.createTable(tableName, (table) => {
          table.string('stream_id', 1024).primary().unique().notNullable()
          table.string('controller_did', 1024).notNullable()
          table.string('stream_content').notNullable()
          table.string('tip').notNullable()
          table.integer('last_anchored_at').nullable()
          table.integer('first_anchored_at').nullable()
          table.integer('created_at').notNullable()
          table.integer('updated_at').notNullable()

          const tableIndices = defaultIndices(tableName)
          for (const indexToCreate of tableIndices.indices) {
            if (!indexToCreate.keys.includes('updated_at')) {
              //updated_at not added as part of table
              table.index(indexToCreate.keys, indexToCreate.name, {
                storageEngineIndexType: indexToCreate.indexType,
              })
            }
          }
        })

        await expect(indexApi.tablesManager.verifyTables(indexModelsArgs)).rejects.toThrow(
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
      const indexApi = new SqliteIndexApi(fauxDbConnection, true, logger, Networks.INMEMORY)
      indexApi.setSyncQueryApi(new CompleteQueryApi())
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
      const indexApi = new SqliteIndexApi(dbConnection, true, logger, Networks.INMEMORY)
      indexApi.setSyncQueryApi(new CompleteQueryApi())
      await indexApi.init()
      await indexApi.indexModels(modelsToIndexArgs(modelsToIndex))

      expect(
        await dbConnection(INDEXED_MODEL_CONFIG_TABLE_NAME)
          .select('model', 'is_indexed')
          .orderBy('model', 'desc')
      ).toEqual([
        {
          model: 'kjzl6cwe1jw145m7jxh4jpa6iw1ps3jcjordpo81e0w04krcpz8knxvg5ygiabd',
          is_indexed: 1,
        },
        {
          model: 'kh4q0ozorrgaq2mezktnrmdwleo1d',
          is_indexed: 1,
        },
      ])
    })

    test('updates the INDEXED_MODEL_CONFIG_TABLE_NAME table on stopIndexingModels()', async () => {
      const modelsToIndex = [StreamID.fromString(STREAM_ID_A), Model.MODEL]
      const indexApi = new SqliteIndexApi(dbConnection, true, logger, Networks.INMEMORY)
      indexApi.setSyncQueryApi(new CompleteQueryApi())
      await indexApi.init()
      await indexApi.indexModels(modelsToIndexArgs(modelsToIndex))
      await indexApi.stopIndexingModels([{ streamID: StreamID.fromString(STREAM_ID_A) }])

      expect(
        await dbConnection(INDEXED_MODEL_CONFIG_TABLE_NAME)
          .select('model', 'is_indexed')
          .orderBy('model', 'desc')
      ).toEqual([
        {
          model: 'kjzl6cwe1jw145m7jxh4jpa6iw1ps3jcjordpo81e0w04krcpz8knxvg5ygiabd',
          is_indexed: 0,
        },
        {
          model: 'kh4q0ozorrgaq2mezktnrmdwleo1d',
          is_indexed: 1,
        },
      ])
    })

    test('re-indexing models', async () => {
      const modelsToIndex = [{ model: StreamID.fromString(STREAM_ID_A) }, { model: Model.MODEL }]
      const indexApi = new SqliteIndexApi(dbConnection, true, logger, Networks.INMEMORY)
      indexApi.setSyncQueryApi(new CompleteQueryApi())
      await indexApi.init()

      await indexApi.indexModels(modelsToIndex)
      expect(
        await dbConnection(INDEXED_MODEL_CONFIG_TABLE_NAME)
          .select('model', 'is_indexed')
          .orderBy('model', 'desc')
      ).toEqual([
        {
          model: 'kjzl6cwe1jw145m7jxh4jpa6iw1ps3jcjordpo81e0w04krcpz8knxvg5ygiabd',
          is_indexed: 1,
        },
        {
          model: 'kh4q0ozorrgaq2mezktnrmdwleo1d',
          is_indexed: 1,
        },
      ])

      await indexApi.stopIndexingModels([{ streamID: StreamID.fromString(STREAM_ID_A) }])
      expect(
        await dbConnection(INDEXED_MODEL_CONFIG_TABLE_NAME)
          .select('model', 'is_indexed')
          .orderBy('model', 'desc')
      ).toEqual([
        {
          model: 'kjzl6cwe1jw145m7jxh4jpa6iw1ps3jcjordpo81e0w04krcpz8knxvg5ygiabd',
          is_indexed: 0,
        },
        {
          model: 'kh4q0ozorrgaq2mezktnrmdwleo1d',
          is_indexed: 1,
        },
      ])

      await indexApi.indexModels(modelsToIndexArgs([StreamID.fromString(STREAM_ID_A)]))
      expect(
        await dbConnection(INDEXED_MODEL_CONFIG_TABLE_NAME)
          .select('model', 'is_indexed')
          .orderBy('model', 'desc')
      ).toEqual([
        {
          model: 'kjzl6cwe1jw145m7jxh4jpa6iw1ps3jcjordpo81e0w04krcpz8knxvg5ygiabd',
          is_indexed: 1,
        },
        {
          model: 'kh4q0ozorrgaq2mezktnrmdwleo1d',
          is_indexed: 1,
        },
      ])
    })

    test('modelsToIndex is properly populated after init()', async () => {
      const modelsToIndex = [StreamID.fromString(STREAM_ID_A), Model.MODEL]
      const indexApi = new SqliteIndexApi(dbConnection, true, logger, Networks.INMEMORY)
      indexApi.setSyncQueryApi(new CompleteQueryApi())
      await indexApi.init()
      await indexApi.indexModels(modelsToIndexArgs(modelsToIndex))

      const anotherIndexApi = new SqliteIndexApi(dbConnection, true, logger, Networks.INMEMORY)
      indexApi.setSyncQueryApi(new CompleteQueryApi())
      await anotherIndexApi.init()

      expect(
        anotherIndexApi
          .getIndexedModels()
          .map((idx) => idx.streamID.toString())
          .sort()
      ).toEqual([
        'kh4q0ozorrgaq2mezktnrmdwleo1d',
        'kjzl6cwe1jw145m7jxh4jpa6iw1ps3jcjordpo81e0w04krcpz8knxvg5ygiabd',
      ])
    })

    test('modelsToIndex is properly updated after indexModels()', async () => {
      const modelsToIndex = [StreamID.fromString(STREAM_ID_A), Model.MODEL]
      const indexApi = new SqliteIndexApi(dbConnection, true, logger, Networks.INMEMORY)
      indexApi.setSyncQueryApi(new CompleteQueryApi())
      await indexApi.init()
      expect(indexApi.getIndexedModels()).toEqual([])
      await indexApi.indexModels(modelsToIndexArgs(modelsToIndex))
      expect(
        indexApi
          .getIndexedModels()
          .map((idx) => idx.streamID.toString())
          .sort()
      ).toEqual([
        'kh4q0ozorrgaq2mezktnrmdwleo1d',
        'kjzl6cwe1jw145m7jxh4jpa6iw1ps3jcjordpo81e0w04krcpz8knxvg5ygiabd',
      ])
    })

    test('modelsToIndex not allowed if sync in progress', async () => {
      const modelsToIndex = [StreamID.fromString(STREAM_ID_A), Model.MODEL]
      const indexApi = new SqliteIndexApi(dbConnection, false, logger, Networks.INMEMORY)
      indexApi.setSyncQueryApi(new IncompleteQueryApi())
      await indexApi.init()
      expect(indexApi.getIndexedModels()).toEqual([])
      await expect(indexApi.indexModels(modelsToIndexArgs(modelsToIndex))).rejects.toThrow(
        /historical data for that model is still syncing/
      )
    })

    test('modelsToIndex is properly updated after stopIndexingModels()', async () => {
      const modelsToIndex = [StreamID.fromString(STREAM_ID_A), Model.MODEL]
      const indexApi = new SqliteIndexApi(dbConnection, true, logger, Networks.INMEMORY)
      indexApi.setSyncQueryApi(new CompleteQueryApi())
      await indexApi.init()
      await indexApi.indexModels(modelsToIndexArgs(modelsToIndex))
      expect(
        indexApi
          .getIndexedModels()
          .map((idx) => idx.streamID.toString())
          .sort()
      ).toEqual([
        'kh4q0ozorrgaq2mezktnrmdwleo1d',
        'kjzl6cwe1jw145m7jxh4jpa6iw1ps3jcjordpo81e0w04krcpz8knxvg5ygiabd',
      ])
      await indexApi.stopIndexingModels([
        {
          streamID: StreamID.fromString(
            'kjzl6cwe1jw145m7jxh4jpa6iw1ps3jcjordpo81e0w04krcpz8knxvg5ygiabd'
          ),
        },
      ])
      expect(indexApi.getIndexedModels().map((idx) => idx.streamID.toString())).toEqual([
        'kh4q0ozorrgaq2mezktnrmdwleo1d',
      ])
    })
  })

  describe('indexStream', () => {
    const MODELS_TO_INDEX = [STREAM_ID_A, STREAM_ID_B].map(StreamID.fromString)
    const MODEL_DATA = [
      {
        model: StreamID.fromString(STREAM_ID_A),
        indices: [
          {
            name: 'test_model_index',
            fields: [
              {
                path: ['name'],
              },
              {
                path: ['address'],
              },
            ],
          },
        ],
      },
      {
        model: StreamID.fromString(STREAM_ID_B),
      },
    ]
    const STREAM_CONTENT = {
      model: MODELS_TO_INDEX[0],
      streamID: StreamID.fromString(STREAM_ID_B),
      controller: CONTROLLER,
      streamContent: STREAM_TEST_DATA_PROFILE_A,
      tip: FAKE_CID_A,
      lastAnchor: null,
      firstAnchor: null,
    }

    let indexApi: SqliteIndexApi
    beforeEach(async () => {
      indexApi = new SqliteIndexApi(dbConnection, true, logger, Networks.INMEMORY)
      indexApi.setSyncQueryApi(new CompleteQueryApi())
      await indexApi.init()
      await indexApi.indexModels(MODEL_DATA)
    })

    test('new stream', async () => {
      const now = new Date()
      await indexApi.indexStream(STREAM_CONTENT)
      const result: Array<any> = await dbConnection.from(`${MODELS_TO_INDEX[0]}`).select('*')
      expect(result.length).toEqual(1)
      const raw = result[0]
      expect(raw.stream_id).toEqual(STREAM_ID_B)
      expect(raw.controller_did).toEqual(CONTROLLER)
      expect(raw.stream_content).toEqual(JSON.stringify(STREAM_TEST_DATA_PROFILE_A))
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
        streamContent: {
          ...STREAM_CONTENT.streamContent,
          name: STREAM_CONTENT.streamContent.name.concat(' Fauci'),
        },
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
      expect(JSON.parse(raw.stream_content)).toEqual(updatedStreamContent.streamContent)
    })

    test('create new stream with indices', async () => {
      const model = StreamID.fromString(STREAM_ID_A)
      const tableName = asTableName(model)

      //create a stream
      const streamContent = {
        model: model,
        streamID: StreamID.fromString(STREAM_ID_B),
        controller: CONTROLLER,
        streamContent: STREAM_TEST_DATA_PROFILE_A,
        tip: FAKE_CID_A,
        lastAnchor: null,
        firstAnchor: null,
      }
      await indexApi.indexStream(streamContent)

      // Also manually check MID table structure
      const expectedIndices = [MODEL_DATA[0].indices[0]].map(
        (idx) => `'${fieldsIndexName(idx, tableName)}'`
      )
      expect(expectedIndices[0]).toEqual(`'idx_xvg5ygiabd_name_addre'`)
      expect(expectedIndices.length).toEqual(1)

      const rememberedModels = indexApi.getIndexedModels()
      expect(rememberedModels.length).toEqual(2)
      expect(rememberedModels[0].indices.length).toEqual(expectedIndices.length)
      expect(rememberedModels[1].indices).toBeUndefined()

      const foundModels = await indexApi.getIndexedModelsFromDatabase()
      if (!foundModels[0].streamID.equals(rememberedModels[0].streamID)) {
        // the order that we get back from the database might not be the same order that we used
        // when we called indexModels() during test setup, so we do this to make sure we are
        // comparing the streams in the same order.
        foundModels.reverse()
      }
      expect(foundModels).toEqual(rememberedModels)
      expect(foundModels.length).toEqual(2)
      expect(foundModels[0].indices.length).toEqual(expectedIndices.length)
      expect(rememberedModels[1].indices).toBeUndefined()

      const actualIndices = await dbConnection.raw(`
select name, tbl_name
FROM sqlite_master
WHERE type='index'
and tbl_name like '${tableName}'
and name in (${expectedIndices})
;
  `)
      expect(actualIndices.length).toEqual(expectedIndices.length)
    })
  })

  describe('page', () => {
    const FAUX_DB_CONNECTION = {} as unknown as Knex

    test('call the order if historical sync is allowed', async () => {
      const indexApi = new SqliteIndexApi(FAUX_DB_CONNECTION, true, logger, Networks.INMEMORY)
      indexApi.setSyncQueryApi(new CompleteQueryApi())
      indexApi.indexedModels = [{ streamID: StreamID.fromString(STREAM_ID_A) }]
      const mockPage = jest.fn(async () => {
        return { edges: [], pageInfo: { hasNextPage: false, hasPreviousPage: false } }
      })
      indexApi.insertionOrder.page = mockPage
      await indexApi.page({ model: STREAM_ID_A, first: 100 })
      expect(mockPage).toBeCalled()
    })
    test('throw if historical sync is not allowed', async () => {
      const indexApi = new SqliteIndexApi(FAUX_DB_CONNECTION, false, logger, Networks.INMEMORY)
      indexApi.setSyncQueryApi(new IncompleteQueryApi())
      indexApi.indexedModels = [{ streamID: StreamID.fromString(STREAM_ID_A) }]
      await expect(indexApi.page({ model: STREAM_ID_A, first: 100 })).rejects.toThrow(
        IndexQueryNotAvailableError
      )
    })
  })

  describe('count', () => {
    const MODEL_ID = 'kjzl6cwe1jw145m7jxh4jpa6iw1ps3jcjordpo81e0w04krcpz8knxvg5ygiabd'
    const MODELS_TO_INDEX = [StreamID.fromString(MODEL_ID)]
    const MODEL = MODELS_TO_INDEX[0]

    test('all', async () => {
      const indexApi = new SqliteIndexApi(dbConnection, true, logger, Networks.INMEMORY)
      indexApi.setSyncQueryApi(new CompleteQueryApi())
      await indexApi.init()
      await indexApi.indexModels(
        MODELS_TO_INDEX.map((m) => {
          return { model: m }
        })
      )
      const rows = await readCsvFixture(new URL('./insertion-order.fixture.csv', import.meta.url))
      for (const row of rows) {
        await indexApi.indexStream(row)
      }
      // all
      await expect(indexApi.count({ model: MODEL })).resolves.toEqual(rows.length)
      // by account
      const account = 'did:key:blah'
      const expected = rows.filter((r) => r.controller === account).length
      await expect(indexApi.count({ model: MODEL, account: account })).resolves.toEqual(expected)
    })
  })
})
