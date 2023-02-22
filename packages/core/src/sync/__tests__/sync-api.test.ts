import { jest } from '@jest/globals'
import pgSetup from '@databases/pg-test/jest/globalSetup'
import pgTeardown from '@databases/pg-test/jest/globalTeardown'
import knex, { type Knex } from 'knex'
import { Observable } from 'rxjs'

import { REBUILD_ANCHOR_JOB, HISTORY_SYNC_JOB, CONTINUOUS_SYNC_JOB } from '../interfaces.js'
import { RebuildAnchorWorker } from '../workers/rebuild-anchor.js'
import { SyncWorker, createHistorySyncJob } from '../workers/sync.js'

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
      { db: process.env.DATABASE_URL as string, on: true },
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
      [REBUILD_ANCHOR_JOB]: expect.any(RebuildAnchorWorker),
      [HISTORY_SYNC_JOB]: expect.any(SyncWorker),
      [CONTINUOUS_SYNC_JOB]: expect.any(SyncWorker),
    })
  })

  test('_initModelsToSync() loads the models to sync from DB and adds them to the local set', async () => {
    const expectedModels = ['abc123', 'abc456', 'abc789', 'def123']
    const indexedModels = jest.fn(() => Promise.resolve(expectedModels))

    const { SyncApi } = await import('../sync-api.js')
    const sync = new SyncApi(
      { db: process.env.DATABASE_URL as string, on: true },
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
        { db: process.env.DATABASE_URL as string, on: true },
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
        { db: process.env.DATABASE_URL as string, on: true },
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
      { db: process.env.DATABASE_URL as string, on: true },
      {} as any,
      {} as any,
      {} as any,
      {} as any
    )
    // @ts-ignore private field
    sync.provider = provider
    // @ts-ignore private field
    sync.chainId = 'eip155:1337'

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
      const getNetwork = () => Promise.resolve({ chainId: 1337 })
      const sync = new SyncApi(
        { db: process.env.DATABASE_URL as string, on: true },
        {} as any,
        {} as any,
        {} as any,
        {} as any
      )

      const initStateTable = jest.fn(() => ({ processedBlockNumber: 10 }))
      const initModelsToSync = jest.fn()
      const initJobQueue = jest.fn()
      const initBlockSubscription = jest.fn()
      const initPeriodicStatusLogger = jest.fn()
      sync._initStateTable = initStateTable as any
      sync._initModelsToSync = initModelsToSync as any
      sync._initJobQueue = initJobQueue as any
      sync._initBlockSubscription = initBlockSubscription as any
      sync._initPeriodicStatusLogger = initPeriodicStatusLogger as any

      await sync.init({ getBlock, getNetwork } as any)
      expect(getBlock).toHaveBeenCalledWith(-BLOCK_CONFIRMATIONS)
      expect(initStateTable).toHaveBeenCalled()
      expect(initModelsToSync).toHaveBeenCalled()
      expect(initJobQueue).toHaveBeenCalled()
      expect(initBlockSubscription).toHaveBeenCalledWith('abc123')
      expect(initBlockSubscription).toHaveBeenCalledWith('abc123')
      expect(initPeriodicStatusLogger).toHaveBeenCalled()

      await sync.shutdown()
    })

    test('adds a job to do a full sync if there is no previously processed block', async () => {
      const { SyncApi } = await import('../sync-api.js')

      const getBlock = jest.fn(() => ({ number: 10, hash: 'abc123' }))
      const getNetwork = () => Promise.resolve({ chainId: 1337 })
      const expectedModels = ['abc123', 'abc456', 'abc789', 'def123']
      const indexedModels = jest.fn(() => Promise.resolve(expectedModels))

      const sync = new SyncApi(
        { db: process.env.DATABASE_URL as string, on: true },
        {} as any,
        {} as any,
        { indexedModels } as any,
        {} as any
      )

      const initStateTable = jest.fn(() => ({ processedBlockNumber: null }))
      sync._initStateTable = initStateTable as any
      const addSyncJob = jest.fn()
      sync._addSyncJob = addSyncJob as any

      await sync.init({ getBlock, getNetwork } as any)
      expect(addSyncJob).toHaveBeenCalledWith(HISTORY_SYNC_JOB, {
        fromBlock: 0,
        toBlock: 10,
        models: expectedModels,
      })

      await sync.shutdown()
    })

    test('adds a job to sync from the previously processed block', async () => {
      const { SyncApi } = await import('../sync-api.js')

      const getBlock = jest.fn(() => ({ number: 10, hash: 'abc123' }))
      const getNetwork = () => Promise.resolve({ chainId: 1337 })
      const expectedModels = ['abc123', 'abc456', 'abc789', 'def123']
      const indexedModels = jest.fn(() => Promise.resolve(expectedModels))

      const sync = new SyncApi(
        { db: process.env.DATABASE_URL as string, on: true },
        {} as any,
        {} as any,
        { indexedModels } as any,
        {} as any
      )

      const initStateTable = jest.fn(() => ({ processedBlockNumber: 5 }))
      sync._initStateTable = initStateTable as any
      const addSyncJob = jest.fn()
      sync._addSyncJob = addSyncJob as any

      await sync.init({ getBlock, getNetwork } as any)
      expect(addSyncJob).toHaveBeenCalledWith(HISTORY_SYNC_JOB, {
        fromBlock: 5,
        toBlock: 10,
        models: expectedModels,
      })

      await sync.shutdown()
    })

    test('does not add a job if already in sync', async () => {
      const { SyncApi } = await import('../sync-api.js')
      const getBlock = jest.fn(() => ({ number: 10, hash: 'abc123' }))
      const getNetwork = () => Promise.resolve({ chainId: 1337 })
      const expectedModels = ['abc123', 'abc456', 'abc789', 'def123']
      const indexedModels = jest.fn(() => Promise.resolve(expectedModels))

      const sync = new SyncApi(
        { db: process.env.DATABASE_URL as string, on: true },
        {} as any,
        {} as any,
        { indexedModels } as any,
        {} as any
      )

      const initStateTable = jest.fn(() => ({ processedBlockNumber: 10 }))
      sync._initStateTable = initStateTable as any
      const addSyncJob = jest.fn()
      sync._addSyncJob = addSyncJob as any

      await sync.init({ getBlock, getNetwork } as any)
      expect(addSyncJob).not.toHaveBeenCalled()

      await sync.shutdown()
    })
  })

  test('shutdown() stops the anchor subscription and job queue', async () => {
    const { SyncApi } = await import('../sync-api.js')
    const sync = new SyncApi(
      { db: process.env.DATABASE_URL as string, on: true },
      {} as any,
      {} as any,
      {} as any,
      {} as any
    )

    const unsubscribe = jest.fn()
    // @ts-ignore private field
    sync.subscription = { unsubscribe }
    // @ts-ignore private field
    sync.periodicStatusLogger = { unsubscribe }
    const stop = jest.fn()
    // @ts-ignore private field
    sync.jobQueue = { stop }

    await sync.shutdown()
    expect(unsubscribe).toHaveBeenCalledTimes(2)
    expect(stop).toHaveBeenCalled()
  })

  describe('addModelSync() adds a model or models to sync', () => {
    test('handles a single model as input', async () => {
      const { SyncApi } = await import('../sync-api.js')
      const sync = new SyncApi(
        { db: process.env.DATABASE_URL as string, on: true },
        {} as any,
        {} as any,
        {} as any,
        {} as any
      )

      const addSyncJob = jest.fn()
      sync._addSyncJob = addSyncJob as any

      const data = { fromBlock: 1, toBlock: 10, models: ['abc123'] }
      await sync.startModelSync('abc123', data.fromBlock, data.toBlock)
      expect(addSyncJob).toHaveBeenCalledWith(HISTORY_SYNC_JOB, data)
      expect(Array.from(sync.modelsToSync)).toEqual(data.models)
    })

    test('handles multiple models as input', async () => {
      const { SyncApi } = await import('../sync-api.js')
      const sync = new SyncApi(
        { db: process.env.DATABASE_URL as string, on: true },
        {} as any,
        {} as any,
        {} as any,
        {} as any
      )

      const addSyncJob = jest.fn()
      sync._addSyncJob = addSyncJob as any

      const data = { fromBlock: 1, toBlock: 10, models: ['abc123', 'def456'] }
      await sync.startModelSync(data.models, data.fromBlock, data.toBlock)
      expect(addSyncJob).toHaveBeenCalledWith(HISTORY_SYNC_JOB, data)
      expect(Array.from(sync.modelsToSync)).toEqual(data.models)
    })
  })

  test('_addSyncJob() creates a sync job and adds it to the queue', async () => {
    const { SyncApi } = await import('../sync-api.js')
    const sync = new SyncApi(
      { db: process.env.DATABASE_URL as string, on: true },
      {} as any,
      {} as any,
      {} as any,
      {} as any
    )

    const addJob = jest.fn()
    // @ts-ignore private field
    sync.jobQueue = { addJob }

    const data = { fromBlock: 1, toBlock: 10, models: ['abc123', 'abc456'] }
    await sync._addSyncJob(HISTORY_SYNC_JOB, data)
    expect(addJob).toHaveBeenCalledWith(createHistorySyncJob(data))
  })

  test('_updateStoredState() updates the state in DB', async () => {
    const { STATE_TABLE_NAME, SyncApi } = await import('../sync-api.js')
    const sync = new SyncApi(
      { db: process.env.DATABASE_URL as string, on: true },
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

  describe('_handleBlockProofs', () => {
    test('adds a sync job and updates the stored state', async () => {
      const { SyncApi } = await import('../sync-api.js')
      const sync = new SyncApi(
        { db: process.env.DATABASE_URL as string, on: true },
        {} as any,
        {} as any,
        {} as any,
        {} as any
      )
      // @ts-ignore private field
      sync.modelsToSync = new Set(['abc123', 'def456'])

      const addSyncJob = jest.fn()
      sync._addSyncJob = addSyncJob as any
      const updateStoredState = jest.fn()
      sync._updateStoredState = updateStoredState as any

      await sync._handleBlockProofs({
        block: { hash: 'abc789', number: 10 },
        reorganized: false,
      } as any)
      expect(addSyncJob).toHaveBeenCalledWith(CONTINUOUS_SYNC_JOB, {
        fromBlock: 10,
        toBlock: 10,
        models: ['abc123', 'def456'],
      })
      expect(updateStoredState).toHaveBeenCalledWith({
        processedBlockHash: 'abc789',
        processedBlockNumber: 10,
      })
    })

    test('loads the expected block range on block reorganization', async () => {
      const { BLOCK_CONFIRMATIONS, SyncApi } = await import('../sync-api.js')
      const sync = new SyncApi(
        { db: process.env.DATABASE_URL as string, on: true },
        {} as any,
        {} as any,
        {} as any,
        {} as any
      )
      // @ts-ignore private field
      sync.modelsToSync = new Set(['abc123', 'def456'])

      const addSyncJob = jest.fn()
      sync._addSyncJob = addSyncJob as any
      const updateStoredState = jest.fn()
      sync._updateStoredState = updateStoredState as any

      await sync._handleBlockProofs({
        block: { hash: 'abc789', number: 100 },
        reorganized: true,
        expectedParentHash: 'ghi789',
      } as any)
      expect(addSyncJob).toHaveBeenCalledWith(HISTORY_SYNC_JOB, {
        fromBlock: 100 - BLOCK_CONFIRMATIONS,
        toBlock: 100,
        models: ['abc123', 'def456'],
      })
      expect(updateStoredState).toHaveBeenCalledWith({
        processedBlockHash: 'abc789',
        processedBlockNumber: 100,
      })
    })
  })

  test('_createJobStatus', async () => {
    const { SyncApi } = await import('../sync-api.js')
    const logger = {
      imp: jest.fn(),
    }

    const sync = new SyncApi(
      { db: process.env.DATABASE_URL as string, on: true },
      {} as any,
      {} as any,
      {} as any,
      logger as any
    )

    const getJobs = jest.fn(() =>
      Promise.resolve({
        [HISTORY_SYNC_JOB]: [
          {
            name: HISTORY_SYNC_JOB,
            data: { fromBlock: 100, toBlock: 200, currentBlock: 101 },
            id: '12345',
            startedOn: new Date(1677015880491),
            createdOn: new Date(1677015880491 - 100000),
            completedOn: null,
          },
        ],
        [CONTINUOUS_SYNC_JOB]: [
          {
            name: CONTINUOUS_SYNC_JOB,
            data: { fromBlock: 500, toBlock: 500 },
            id: '12345',
            startedOn: new Date(1677015880491),
            createdOn: new Date(1677015880491 - 100000),
            completedOn: null,
          },
        ],
      })
    )

    // @ts-ignore private field
    sync.jobQueue = {
      getJobs,
    }
    // @ts-ignore private field
    sync.startBlock = 499

    await sync._logSyncStatus()

    expect(getJobs).toHaveBeenCalledWith('active', [CONTINUOUS_SYNC_JOB, HISTORY_SYNC_JOB])
    expect(getJobs).toHaveBeenCalledWith('created', [CONTINUOUS_SYNC_JOB, HISTORY_SYNC_JOB])
    const status = logger.imp.mock.calls[0][0]
    expect(status).toMatchSnapshot()
  })

  test('_initPeriodicStatusLogger', async () => {
    const { SyncApi } = await import('../sync-api.js')
    const logger = {
      imp: jest.fn(),
    }

    const sync = new SyncApi(
      { db: process.env.DATABASE_URL as string, on: true },
      {} as any,
      {} as any,
      {} as any,
      logger as any
    )

    const getJobs = jest.fn(() =>
      Promise.resolve({
        name: 'jobName',
        data: { data: 'tests' },
        id: '12345',
        startedOn: new Date(),
        createdOn: new Date(Date.now() - 100000),
        completedOn: null,
      })
    )

    // @ts-ignore private field
    sync.jobQueue = {
      getJobs,
    }

    sync._initPeriodicStatusLogger()
    // @ts-ignore private field
    expect(sync.periodicStatusLogger).toBeDefined()
    // @ts-ignore private field
    sync.periodicStatusLogger?.unsubscribe()
  })
})
