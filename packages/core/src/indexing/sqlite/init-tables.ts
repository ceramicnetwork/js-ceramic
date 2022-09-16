import type { Knex } from 'knex'
import { ColumnInfo, ColumnType, createModelTable } from './migrations/1-create-model-table.js'
import { asTableName } from '../as-table-name.util.js'
import { Model, ModelRelationsDefinition } from '@ceramicnetwork/stream-model'
import { DiagnosticsLogger } from '@ceramicnetwork/common'
import { IndexModelArgs } from '../database-index-api.js'
import {
  COMMON_TABLE_STRUCTURE,
  RELATION_COLUMN_STRUCTURE,
} from './migrations/mid-schema-verfication.js'

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

function relationsDefinitionsToColumnInfo(relations?: ModelRelationsDefinition): Array<ColumnInfo> {
  if (!relations) {
    return []
  }
  return Object.keys(relations).map((keyName) => {
    return { name: keyName, type: ColumnType.STRING }
  })
}

/**
 * Create mid tables and corresponding indexes.
 */
export async function initTables(
  dbConnection: Knex,
  modelsToIndex: Array<IndexModelArgs>,
  logger: DiagnosticsLogger
) {
  const existingTables = await listMidTables(dbConnection)
  for (const modelIndexArgs of modelsToIndex) {
    const tableName = asTableName(modelIndexArgs.model)
    if (existingTables.includes(tableName)) {
      continue
    }
    logger.imp(`Creating ComposeDB Indexing table for model: ${tableName}`)
    const relationColumns = relationsDefinitionsToColumnInfo(modelIndexArgs.relations)
    await createModelTable(dbConnection, tableName, relationColumns)
  }
}

/**
 * Verify mid table validity via passed schema
 * @param dataSource
 * @param modelsToIndex
 */
// TODO (NET-1635): unify logic between postgres & sqlite
export async function verifyTables(dataSource: Knex, modelsToIndex: Array<IndexModelArgs>) {
  const tables = await listMidTables(dataSource)

  for (const tableName of tables) {
    const modelIndexArgs = modelsToIndex.find((model) => tableName == asTableName(model.model))
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
}
