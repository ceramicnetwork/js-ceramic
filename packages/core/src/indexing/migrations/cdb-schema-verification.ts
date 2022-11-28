import * as postgres from '../postgres/migrations/cdb-schema-verification.js'
import * as sqlite from '../sqlite/migrations/cdb-schema-verfication.js'
import { DatabaseType } from './1-create-model-table.js'

// Copied from Knex but not exported
interface ColumnInfo {
  defaultValue: any // Value in Knex
  type: string
  maxLength: number | string
  nullable: boolean
}
type TableInfo = Record<string, ColumnInfo>
type TableName = 'COMMON_TABLE' | 'CONFIG_TABLE_MODEL_INDEX' | 'CONFIG_TABLE'
type StructuresRecord = Record<TableName, TableInfo> & { RELATION_COLUMN: ColumnInfo }

export const STRUCTURES: Record<DatabaseType, StructuresRecord> = {
  [DatabaseType.POSTGRES]: {
    RELATION_COLUMN: postgres.RELATION_COLUMN_STRUCTURE,
    COMMON_TABLE: postgres.COMMON_TABLE_STRUCTURE,
    CONFIG_TABLE_MODEL_INDEX: postgres.CONFIG_TABLE_MODEL_INDEX_STRUCTURE,
    CONFIG_TABLE: postgres.CONFIG_TABLE_STRUCTURE,
  },
  [DatabaseType.SQLITE]: {
    RELATION_COLUMN: sqlite.RELATION_COLUMN_STRUCTURE,
    COMMON_TABLE: sqlite.COMMON_TABLE_STRUCTURE,
    CONFIG_TABLE_MODEL_INDEX: sqlite.CONFIG_TABLE_MODEL_INDEX_STRUCTURE,
    CONFIG_TABLE: sqlite.CONFIG_TABLE_STRUCTURE,
  },
}
