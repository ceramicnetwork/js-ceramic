import type { DatabaseIndexAPI } from './types.js'
import type { StreamID } from '@ceramicnetwork/streamid'
import { SqliteIndexApi } from './sqlite/sqlite-index-api.js'
import { PostgresIndexApi } from './postgres/postgres-index-api.js'
import { DataSource } from 'typeorm'

export type IndexingConfig = {
  /**
   * Database connection string.
   */
  db: string

  /**
   * List of models to index.
   */
  models: Array<StreamID>
}

export class UnsupportedDatabaseProtocolError extends Error {
  constructor(protocol: string) {
    super(`Not supported database protocol ${protocol}`)
  }
}

/**
 * Build DatabaseIndexAPI instance based on passed indexing configuration.
 */
export function buildIndexing(indexingConfig: IndexingConfig): DatabaseIndexAPI {
  const connectionString = new URL(indexingConfig.db)
  const protocol = connectionString.protocol.replace(/:$/, '')
  switch (protocol) {
    case 'sqlite':
    case 'sqlite3': {
      const dataSource = new DataSource({
        type: 'sqlite',
        database: connectionString.pathname,
      })
      return new SqliteIndexApi(dataSource, indexingConfig.models)
    }
    case 'postgres': {
      const dataSource = new DataSource({
        type: protocol,
        database: connectionString.pathname,
      })
      return new PostgresIndexApi(dataSource, indexingConfig.models)
    }
    default:
      throw new UnsupportedDatabaseProtocolError(protocol)
  }
}
