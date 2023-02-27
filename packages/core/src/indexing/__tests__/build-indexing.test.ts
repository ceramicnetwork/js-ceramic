import { jest } from '@jest/globals'
import tmp from 'tmp-promise'
import { buildIndexing, UnsupportedDatabaseProtocolError } from '../build-indexing.js'
import { PostgresIndexApi, SqliteIndexApi } from '../database-index-api.js'
import { LoggerProvider, Networks } from '@ceramicnetwork/common'
import pgTest from '@databases/pg-test'
import pgSetup from '@databases/pg-test/jest/globalSetup'
import pgTeardown from '@databases/pg-test/jest/globalTeardown'

const diagnosticsLogger = new LoggerProvider().getDiagnosticsLogger()
// @ts-ignore default import
const getDatabase = pgTest.default

jest.setTimeout(150000)

describe('sqlite', () => {
  let databaseFolder: tmp.DirectoryResult

  beforeEach(async () => {
    databaseFolder = await tmp.dir()
  })

  afterEach(async () => {
    await databaseFolder.cleanup()
  })

  test('build for sqlite connection string', () => {
    const databaseUrl = new URL(`sqlite://${databaseFolder.path}/database.sqlite`)
    const indexingApi = buildIndexing(
      {
        db: databaseUrl.href,
        allowQueriesBeforeHistoricalSync: true,
        runHistoricalSyncWorker: false,
      },
      diagnosticsLogger,
      Networks.INMEMORY
    )
    expect(indexingApi).toBeInstanceOf(SqliteIndexApi)
  })

  test('build for sqlite3 connection string', () => {
    const databaseUrl = new URL(`sqlite3://${databaseFolder.path}/database.sqlite`)
    const indexingApi = buildIndexing(
      {
        db: databaseUrl.href,
        allowQueriesBeforeHistoricalSync: true,
        runHistoricalSyncWorker: false,
      },
      diagnosticsLogger,
      Networks.INMEMORY
    )
    expect(indexingApi).toBeInstanceOf(SqliteIndexApi)
  })
})

test('build for postgres connection string', async () => {
  const { databaseURL, kill } = await getDatabase()
  const indexingApi = buildIndexing(
    {
      db: databaseURL,
      allowQueriesBeforeHistoricalSync: true,
      runHistoricalSyncWorker: false,
    },
    diagnosticsLogger,
    Networks.INMEMORY
  )
  expect(indexingApi).toBeInstanceOf(PostgresIndexApi)
  await kill()
}, 10000)

describe('postgres', () => {
  beforeAll(async () => {
    await pgSetup()
  })

  afterAll(async () => {
    await pgTeardown()
  })

  test('build for postgres connection string', async () => {
    const { databaseURL, kill } = await getDatabase()
    const indexingApi = buildIndexing(
      {
        db: databaseURL,
        allowQueriesBeforeHistoricalSync: true,
        runHistoricalSyncWorker: false,
      },
      diagnosticsLogger,
      Networks.INMEMORY
    )
    expect(indexingApi).toBeInstanceOf(PostgresIndexApi)
    await kill()
  })
})

test('throw on unsupported protocol', () => {
  const connectionString = 'garbage://host:3000/database'
  expect(() =>
    buildIndexing(
      { db: connectionString, allowQueriesBeforeHistoricalSync: true },
      diagnosticsLogger,
      Networks.INMEMORY
    )
  ).toThrow(UnsupportedDatabaseProtocolError)
})

test('throw on non-url connection string', () => {
  const connectionString = `/absolute/path/to/database.sqlite`
  expect(() =>
    buildIndexing(
      { db: connectionString, allowQueriesBeforeHistoricalSync: true },
      diagnosticsLogger,
      Networks.INMEMORY
    )
  ).toThrow()
})
