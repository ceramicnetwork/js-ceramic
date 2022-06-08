//import type { DataSource } from 'typeorm'
import type { StreamID } from '@ceramicnetwork/streamid'
import { createModelTable } from './migrations/1-create-model-table.js'
import { asTableName } from '../as-table-name.util.js'
import { knex, Knex } from 'knex'

/**
 * List existing `mid_%` tables.
 */
export async function listMidTables(dataSource: any): Promise<Array<string>> {
    const result: Array<{ name: string }> = await dataSource.query(`
        SELECT table_name AS name
        FROM information_schema.tables
        WHERE table_name LIKE 'mid_%'
            AND table_schema NOT IN ('information_schema', 'pg_catalog')
            AND table_type = 'BASE TABLE'
        ORDER BY table_name,
                table_schema;
    `)
    return result.map((r) => r.name)
}

/**
 * Create `mid_%` tables and corresponding indexes.
 */
export async function initTables(dataSource: any, modelsToIndex: Array<StreamID>) {

  console.log('>>>>>>>> initTables')
  dataSource.hasTable('users').then(function(exists) {
    if (!exists) {
      return dataSource.schema.createTable('users', function(t) {
        t.increments('id').primary();
        t.string('first_name', 100);
        t.string('last_name', 100);
        t.text('bio');
      });
    }
  });

  /*const existingTables = await listMidTables(dataSource)
  const expectedTables = modelsToIndex.map(asTableName).map((tableName) => {return tableName.substring(0, 'mid_'.length + 10)})
  const tablesToCreate = expectedTables.filter((tableName) => !existingTables.includes(tableName))
  for (const tableName of tablesToCreate) {
    await createModelTable(dataSource, tableName)
  }*/
}
