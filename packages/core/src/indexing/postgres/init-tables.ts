//import type { DataSource } from 'typeorm'
import type { StreamID } from '@ceramicnetwork/streamid'
import { createModelTable, createModelTableKnex } from './migrations/1-create-model-table.js'
import { asTableName } from '../as-table-name.util.js'

/**
 * Create `mid_%` tables and corresponding indexes.
 */
export async function initTables(dataSource: any, modelsToIndex: Array<StreamID>) {
  console.log('>>>>>>>> KNEX Postgres initTables & IDX test')

  // cut name below 65 chars as test
  // TODO: find 65char limit solution
  const expectedTables = modelsToIndex.map(asTableName).map((tableName) => {
    return tableName.substring(0, 'mid_'.length + 10)
  })


  for (const tableName of expectedTables) {
    console.log(tableName)
    await dataSource.schema
      .hasTable('user')
      .then(function (exists) {
        console.log('exists', tableName, exists)
        if (!exists) {
          console.log('>>>> create table and index', tableName)
          createModelTableKnex(dataSource, tableName)
        } else {
          console.log('skipping')
        }
      })
      .then(function(status) {
        console.log('then create', status)
        // alter table test
        return dataSource.schema.alterTable(tableName, function (t) {
          t.string('comment_alter').defaultTo('test');
        }).then()

      })

  }

}

