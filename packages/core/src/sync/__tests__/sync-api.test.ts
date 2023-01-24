import { jest } from '@jest/globals'
import pgSetup from '@databases/pg-test/jest/globalSetup'
import pgTeardown from '@databases/pg-test/jest/globalTeardown'
import knex, { type Knex } from 'knex'

import { STATE_TABLE_NAME, SyncApi } from '../sync-api.js'

describe('Sync API', () => {
  let dbConnection: Knex

  async function dropTables() {
    await dbConnection.schema.dropTableIfExists(STATE_TABLE_NAME)
  }

  beforeAll(async () => {
    await pgSetup()
  })

  beforeEach(() => {
    dbConnection = knex({
      client: 'pg',
      connection: process.env.DATABASE_URL,
    })
  })

  afterEach(async () => {
    await dropTables()
    await dbConnection.destroy()
  })

  afterAll(async () => {
    await pgTeardown()
  })

  describe('_initStateTable()', () => {
    test('creates the table if not existing', async () => {
      const sync = new SyncApi(
        { chainId: 'eip155:1337', db: process.env.DATABASE_URL as string },
        {} as any,
        {} as any,
        {} as any,
        {} as any
      )
      await expect(sync._initStateTable()).resolves.toEqual({})
      await expect(dbConnection.from(STATE_TABLE_NAME).first()).resolves.toEqual({
        processed_block_hash: null,
        processed_block_number: null,
      })
    })

    test('reads the state from the table if existing', async () => {
      await dbConnection.schema.createTable(STATE_TABLE_NAME, function (table) {
        table.string('processed_block_hash', 1024)
        table.integer('processed_block_number')
      })
      await dbConnection
        .into(STATE_TABLE_NAME)
        .insert({ processed_block_hash: '0x123abc', processed_block_number: 10 })

      const sync = new SyncApi(
        { chainId: 'eip155:1337', db: process.env.DATABASE_URL as string },
        {} as any,
        {} as any,
        {} as any,
        {} as any
      )
      await expect(sync._initStateTable()).resolves.toEqual({
        processedBlockHash: '0x123abc',
        processedBlockNumber: 10,
      })
    })
  })

  test('_updateStoredState() updates the state in DB', async () => {
    const sync = new SyncApi(
      { chainId: 'eip155:1337', db: process.env.DATABASE_URL as string },
      {} as any,
      {} as any,
      {} as any,
      {} as any
    )
    await sync._initStateTable()
    // Check state before update
    await expect(dbConnection.from(STATE_TABLE_NAME).first()).resolves.toEqual({
      processed_block_hash: null,
      processed_block_number: null,
    })
    await sync._updateStoredState({
      processedBlockHash: '0x123abc',
      processedBlockNumber: 10,
    })
    await expect(dbConnection.from(STATE_TABLE_NAME).first()).resolves.toEqual({
      processed_block_hash: '0x123abc',
      processed_block_number: 10,
    })
  })
})
