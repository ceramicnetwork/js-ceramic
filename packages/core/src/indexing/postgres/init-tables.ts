import type { StreamID } from '@ceramicnetwork/streamid'
import { createModelTable } from './migrations/1-create-model-table.js'
import { asTableName } from '../as-table-name.util.js'
import { Knex } from 'knex'

/**
 * Create `mid_%` tables and corresponding indexes.
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
    await dataSource.schema.hasTable(tableName).then(function (exists) {
        if (!exists) {
          createModelTable(dataSource, tableName)
        }
      })
  }
}
