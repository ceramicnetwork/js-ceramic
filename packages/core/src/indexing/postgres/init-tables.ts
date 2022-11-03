import {
  ColumnInfo,
  ColumnType,
  createConfigTable,
  createModelTable,
} from './migrations/1-create-model-table.js'
import { asTableName } from '../as-table-name.util.js'
import { Knex } from 'knex'
import { Model, ModelRelationsDefinition } from '@ceramicnetwork/stream-model'
import { DiagnosticsLogger } from '@ceramicnetwork/common'
import { INDEXED_MODEL_CONFIG_TABLE_NAME, IndexModelArgs } from '../database-index-api.js'
import {
  COMMON_TABLE_STRUCTURE,
  CONFIG_TABLE_MODEL_INDEX_STRUCTURE,
  RELATION_COLUMN_STRUCTURE,
} from './migrations/cdb-schema-verification.js'

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
export async function listMidTables(dataSource: Knex): Promise<Array<string>> {
  const midTables = []
  const result = await dataSource
    .select('tablename')
    .from('pg_tables')
    .andWhere((q) => q.whereLike('tablename', 'kjz%').orWhere('tablename', Model.MODEL.toString()))

  result.forEach(function (value) {
    midTables.push(value.tablename)
  })
  return midTables
}

/**
 * List existing config tables.
 */
export function listConfigTables(): Array<ConfigTable> {
  // TODO (CDB-1852): extend with ceramic_auth; If it will need to be async, see if it can be parallelised within initConfigTables(...)
  return [{ tableName: INDEXED_MODEL_CONFIG_TABLE_NAME, validSchema: CONFIG_TABLE_MODEL_INDEX_STRUCTURE }]
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
export async function initConfigTables(dataSource: Knex, logger: DiagnosticsLogger) {
  const configTables = listConfigTables()
  await Promise.all(configTables.map( table => {
    return initConfigTable(table, dataSource, logger)
  }))
}

/**
 * Create a single DB config table
 */
async function initConfigTable(table: ConfigTable, dataSource: Knex, logger: DiagnosticsLogger) {
  const exists = await dataSource.schema.hasTable(table.tableName)
  if (!exists) {
    logger.imp(`Creating Compose DB config table: ${table.tableName}`)
    await createConfigTable(dataSource, table.tableName)
  }
}

/**
 * Create mid tables and corresponding indexes
 */
export async function initMidTables(
  dataSource: Knex,
  modelsToIndex: Array<IndexModelArgs>,
  logger: DiagnosticsLogger
) {
  await Promise.all(modelsToIndex.map( modelIndexArgs => {
    return initMidTable(modelIndexArgs, dataSource, logger)
  }))
}

/**
 * Create a single mid table for a given model
 */
async function initMidTable(modelIndexArgs: IndexModelArgs, dataSource: Knex, logger: DiagnosticsLogger) {
  const tableName = asTableName(modelIndexArgs.model)
  if (tableName.length > 63) {
    const errStr = `Cannot index model ${modelIndexArgs.model.toString()}.  Table name is too long: ${tableName}`
    logger.err(errStr)
    throw new Error(errStr)
  }

  const exists = await dataSource.schema.hasTable(tableName)
  if (!exists) {
    logger.imp(`Creating Compose DB Indexing table for model: ${tableName}`)
    const relationColumns = relationsDefinitionsToColumnInfo(modelIndexArgs.relations)
    await createModelTable(dataSource, tableName, relationColumns)
  }
}

/**
 * Compose DB configuration table schema verification
 */
async function _verifyConfigTables(dataSource: Knex) {
  const configTables = listConfigTables()
  await Promise.all(configTables.map( table => {
    return _verifyConfigTable(table, dataSource)
  }))
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
  await Promise.all(tableNames.map( tableName => {
    return _verifyMidTable(tableName, dataSource, modelsToIndex)
  }))
}

/**
 * Verify a single mid table schema
 */
async function _verifyMidTable(tableName: string, dataSource: Knex, modelsToIndex: Array<IndexModelArgs>) {
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
  await Promise.all([
    _verifyConfigTables(dataSource),
    _verifyMidTables(dataSource, modelsToIndex)
  ])
}
