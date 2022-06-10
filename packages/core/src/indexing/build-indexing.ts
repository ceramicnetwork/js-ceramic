import type { DatabaseIndexAPI } from './types.js'
import type { StreamID } from '@ceramicnetwork/streamid'
import { SqliteIndexApi } from './sqlite/sqlite-index-api.js'
import { PostgresIndexApi } from './postgres/postgres-index-api.js'
import { DataSource } from 'typeorm'
import Knex from 'knex'

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
      console.log("indexingConfig", JSON.stringify(indexingConfig))
      // FIXME: Take conn params from input params
      /*const dataSource = new DataSource({
        type: "postgres",
        host: "localhost",
        port: 5432,
        username: "ceramic",
        password: "password",
        database: "ceramic",
        synchronize: true,
        logging: true,
      })*/
      console.log('build-indexing.ts')
      const dataSource = Knex({
        client: 'pg',
        connection: 'postgres://ceramic:password@127.0.0.1:5432/ceramic', //process.env.PG_CONNECTION_STRING,
        searchPath: ['ceramic', 'public'],
      });

      return new PostgresIndexApi(dataSource, indexingConfig.models)
    }
    default:
      throw new UnsupportedDatabaseProtocolError(protocol)
  }
}
