import type { StreamID } from '@ceramicnetwork/streamid'
import type { Knex } from 'knex'
import { ColumnType, createModelTable } from './migrations/1-create-model-table.js'
import { asTableName } from '../as-table-name.util.js'
import { Model } from '@ceramicnetwork/stream-model'
import { DiagnosticsLogger } from '@ceramicnetwork/common'
import { IndexModelArgs } from '../database-index-api'

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
    const relationColumns = Object.keys(modelIndexArgs.relations).map((keyName) => {
      return { name: keyName, type: ColumnType.STRING }
    })
    await createModelTable(dbConnection, tableName, relationColumns)
  }
}

/**
 * Verify mid table validity via passed schema
 * @param dataSource
 * @param modelsToIndex
 * @param validTableStructure
 */
// TODO (NET-1635): unify logic between postgres & sqlite
export async function verifyTables(
  dataSource: Knex,
  modelsToIndex: Array<StreamID>,
  validTableStructure: object
) {
  const tables = await listMidTables(dataSource)
  const validSchema = JSON.stringify(validTableStructure)

  for (const tableName of tables) {
    const columns = await dataSource.table(tableName).columnInfo()
    if (validSchema != JSON.stringify(columns)) {
      throw new Error(
        `Schema verification failed for index: ${tableName}. Please make sure latest migrations have been applied.`
      )
    }
  }
}
