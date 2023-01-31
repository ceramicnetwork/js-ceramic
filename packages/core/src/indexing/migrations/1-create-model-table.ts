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

function getIndexName(tableName: string): string {
  // create unique index name <64 chars that are still capable of being referenced to MID table
  return tableName.substring(tableName.length - 10)
}

function getNetworkDefaultConfig(networkName: string): { [key: string]: any } {
  // [key: string]: any
  /**
   * Default configuration of Compose DB functionality per network.
   * Values can be overwritten by updating them in the ceramic_config table
   * and by restarting the node.
   */
  let NETWORK_DEFAULT_CONFIG
  switch (networkName) {
    case 'mainnet':
      NETWORK_DEFAULT_CONFIG = {
        is_hist_sync: true,
        allow_queries_before_historical_sync: false,
        is_run_syncing_worker: true,
      }
      break
    case 'testnet-clay':
      NETWORK_DEFAULT_CONFIG = {
        is_hist_sync: true,
        allow_queries_before_historical_sync: false,
        is_run_syncing_worker: true,
      }
      break
    case 'local':
      NETWORK_DEFAULT_CONFIG = {
        is_hist_sync: false,
        allow_queries_before_historical_sync: true,
        is_run_syncing_worker: false,
      }
      break
    case 'dev-unstable':
      NETWORK_DEFAULT_CONFIG = {
        is_hist_sync: false,
        allow_queries_before_historical_sync: false,
        is_run_syncing_worker: false,
      }
      break
    case 'inmemory':
      NETWORK_DEFAULT_CONFIG = {
        is_hist_sync: false,
        allow_queries_before_historical_sync: true,
        is_run_syncing_worker: false,
      }
      break
    default:
      throw new Error(`Invalid network provided during table creation: ${networkName}`)
  }
  return NETWORK_DEFAULT_CONFIG
}

function createExtraColumns(
  table: Knex.CreateTableBuilder,
  tableName: string,
  extraColumns: Array<ColumnInfo>
): void {
  const indexName = getIndexName(tableName)
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
    const indexName = getIndexName(tableName)

    table.string('stream_id').primary(`idx_${indexName}_pkey`).unique(`constr_${indexName}_unique`)
    table.string('controller_did', 1024).notNullable()
    table.jsonb('stream_content').notNullable()
    table.string('tip').notNullable()
    table.dateTime('last_anchored_at').nullable()
    table.dateTime('first_anchored_at').nullable()
    table.dateTime('created_at').notNullable().defaultTo(dataSource.fn.now())
    table.dateTime('updated_at').notNullable().defaultTo(dataSource.fn.now())

    createExtraColumns(table, tableName, extraColumns)

    table.index(['stream_id'], `idx_${indexName}_stream_id`, {
      storageEngineIndexType: 'hash',
    })
    table.index(['last_anchored_at'], `idx_${indexName}_last_anchored_at`, {
      storageEngineIndexType: 'hash',
    })
    table.index(['first_anchored_at'], `idx_${indexName}_first_anchored_at`, {
      storageEngineIndexType: 'hash',
    })
    table.index(['created_at'], `idx_${indexName}_created_at`, {
      storageEngineIndexType: 'hash',
    })
    table.index(['updated_at'], `idx_${indexName}_updated_at`, {
      storageEngineIndexType: 'hash',
    })
    table.index(
      ['last_anchored_at', 'created_at'],
      `idx_${indexName}_last_anchored_at_created_at`,
      {
        storageEngineIndexType: 'hash',
      }
    )
  })
}

export async function createSqliteModelTable(
  dataSource: Knex,
  tableName: string,
  extraColumns: Array<ColumnInfo>
): Promise<void> {
  await dataSource.schema.createTable(tableName, (table) => {
    const indexName = getIndexName(tableName)

    table.string('stream_id', 1024).primary().unique().notNullable()
    table.string('controller_did', 1024).notNullable()
    table.string('stream_content').notNullable()
    table.string('tip').notNullable()
    table.integer('last_anchored_at').nullable()
    table.integer('first_anchored_at').nullable()
    table.integer('created_at').notNullable()
    table.integer('updated_at').notNullable()

    createExtraColumns(table, tableName, extraColumns)

    table.index(['last_anchored_at'], `idx_${indexName}_last_anchored_at`)
    table.index(['created_at'], `idx_${indexName}_created_at`)
    table.index(['updated_at'], `idx_${indexName}_updated_at`)
    table.index(['last_anchored_at', 'created_at'], `idx_${indexName}_last_anchored_at_created_at`)
    table.index(['first_anchored_at'], `idx_${indexName}_first_anchored_at`)
    table.index(
      ['first_anchored_at', 'created_at'],
      `idx_${indexName}_first_anchored_at_created_at`
    )
  })
}

export async function createConfigTable(dataSource: Knex, tableName: string, network: Networks) {
  //const NETWORK_DEFAULT_CONFIG: {[key: string]: any} = getNetworkDefaultConfig(network)
  const NETWORK_DEFAULT_CONFIG = getNetworkDefaultConfig(network)

  switch (tableName) {
    case INDEXED_MODEL_CONFIG_TABLE_NAME:
      await dataSource.schema.createTable(tableName, function (table) {
        // create model indexing configuration table
        table.string('model', 1024).unique().notNullable().primary()
        table.boolean('is_indexed').notNullable().defaultTo(true)
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
      await dataSource
        .into(tableName)
        .insert({ option: 'is-hist-sync', value: NETWORK_DEFAULT_CONFIG.is_hist_sync })
      await dataSource.into(tableName).insert({
        option: 'allow-queries-before-historical-sync',
        value: NETWORK_DEFAULT_CONFIG.allow_queries_before_historical_sync,
      })
      await dataSource.into(tableName).insert({
        option: 'is-run-syncing-worker',
        value: NETWORK_DEFAULT_CONFIG.is_run_syncing_worker,
      })
      break
    default:
      throw new Error(`Invalid config table creation requested: ${tableName}`)
  }
}
