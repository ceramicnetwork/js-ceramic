import type { DataSource } from 'typeorm'
import type { StreamID } from '@ceramicnetwork/streamid'
import { createModelTable } from './migrations/1-create-model-table.js'
import { asTableName } from '../as-table-name.util.js'

/**
 * List existing `mid_%` tables.
 */
export async function listMidTables(dataSource: DataSource): Promise<Array<string>> {
  const result: Array<{ name: string }> = await dataSource.query(
    `SELECT name FROM sqlite_schema WHERE type IN ('table') AND name LIKE 'mid_%'`
  )
  return result.map((r) => r.name)
}

/**
 * Create `mid_%` tables and corresponding indexes.
 */
export async function initTables(dataSource: DataSource, modelsToIndex: Array<StreamID>) {
  const existingTables = await listMidTables(dataSource)
  const expectedTables = modelsToIndex.map(asTableName)
  const tablesToCreate = expectedTables.filter((tableName) => !existingTables.includes(tableName))
  for (const tableName of tablesToCreate) {
    await createModelTable(dataSource, tableName)
  }
}
