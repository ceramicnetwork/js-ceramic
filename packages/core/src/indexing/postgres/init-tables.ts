import type { StreamID } from '@ceramicnetwork/streamid'
import { createModelTable } from './migrations/1-create-model-table.js'
import { asTableName } from '../as-table-name.util.js'
import { Knex } from 'knex'
import { Model } from '@ceramicnetwork/stream-model'

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
 * Create mid tables and corresponding indexes
 */
export async function initTables(dataSource: Knex, modelsToIndex: Array<StreamID>) {
  const expectedTables = modelsToIndex.map(asTableName).map((tableName) => {
    if (tableName.length > 63) {
      console.error(`Invalid model added to config file: ${tableName}`)
      process.exit(-1)
    }
    return tableName
  })

  for (const tableName of expectedTables) {
    const exists = await dataSource.schema.hasTable(tableName)
    if (!exists) {
      await createModelTable(dataSource, tableName)
    }
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
  validTableStructure: Object
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
