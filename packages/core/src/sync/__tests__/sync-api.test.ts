import { jest } from '@jest/globals'
import pgSetup from '@databases/pg-test/jest/globalSetup'
import pgTeardown from '@databases/pg-test/jest/globalTeardown'
import knex, { type Knex } from 'knex'
import { Observable } from 'rxjs'
import { LoggerProvider } from '@ceramicnetwork/common'

import { REBUILD_ANCHOR_JOB_NAME, SYNC_JOB_NAME } from '../interfaces.js'
import { RebuildAnchorWorker } from '../workers/rebuild-anchor.js'
import { SyncWorker, createSyncJob } from '../workers/sync.js'

const createBlockProofsListener = jest.fn(() => new Observable())

jest.unstable_mockModule('@ceramicnetwork/anchor-listener', () => {
  return { createBlockProofsListener }
})

describe('Sync API', () => {
  jest.setTimeout(150000) // 2.5mins timeout for initial docker fetch+init
  let dbConnection: Knex

  async function dropTables() {
    const { STATE_TABLE_NAME } = await import('../sync-api.js')
    await dbConnection.schema.dropTableIfExists(STATE_TABLE_NAME)
  }

  const logger = new LoggerProvider().getDiagnosticsLogger()

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

  test('_initJobQueue() initializes the JobQueue instance with the workers', async () => {
    const { SyncApi } = await import('../sync-api.js')
    const sync = new SyncApi(
      { chainId: 'eip155:1337', db: process.env.DATABASE_URL as string },
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any
    )

    const init = jest.fn()
    // @ts-ignore private field
    sync.jobQueue = { init }

    await sync._initJobQueue()
    expect(init).toHaveBeenCalledWith({
      [REBUILD_ANCHOR_JOB_NAME]: expect.any(RebuildAnchorWorker),
      [SYNC_JOB_NAME]: expect.any(SyncWorker),
    })
  })

  test('_initModelsToSync() loads the models to sync from DB and adds them to the local set', async () => {
    const expectedModels = ['abc123', 'abc456', 'abc789', 'def123']
    const indexedModels = jest.fn(() => Promise.resolve(expectedModels))

    const { SyncApi } = await import('../sync-api.js')
    const sync = new SyncApi(
      { chainId: 'eip155:1337', db: process.env.DATABASE_URL as string },
      {} as any,
      {} as any,
      {} as any,
      { indexedModels } as any,
      {} as any
    )

    await sync._initModelsToSync()
    expect(indexedModels).toHaveBeenCalled()
    expect(Array.from(sync.modelsToSync)).toEqual(expectedModels)
  })

  describe('_initStateTable()', () => {
    test('creates the table if not existing', async () => {
      const { STATE_TABLE_NAME, SyncApi } = await import('../sync-api.js')
      const sync = new SyncApi(
        { chainId: 'eip155:1337', db: process.env.DATABASE_URL as string },
        {} as any,
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
      const { STATE_TABLE_NAME, SyncApi } = await import('../sync-api.js')
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
        {} as any,
        {} as any
      )
      await expect(sync._initStateTable()).resolves.toEqual({
        processedBlockHash: '0x123abc',
        processedBlockNumber: 10,
      })
    })
  })

  test('_initBlockSubscription()', async () => {
    const { BLOCK_CONFIRMATIONS, SyncApi } = await import('../sync-api.js')
    const provider = {} as any

    const sync = new SyncApi(
      { chainId: 'eip155:1337', db: process.env.DATABASE_URL as string },
      {} as any,
      {} as any,
      provider,
      {} as any,
      {} as any
    )
    sync._initBlockSubscription('abc123')
    expect(createBlockProofsListener).toHaveBeenCalledWith({
      confirmations: BLOCK_CONFIRMATIONS,
      chainId: 'eip155:1337',
      provider: provider,
      expectedParentHash: 'abc123',
    })
    // @ts-ignore private field
    expect(sync.subscription).toBeDefined()
  })

  describe('init() initializes sync', () => {
    test('calls the internal initialization methods and retrieves the first block to sync from', async () => {
      const { BLOCK_CONFIRMATIONS, SyncApi } = await import('../sync-api.js')
      const getBlock = jest.fn(() => ({ number: 10, hash: 'abc123' }))
      const sync = new SyncApi(
        { chainId: 'eip155:1337', db: process.env.DATABASE_URL as string },
        {} as any,
        {} as any,
        { getBlock } as any,
        {} as any,
        {} as any
      )

      const initStateTable = jest.fn(() => ({ processedBlockNumber: 10 }))
      const initModelsToSync = jest.fn()
      const initJobQueue = jest.fn()
      const initBlockSubscription = jest.fn()
      sync._initStateTable = initStateTable as any
      sync._initModelsToSync = initModelsToSync as any
      sync._initJobQueue = initJobQueue as any
      sync._initBlockSubscription = initBlockSubscription as any

      await sync.init()
      expect(getBlock).toHaveBeenCalledWith(-BLOCK_CONFIRMATIONS)
      expect(initStateTable).toHaveBeenCalled()
      expect(initModelsToSync).toHaveBeenCalled()
      expect(initJobQueue).toHaveBeenCalled()
      expect(initBlockSubscription).toHaveBeenCalledWith('abc123')

      await sync.shutdown()
    })

    test('adds a job to do a full sync if there is no previously processed block', async () => {
      const { INITIAL_INDEXING_BLOCK, SyncApi } = await import('../sync-api.js')

      const getBlock = jest.fn(() => ({ number: 10, hash: 'abc123' }))
      const expectedModels = ['abc123', 'abc456', 'abc789', 'def123']
      const indexedModels = jest.fn(() => Promise.resolve(expectedModels))

      const sync = new SyncApi(
        { chainId: 'eip155:1337', db: process.env.DATABASE_URL as string },
        {} as any,
        {} as any,
        { getBlock } as any,
        { indexedModels } as any,
        {} as any
      )

      const initStateTable = jest.fn(() => ({ processedBlockNumber: null }))
      sync._initStateTable = initStateTable as any
      const addSyncJob = jest.fn()
      sync._addSyncJob = addSyncJob as any

      await sync.init()
      expect(addSyncJob).toHaveBeenCalledWith({
        fromBlock: INITIAL_INDEXING_BLOCK,
        toBlock: 10,
        models: expectedModels,
      })

      await sync.shutdown()
    })

    test('adds a job to sync from the previously processed block', async () => {
      const { SyncApi } = await import('../sync-api.js')

      const getBlock = jest.fn(() => ({ number: 10, hash: 'abc123' }))
      const expectedModels = ['abc123', 'abc456', 'abc789', 'def123']
      const indexedModels = jest.fn(() => Promise.resolve(expectedModels))

      const sync = new SyncApi(
        { chainId: 'eip155:1337', db: process.env.DATABASE_URL as string },
        {} as any,
        {} as any,
        { getBlock } as any,
        { indexedModels } as any,
        {} as any
      )

      const initStateTable = jest.fn(() => ({ processedBlockNumber: 5 }))
      sync._initStateTable = initStateTable as any
      const addSyncJob = jest.fn()
      sync._addSyncJob = addSyncJob as any

      await sync.init()
      expect(addSyncJob).toHaveBeenCalledWith({
        fromBlock: 5,
        toBlock: 10,
        models: expectedModels,
      })

      await sync.shutdown()
    })

    test('does not add a job if already in sync', async () => {
      const { SyncApi } = await import('../sync-api.js')
      const getBlock = jest.fn(() => ({ number: 10, hash: 'abc123' }))
      const expectedModels = ['abc123', 'abc456', 'abc789', 'def123']
      const indexedModels = jest.fn(() => Promise.resolve(expectedModels))

      const sync = new SyncApi(
        { chainId: 'eip155:1337', db: process.env.DATABASE_URL as string },
        {} as any,
        {} as any,
        { getBlock } as any,
        { indexedModels } as any,
        {} as any
      )

      const initStateTable = jest.fn(() => ({ processedBlockNumber: 10 }))
      sync._initStateTable = initStateTable as any
      const addSyncJob = jest.fn()
      sync._addSyncJob = addSyncJob as any

      await sync.init()
      expect(addSyncJob).not.toHaveBeenCalled()

      await sync.shutdown()
    })
  })

  test('shutdown() stops the anchor subscription and job queue', async () => {
    const { SyncApi } = await import('../sync-api.js')
    const sync = new SyncApi(
      { chainId: 'eip155:1337', db: process.env.DATABASE_URL as string },
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any
    )

    const unsubscribe = jest.fn()
    // @ts-ignore private field
    sync.subscription = { unsubscribe }
    const stop = jest.fn()
    // @ts-ignore private field
    sync.jobQueue = { stop }

    await sync.shutdown()
    expect(unsubscribe).toHaveBeenCalled()
    expect(stop).toHaveBeenCalled()
  })

  describe('addModelSync() adds a model or models to sync', () => {
    test('handles a single model as input', async () => {
      const { SyncApi } = await import('../sync-api.js')
      const sync = new SyncApi(
        { chainId: 'eip155:1337', db: process.env.DATABASE_URL as string },
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any
      )

      const addSyncJob = jest.fn()
      sync._addSyncJob = addSyncJob as any

      const data = { fromBlock: 1, toBlock: 10, models: ['abc123'] }
      await sync.startModelSync(data.fromBlock, data.toBlock, 'abc123')
      expect(addSyncJob).toHaveBeenCalledWith(data)
      expect(Array.from(sync.modelsToSync)).toEqual(data.models)
    })

    test('handles multiple models as input', async () => {
      const { SyncApi } = await import('../sync-api.js')
      const sync = new SyncApi(
        { chainId: 'eip155:1337', db: process.env.DATABASE_URL as string },
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any
      )

      const addSyncJob = jest.fn()
      sync._addSyncJob = addSyncJob as any

      const data = { fromBlock: 1, toBlock: 10, models: ['abc123', 'def456'] }
      await sync.startModelSync(data.fromBlock, data.toBlock, data.models)
      expect(addSyncJob).toHaveBeenCalledWith(data)
      expect(Array.from(sync.modelsToSync)).toEqual(data.models)
    })
  })

  test('_addSyncJob() creates a sync job and adds it to the queue', async () => {
    const { SyncApi } = await import('../sync-api.js')
    const sync = new SyncApi(
      { chainId: 'eip155:1337', db: process.env.DATABASE_URL as string },
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any
    )

    const addJob = jest.fn()
    // @ts-ignore private field
    sync.jobQueue = { addJob }

    const data = { fromBlock: 1, toBlock: 10, models: ['abc123', 'abc456'] }
    await sync._addSyncJob(data)
    expect(addJob).toHaveBeenCalledWith(createSyncJob(data))
  })

  test('_updateStoredState() updates the state in DB', async () => {
    const { STATE_TABLE_NAME, SyncApi } = await import('../sync-api.js')
    const sync = new SyncApi(
      { chainId: 'eip155:1337', db: process.env.DATABASE_URL as string },
      {} as any,
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
