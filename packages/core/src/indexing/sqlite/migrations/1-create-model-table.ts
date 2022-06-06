import type { DataSource } from 'typeorm'
import { Table, TableIndex } from 'typeorm'

export async function createModelTable(dataSource: DataSource, tableName: string) {
  const queryRunner = dataSource.createQueryRunner()
  const table = new Table({
    name: tableName,
    columns: [
      {
        name: 'stream_id',
        type: 'VARCHAR(1024)',
        isPrimary: true,
        isNullable: false,
        isUnique: true,
      },
      {
        name: 'controller_did',
        type: 'VARCHAR(1024)',
        isNullable: false,
      },
      {
        name: 'last_anchored_at',
        type: 'INTEGER', // SQLite way to handle timestamps
        isNullable: true,
      },
      {
        name: 'created_at',
        type: 'INTEGER', // SQLite way to handle timestamps
        isNullable: false,
      },
      {
        name: 'updated_at',
        type: 'INTEGER', // SQLite way to handle timestamps
        isNullable: false,
      },
    ],
  })
  await queryRunner.createTable(table)
  await queryRunner.createIndex(
    table,
    new TableIndex({
      name: `idx_${tableName}_stream_id`,
      columnNames: ['stream_id'],
      isUnique: true,
    })
  )
  await queryRunner.createIndex(
    table,
    new TableIndex({
      name: `idx_${tableName}_last_anchored_at`,
      columnNames: ['last_anchored_at'],
      isUnique: false,
    })
  )
  await queryRunner.createIndex(
    table,
    new TableIndex({
      name: `idx_${tableName}_created_at`,
      columnNames: ['created_at'],
      isUnique: false,
    })
  )
  await queryRunner.createIndex(
    table,
    new TableIndex({
      name: `idx_${tableName}_updated_at`,
      columnNames: ['updated_at'],
      isUnique: false,
    })
  )
  await queryRunner.createIndex(
    table,
    new TableIndex({
      name: `idx_${tableName}_last_anchored_at_created_at`,
      columnNames: ['last_anchored_at', 'created_at'],
      isUnique: false,
    })
  )
}
