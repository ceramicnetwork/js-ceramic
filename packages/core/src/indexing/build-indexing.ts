import type { DatabaseIndexApi } from './database-index-api.js'
import type { StreamID } from '@ceramicnetwork/streamid'
import { SqliteIndexApi } from './sqlite/sqlite-index-api.js'
import { PostgresIndexApi } from './postgres/postgres-index-api.js'
import knex from 'knex'
import { DiagnosticsLogger, Networks } from '@ceramicnetwork/common'

export type IndexingConfig = {
  /**
   * Database connection string.
   */
  db: string

  /**
   * @deprecated
   *
   * List of models to index.
   */
  // TODO: Remove this key when Admin API is implemented
  models?: Array<StreamID>

  /**
   *
   * Allow a query only if historical sync is over.
   */
  allowQueriesBeforeHistoricalSync: boolean
}

export class UnsupportedDatabaseProtocolError extends Error {
  constructor(protocol: string) {
    super(`Not supported database protocol ${protocol}`)
  }
}

class InvalidConnectionStringError extends Error {
  constructor(connectionString: string) {
    super(`Invalid database connection string: ${connectionString}`)
  }
}

function parseURL(input: string) {
  try {
    return new URL(input)
  } catch {
    throw new InvalidConnectionStringError(input)
  }
}

/**
 * Build DatabaseIndexAPI instance based on passed indexing configuration.
 */
export function buildIndexing(
  indexingConfig: IndexingConfig,
  logger: DiagnosticsLogger,
  network: Networks
): DatabaseIndexApi {
  const connectionString = parseURL(indexingConfig.db)
  const protocol = connectionString.protocol.replace(/:$/, '')
  switch (protocol) {
    case 'sqlite':
    case 'sqlite3': {
      logger.imp('Initializing SQLite connection')
      const dbConnection = knex({
        client: 'sqlite3',
        useNullAsDefault: true,
        connection: {
          filename: connectionString.pathname,
        },
      })
      return new SqliteIndexApi(
        dbConnection,
        indexingConfig.allowQueriesBeforeHistoricalSync,
        logger,
        network
      )
    }
    case 'postgres': {
      logger.imp('Initializing PostgreSQL connection')
      const dataSource = knex({
        client: 'pg',
        connection: connectionString.toString(),
      })
      return new PostgresIndexApi(
        dataSource,
        indexingConfig.allowQueriesBeforeHistoricalSync,
        logger,
        network
      )
    }
    default:
      throw new UnsupportedDatabaseProtocolError(protocol)
  }
}
