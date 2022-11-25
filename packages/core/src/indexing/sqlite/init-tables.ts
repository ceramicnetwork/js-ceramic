import type { Knex } from 'knex'
import {
  ColumnInfo,
  ColumnType,
  createConfigTable,
  createModelTable,
} from './migrations/1-create-model-table.js'
import { asTableName } from '../as-table-name.util.js'
import { Model, ModelRelationsDefinition } from '@ceramicnetwork/stream-model'
import { DiagnosticsLogger, Networks } from '@ceramicnetwork/common'
import { INDEXED_MODEL_CONFIG_TABLE_NAME, IndexModelArgs } from '../database-index-api.js'
import {
  COMMON_TABLE_STRUCTURE,
  RELATION_COLUMN_STRUCTURE,
  CONFIG_TABLE_MODEL_INDEX_STRUCTURE,
  CONFIG_TABLE_STRUCTURE,
} from './migrations/cdb-schema-verfication.js'
import { CONFIG_TABLE_NAME } from '../config.js'

/**
 * Compose DB Config Table Type
 */
type ConfigTable = {
  readonly tableName: string
  readonly validSchema: object
}

/**
 * List existing mid tables.
 */
export async function listMidTables(dbConnection: Knex): Promise<Array<string>> {
  const result: Array<{ name: string }> = await dbConnection
    .from('sqlite_schema')
    .select('name')
    .whereIn('type', ['table'])
    .andWhere((q) => q.whereLike('name', 'kjz%').orWhere('name', Model.MODEL.toString()))
  return result.map((r) => r.name)
}

/**
 * List existing config tables.
 */
export function listConfigTables(): Array<ConfigTable> {
  // TODO (CDB-1852): extend with ceramic_auth; If it will need to be async, see if it can be parallelised within initConfigTables(...)
  return [
    { tableName: INDEXED_MODEL_CONFIG_TABLE_NAME, validSchema: CONFIG_TABLE_MODEL_INDEX_STRUCTURE },
    { tableName: CONFIG_TABLE_NAME, validSchema: CONFIG_TABLE_STRUCTURE },
  ]
}

/**
 * Create a list of db column info for relations in a given model
 */
function relationsDefinitionsToColumnInfo(relations?: ModelRelationsDefinition): Array<ColumnInfo> {
  if (!relations) {
    return []
  }
  return Object.keys(relations).map((keyName) => {
    return { name: keyName, type: ColumnType.STRING }
  })
}

/**
 * Create Compose DB config tables
 */
export async function initConfigTables(
  dataSource: Knex,
  logger: DiagnosticsLogger,
  network: Networks
) {
  const configTables = await listConfigTables()
  await Promise.all(
    configTables.map((table) => {
      return initConfigTable(table, dataSource, logger, network)
    })
  )
}

/**
 * Create a single DB config table
 */
async function initConfigTable(
  table: ConfigTable,
  dataSource: Knex,
  logger: DiagnosticsLogger,
  network: Networks
) {
  const exists = await dataSource.schema.hasTable(table.tableName)
  if (!exists) {
    logger.imp(`Creating Compose DB config table: ${table.tableName}`)
    await createConfigTable(dataSource, table.tableName, network)
  } else if (table.tableName === CONFIG_TABLE_NAME) {
    const config = await dataSource.from(table.tableName).first('network')
    if (config.network !== network) {
      throw new Error(
        `Initialization failed for config table: ${table.tableName}. The database is configured to use the network ${config.network} but the current network is ${network}.`
      )
    }
  }
}

/**
 * Create mid tables and corresponding indexes.n
 */
export async function initMidTables(
  dbConnection: Knex,
  modelsToIndex: Array<IndexModelArgs>,
  logger: DiagnosticsLogger
) {
  const existingTables = await listMidTables(dbConnection)
  await Promise.all(
    modelsToIndex.map((modelIndexArgs) => {
      return initMidTable(modelIndexArgs, existingTables, dbConnection, logger)
    })
  )
}

/**
 * Create a single mid table for a given model
 */
async function initMidTable(
  modelIndexArgs: IndexModelArgs,
  existingTables: Array<string>,
  dbConnection: Knex,
  logger: DiagnosticsLogger
) {
  const tableName = asTableName(modelIndexArgs.model)
  if (existingTables.includes(tableName)) {
    return
  }
  logger.imp(`Creating Compose DB Indexing table for model: ${tableName}`)
  const relationColumns = relationsDefinitionsToColumnInfo(modelIndexArgs.relations)
  await createModelTable(dbConnection, tableName, relationColumns)
}

/**
 * Compose DB configuration table schema verification
 */
async function _verifyConfigTables(dataSource: Knex) {
  const configTables = listConfigTables()
  await Promise.all(
    configTables.map((configTable) => {
      return _verifyConfigTable(configTable, dataSource)
    })
  )
}

/**
 * Verify a single config table schema
 */
async function _verifyConfigTable(table: ConfigTable, dataSource: Knex) {
  const columns = await dataSource.table(table.tableName).columnInfo()
  const validSchema = JSON.stringify(table.validSchema)

  if (validSchema != JSON.stringify(columns)) {
    throw new Error(
      `Schema verification failed for config table: ${table.tableName}. Please make sure node has been setup correctly.`
    )
    process.exit(-1)
  }
}

/**
 * Compose DB Model Instance Document table schema verification
 */
async function _verifyMidTables(dataSource: Knex, modelsToIndex: Array<IndexModelArgs>) {
  const tableNames = await listMidTables(dataSource)
  await Promise.all(
    tableNames.map((tableName) => {
      return _verifyMidTable(tableName, dataSource, modelsToIndex)
    })
  )
}

/**
 * Verify a single mid table schema
 */
async function _verifyMidTable(
  tableName: string,
  dataSource: Knex,
  modelsToIndex: Array<IndexModelArgs>
) {
  const modelIndexArgs = modelsToIndex.find((model) => tableName == asTableName(model.model))
  if (!modelIndexArgs) {
    // TODO: CDB-1869 - This means that there's is a table for a model that is no longer indexed. Should this table have been deleted?
    return
  }

  // Clone the COMMON_TABLE_STRUCTURE object that has the fields expected for all tables so we can
  // extend it with the model-specific fields expected
  const expectedTableStructure = Object.assign({}, COMMON_TABLE_STRUCTURE)
  if (modelIndexArgs.relations) {
    for (const relation of Object.keys(modelIndexArgs.relations)) {
      expectedTableStructure[relation] = RELATION_COLUMN_STRUCTURE
    }
  }
  const validSchema = JSON.stringify(expectedTableStructure)

  const columns = await dataSource.table(tableName).columnInfo()
  if (validSchema != JSON.stringify(columns)) {
    throw new Error(
      `Schema verification failed for index: ${tableName}. Please make sure latest migrations have been applied.`
    )
  }
}

/**
 * Public function to run table schema verification helpers
 */
// TODO (NET-1635): unify logic between postgres & sqlite
export async function verifyTables(dataSource: Knex, modelsToIndex: Array<IndexModelArgs>) {
  await Promise.all([_verifyConfigTables(dataSource), _verifyMidTables(dataSource, modelsToIndex)])
}
