import type { StreamID } from '@ceramicnetwork/streamid'
import { createModelTable } from './migrations/1-create-model-table.js'
import { asTableName } from '../as-table-name.util.js'
import { Knex } from 'knex'

/**
 * Create `mid_%` tables and corresponding indexes.
 */
export async function initTables(dataSource: Knex, modelsToIndex: Array<StreamID>) {
  // TODO: add 64chars enforcement
  const expectedTables = modelsToIndex.map(asTableName).map((tableName) => {
    if (tableName.length > 63) {
      console.error(`Invalid model added to config file: ${tableName}`)
      process.exit(-1)
    }
    return tableName
  })

  for (const tableName of expectedTables) {
    console.log(tableName)
    await dataSource.schema
      .hasTable(tableName)
      .then(function (exists) {
        console.log('exists', tableName, exists)
        if (!exists) {
          console.log('>>>> create table and index', tableName)
          createModelTable(dataSource, tableName)
        } else {
          console.log('skipping')
        }
      }).then()
      /*.then(function (status) {
        console.log('then create', status)
        // alter table test
        return dataSource.schema
          .alterTable(tableName, function (t) {
            t.string('comment_alter').defaultTo('test')
          })
          .then()
      })*/
  }
}
