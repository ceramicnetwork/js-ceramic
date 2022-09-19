import type { Knex } from 'knex'

export async function createModelTable(dataSource: Knex, tableName: string) {
  await dataSource.schema.createTable(tableName, function (table) {
    // create unique index name <64 chars that are still capable of being referenced to MID table
    const indexName = tableName.substring(tableName.length - 10)

    table.string('stream_id').primary(`idx_${indexName}_pkey`).unique(`constr_${indexName}_unique`)
    table.string('controller_did', 1024).notNullable()
    table.jsonb('stream_content').notNullable()
    table.string('tip').notNullable()
    table.dateTime('last_anchored_at').nullable()
    table.dateTime('first_anchored_at').nullable()
    table.dateTime('created_at').notNullable().defaultTo(dataSource.fn.now())
    table.dateTime('updated_at').notNullable().defaultTo(dataSource.fn.now())

    table.index(['stream_id'], `idx_${indexName}_stream_id`, {
      storageEngineIndexType: 'hash',
    })
    table.index(['last_anchored_at'], `idx_${indexName}_last_anchored_at`, {
      storageEngineIndexType: 'hash',
    })
    table.index(['first_anchored_at'], `idx_${indexName}_first_anchored_at`, {
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

export async function createModelIndexTable(dataSource: Knex) {
  await dataSource.schema.createTableIfNotExists('ceramic_models', function (table) {
    // create indexing configuration table
    table.increments('index_id')
    table.string('model', 1024).notNullable()
    table.boolean('is_indexed').notNullable().defaultTo(true)
    table.dateTime('created_at').notNullable().defaultTo(dataSource.fn.now())
    table.dateTime('updated_at').notNullable().defaultTo(dataSource.fn.now())
    table.string('updated_by', 1024).notNullable()

    table.index(
      ['model', 'is_indexed'],
      `idx_ceramic_models_model_is_indexed`,
      {
        storageEngineIndexType: 'hash',
      }
    )
  })
}
