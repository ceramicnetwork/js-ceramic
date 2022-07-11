import type { Knex } from 'knex'

export async function createModelTable(dataSource: Knex, tableName: string) {
  await dataSource.schema.createTable(tableName, function (table) {
    // create unique index name <64 chars that is still referenceable to MID table
    const indexName = tableName.substring(tableName.length - 10)

    table.string('stream_id').primary(`idx_${indexName}_pkey`).unique(`constr_${indexName}_unique`)
    table.string('controller_did').notNullable()
    table.dateTime('last_anchored_at')
    table.dateTime('created_at').notNullable().defaultTo(dataSource.fn.now())
    table.dateTime('updated_at').notNullable().defaultTo(dataSource.fn.now())

    table.index(['stream_id'], `idx_${indexName}_stream_id`, {
      storageEngineIndexType: 'hash',
    })
    table.index(['last_anchored_at'], `idx_${indexName}_last_anchored_at`, {
      storageEngineIndexType: 'hash',
    })
    table.index(['created_at'], `idx_${indexName}_created_at`, {
      storageEngineIndexType: 'hash',
    })
    table.index(['updated_at'], `idx_${indexName}_updated_at`, {
      storageEngineIndexType: 'hash',
    })
    table.index(
      ['last_anchored_at', 'created_at'],
      `idx_${indexName}_last_anchored_at_created_at`,
      {
        storageEngineIndexType: 'hash',
      }
    )
  })
}
