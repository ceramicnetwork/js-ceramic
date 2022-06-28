import type { StreamID } from '@ceramicnetwork/streamid'
import type { Knex } from 'knex'
import { createModelTable } from './migrations/1-create-model-table.js'
import { asTableName } from '../as-table-name.util.js'

/**
 * List existing `mid_%` tables.
 */
export async function listMidTables(dbConnection: Knex): Promise<Array<string>> {
  const result: Array<{ name: string }> = await dbConnection
    .from('sqlite_schema')
    .select('name')
    .whereIn('type', ['table'])
    .andWhereLike('name', 'mid_%')
  return result.map((r) => r.name)
}

/**
 * Create `mid_%` tables and corresponding indexes.
 */
export async function initTables(dbConnection: Knex, modelsToIndex: Array<StreamID>) {
  const existingTables = await listMidTables(dbConnection)
  const expectedTables = modelsToIndex.map(asTableName)
  const tablesToCreate = expectedTables.filter((tableName) => !existingTables.includes(tableName))
  for (const tableName of tablesToCreate) {
    await createModelTable(dbConnection, tableName)
  }
}
