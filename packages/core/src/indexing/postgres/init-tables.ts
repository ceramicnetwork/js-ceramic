import type { StreamID } from '@ceramicnetwork/streamid'
import { createModelTable } from './migrations/1-create-model-table.js'
import { asTableName } from '../as-table-name.util.js'
import { Knex } from 'knex'

/**
 * List existing mid tables.
 */
export async function listMidTables(dataSource: Knex): Promise<Array<string>> {
  const midTables = []
  const result = await dataSource
    .select('tablename')
    .from('pg_tables')
    .whereRaw("schemaname='public' AND tablename LIKE ('kjz%')")

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
export async function verifyTables(
  dataSource: Knex,
  modelsToIndex: Array<StreamID>,
  validTableStructure: Object
) {
  const tables = await listMidTables(dataSource)

  for (const tableName of tables) {
    const columns = await dataSource.table(tableName).columnInfo()
    if (JSON.stringify(validTableStructure) != JSON.stringify(columns)) {
      throw new Error(
        `Schema verification failed for index: ${tableName}. Please make sure latest migrations have been applied.`
      )
    }
  }
}
