import type { Knex } from 'knex'
import { UnreachableCaseError, Networks } from '@ceramicnetwork/common'
import { INDEXED_MODEL_CONFIG_TABLE_NAME } from '../../database-index-api.js'
import { CONFIG_TABLE_NAME } from '../../config.js'

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

export async function createModelTable(
  dbConnection: Knex,
  tableName: string,
  extraColumns: Array<ColumnInfo>
) {
  await dbConnection.schema.createTable(tableName, (table) => {
    table.string('stream_id', 1024).primary().unique().notNullable()
    table.string('controller_did', 1024).notNullable()
    table.string('stream_content').notNullable()
    table.string('tip').notNullable()
    table.integer('last_anchored_at').nullable()
    table.integer('first_anchored_at').nullable()
    table.integer('created_at').notNullable()
    table.integer('updated_at').notNullable()

    for (const column of extraColumns) {
      switch (column.type) {
        case ColumnType.STRING:
          table.string(column.name, 1024).notNullable()
          table.index([column.name], `idx_${tableName}_${column.name}`)
          break
        default:
          throw new UnreachableCaseError(column.type, `Invalid column type`)
      }
    }

    table.index(['last_anchored_at'], `idx_${tableName}_last_anchored_at`)
    table.index(['created_at'], `idx_${tableName}_created_at`)
    table.index(['updated_at'], `idx_${tableName}_updated_at`)
    table.index(['last_anchored_at', 'created_at'], `idx_${tableName}_last_anchored_at_created_at`)
    table.index(['first_anchored_at'], `idx_${tableName}_first_anchored_at`)
    table.index(
      ['first_anchored_at', 'created_at'],
      `idx_${tableName}_first_anchored_at_created_at`
    )
  })
}

export async function createConfigTable(dataSource: Knex, tableName: string, network: Networks) {
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
        table.string('network', 1024).notNullable()
      })
      await dataSource.into(tableName).insert({ network })
      break
    default:
      throw new Error(`Invalid config table creation requested: ${tableName}`)
      process.exit(-1)
  }
}
