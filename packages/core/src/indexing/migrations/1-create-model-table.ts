import type { Knex } from 'knex'
import { UnreachableCaseError, Networks } from '@ceramicnetwork/common'
import { INDEXED_MODEL_CONFIG_TABLE_NAME } from '../database-index-api.js'
import { CONFIG_TABLE_NAME } from '../config.js'
import { addColumnPrefix } from '../column-name.util.js'

export enum DatabaseType {
  POSTGRES = 'postgres',
  SQLITE = 'sqlite',
}

/**
 * The expected type for the data in the column.  For now only supports STRING as the only extra
 * columns we create are for relations which are always strings.  In the future though we may allow
 * models to specify arbitrary fields in the content to be indexed, in which case we may want to
 * support other types as well.
 */
export enum ColumnType {
  STRING,
}

/**
 * Schema information about extra columns that should be created when creating a model table.
 */
export type ColumnInfo = {
  name: string
  type: ColumnType
}

export type TableIndex = {
  keys: Array<string>
  name: string
  indexType: Knex.storageEngineIndexType
}

export type TableIndices = {
  indexName: string
  indices: Array<TableIndex>
}

export function indices(tableName: string): TableIndices {
  // create unique index name less than 64 chars that are still capable of being referenced to MID table.
  // We are creating the unique index name by grabbing the last 10 characters of the table name
  // which is normally the stream id. This combined with the rest of the index information should
  // be less than 64 characters. See CDB-1600 for more information
  const indexName = tableName.substring(tableName.length - 10)

  // index names with additional naming information should be less than
  // 64 characters, which means additional information should be less than 54 characters
  const indices: Array<TableIndex> = [
    {
      keys: ['stream_id'],
      name: `idx_${indexName}_stream_id`,
      indexType: 'hash',
    },
    {
      keys: ['last_anchored_at'],
      name: `idx_${indexName}_last_anchored_at`,
      indexType: 'hash',
    },
    {
      keys: ['first_anchored_at'],
      name: `idx_${indexName}_first_anchored_at`,
      indexType: 'hash',
    },
    {
      keys: ['created_at'],
      name: `idx_${indexName}_created_at`,
      indexType: 'hash',
    },
    {
      keys: ['updated_at'],
      name: `idx_${indexName}_updated_at`,
      indexType: 'hash',
    },
    {
      keys: ['last_anchored_at', 'created_at'],
      name: `idx_${indexName}_last_anchored_at_created_at`,
      indexType: 'btree',
    },
  ]

  return {
    indexName: indexName,
    indices: indices,
  }
}

/**
 * Default configuration of ComposeDB functionality per network.
 * Values can be overwritten by updating them in the ceramic_config table
 * and by restarting the node.
 *
 *   enable_historical_sync - enable historical data sync on a per model basis (ceramic_models)
 *   allow_queries_before_historical_sync - allow data to be queried before models have been fully synced
 *   run_historical_sync_worker - enable historical data sync on a node level
 */
export function getDefaultCDBDatabaseConfig(networkName: string): { [key: string]: any } {
  switch (networkName) {
    case 'mainnet':
    case 'elp': {
      return {
        enable_historical_sync: true,
        allow_queries_before_historical_sync: true,
        run_historical_sync_worker: false,
      }
      break
    }
    case 'testnet-clay':
      return {
        enable_historical_sync: true,
        allow_queries_before_historical_sync: true,
        run_historical_sync_worker: false,
      }
      break
    case 'local':
      return {
        enable_historical_sync: false,
        allow_queries_before_historical_sync: true,
        run_historical_sync_worker: false,
      }
      break
    case 'dev-unstable':
      return {
        enable_historical_sync: false,
        allow_queries_before_historical_sync: true,
        run_historical_sync_worker: false,
      }
      break
    case 'inmemory':
      return {
        enable_historical_sync: false,
        allow_queries_before_historical_sync: true,
        run_historical_sync_worker: false,
      }
      break
    default:
      throw new Error(`Invalid network provided during table creation: ${networkName}`)
  }
}

function createExtraColumns(
  table: Knex.CreateTableBuilder,
  indexName: string,
  extraColumns: Array<ColumnInfo>
): void {
  for (const column of extraColumns) {
    const columnName = addColumnPrefix(column.name)
    switch (column.type) {
      case ColumnType.STRING:
        table.string(columnName, 1024).notNullable()
        table.index([columnName], `idx_${indexName}_${columnName}`)
        break
      default:
        throw new UnreachableCaseError(column.type, `Invalid column type`)
    }
  }
}

export async function createPostgresModelTable(
  dataSource: Knex,
  tableName: string,
  extraColumns: Array<ColumnInfo>
): Promise<void> {
  await dataSource.schema.createTable(tableName, function (table) {
    const idx = indices(tableName)

    table
      .string('stream_id')
      .primary(`idx_${idx.indexName}_pkey`)
      .unique(`constr_${idx.indexName}_unique`)
    table.string('controller_did', 1024).notNullable()
    table.jsonb('stream_content').notNullable()
    table.string('tip').notNullable()
    table.dateTime('last_anchored_at').nullable()
    table.dateTime('first_anchored_at').nullable()
    table.dateTime('created_at').notNullable().defaultTo(dataSource.fn.now())
    table.dateTime('updated_at').notNullable().defaultTo(dataSource.fn.now())

    createExtraColumns(table, idx.indexName, extraColumns)

    for (const indexToCreate of idx.indices) {
      table.index(indexToCreate.keys, indexToCreate.name, {
        storageEngineIndexType: indexToCreate.indexType,
      })
    }
  })
}

export async function createSqliteModelTable(
  dataSource: Knex,
  tableName: string,
  extraColumns: Array<ColumnInfo>
): Promise<void> {
  await dataSource.schema.createTable(tableName, (table) => {
    const idx = indices(tableName)

    table.string('stream_id', 1024).primary().unique().notNullable()
    table.string('controller_did', 1024).notNullable()
    table.string('stream_content').notNullable()
    table.string('tip').notNullable()
    table.integer('last_anchored_at').nullable()
    table.integer('first_anchored_at').nullable()
    table.integer('created_at').notNullable()
    table.integer('updated_at').notNullable()

    createExtraColumns(table, tableName, extraColumns)

    for (const indexToCreate of idx.indices) {
      table.index(indexToCreate.keys, indexToCreate.name, {
        storageEngineIndexType: indexToCreate.indexType,
      })
    }
  })
}

export async function createConfigTable(dataSource: Knex, tableName: string, network: Networks) {
  const NETWORK_DEFAULT_CONFIG = getDefaultCDBDatabaseConfig(network)

  switch (tableName) {
    case INDEXED_MODEL_CONFIG_TABLE_NAME:
      await dataSource.schema.createTable(tableName, function (table) {
        // create model indexing configuration table
        table.string('model', 1024).unique().notNullable().primary()
        table.boolean('is_indexed').notNullable().defaultTo(true)
        table.boolean('enable_historical_sync').notNullable().defaultTo(false)
        table.dateTime('created_at').notNullable().defaultTo(dataSource.fn.now())
        table.dateTime('updated_at').notNullable().defaultTo(dataSource.fn.now())
        table.string('updated_by', 1024).notNullable()

        table.index(['is_indexed'], `idx_ceramic_is_indexed`, {
          storageEngineIndexType: 'hash',
        })
      })
      break
    case CONFIG_TABLE_NAME:
      await dataSource.schema.createTable(tableName, function (table) {
        // create configuration table
        table.string('option', 1024).notNullable().unique(`constr_config_option_unique`)
        table.string('value', 1024).notNullable()
        table.dateTime('created_at').notNullable().defaultTo(dataSource.fn.now())
        table.dateTime('updated_at').notNullable().defaultTo(dataSource.fn.now())
        table.string('updated_by', 1024).nullable()
      })

      await dataSource.into(tableName).insert({ option: 'network', value: network })
      await dataSource.into(tableName).insert({
        option: 'allow-queries-before-historical-sync',
        value: NETWORK_DEFAULT_CONFIG.allow_queries_before_historical_sync,
      })
      await dataSource.into(tableName).insert({
        option: 'run-historical-sync-worker',
        value: NETWORK_DEFAULT_CONFIG.run_historical_sync_worker,
      })
      break
    default:
      throw new Error(`Invalid config table creation requested: ${tableName}`)
  }
}
