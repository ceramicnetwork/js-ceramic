import { ColumnInfo, ColumnType, createModelTable } from './migrations/1-create-model-table.js'
import { asTableName } from '../as-table-name.util.js'
import { Knex } from 'knex'
import { Model, ModelRelationsDefinition } from '@ceramicnetwork/stream-model'
import { DiagnosticsLogger } from '@ceramicnetwork/common'
import { IndexModelArgs } from '../database-index-api.js'
import {
  COMMON_TABLE_STRUCTURE,
  RELATION_COLUMN_STRUCTURE,
} from './migrations/mid-schema-verification.js'

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

function relationsDefinitionsToColumnInfo(relations?: ModelRelationsDefinition): Array<ColumnInfo> {
  if (!relations) {
    return []
  }
  return Object.keys(relations).map((keyName) => {
    return { name: keyName, type: ColumnType.STRING }
  })
}

/**
 * Create mid tables and corresponding indexes
 */
export async function initTables(
  dataSource: Knex,
  modelsToIndex: Array<IndexModelArgs>,
  logger: DiagnosticsLogger
) {
  for (const modelIndexArgs of modelsToIndex) {
    const tableName = asTableName(modelIndexArgs.model)
    if (tableName.length > 63) {
      const errStr = `Cannot index model ${modelIndexArgs.model.toString()}.  Table name is too long: ${tableName}`
      logger.err(errStr)
      throw new Error(errStr)
    }

    const exists = await dataSource.schema.hasTable(tableName)
    if (!exists) {
      logger.imp(`Creating ComposeDB Indexing table for model: ${tableName}`)
      const relationColumns = relationsDefinitionsToColumnInfo(modelIndexArgs.relations)
      await createModelTable(dataSource, tableName, relationColumns)
    }
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
