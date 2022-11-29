import tmp from 'tmp-promise'
import { buildIndexing, UnsupportedDatabaseProtocolError } from '../build-indexing.js'
import { PostgresIndexApi, SqliteIndexApi } from '../database-index-api.js'
import { LoggerProvider, Networks } from '@ceramicnetwork/common'
import pgTest from '@databases/pg-test'

const diagnosticsLogger = new LoggerProvider().getDiagnosticsLogger()
// @ts-ignore default import
const getDatabase = pgTest.default

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
    },
    diagnosticsLogger,
    Networks.INMEMORY
  )
  expect(indexingApi).toBeInstanceOf(PostgresIndexApi)
  await kill()
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
