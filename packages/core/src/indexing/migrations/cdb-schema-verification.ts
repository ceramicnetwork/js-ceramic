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
    /**
     * Expected Postgres structure for columns for relations.
     * Used to verify table integrity during node startup and after indexing a new model.
     */
    RELATION_COLUMN: {
      type: 'character varying',
      maxLength: 1024,
      nullable: false,
      defaultValue: null,
    },
    /**
     * Valid Postgres table structure for mid tables
     * Used to verify table integrity during node startup and after indexing a new model
     */
    COMMON_TABLE: {
      stream_id: {
        type: 'character varying',
        maxLength: 255,
        nullable: false,
        defaultValue: null,
      },
      controller_did: {
        type: 'character varying',
        maxLength: 1024,
        nullable: false,
        defaultValue: null,
      },
      stream_content: {
        type: 'jsonb',
        maxLength: null,
        nullable: false,
        defaultValue: null,
      },
      tip: {
        type: 'character varying',
        maxLength: 255,
        nullable: false,
        defaultValue: null,
      },
      last_anchored_at: {
        type: 'timestamp with time zone',
        maxLength: null,
        nullable: true,
        defaultValue: null,
      },
      first_anchored_at: {
        type: 'timestamp with time zone',
        maxLength: null,
        nullable: true,
        defaultValue: null,
      },
      created_at: {
        type: 'timestamp with time zone',
        maxLength: null,
        nullable: false,
        defaultValue: 'CURRENT_TIMESTAMP',
      },
      updated_at: {
        type: 'timestamp with time zone',
        maxLength: null,
        nullable: false,
        defaultValue: 'CURRENT_TIMESTAMP',
      },
    },
    /**
     * Valid Postgres table structure for model indexing config table
     * Used to verify table integrity during node startup and after indexing a new model
     */
    CONFIG_TABLE_MODEL_INDEX: {
      model: {
        type: 'character varying',
        maxLength: 1024,
        nullable: false,
        defaultValue: null,
      },
      is_indexed: {
        type: 'boolean',
        maxLength: null,
        nullable: false,
        defaultValue: 'true',
      },
      created_at: {
        type: 'timestamp with time zone',
        maxLength: null,
        nullable: false,
        defaultValue: 'CURRENT_TIMESTAMP',
      },
      updated_at: {
        type: 'timestamp with time zone',
        maxLength: null,
        nullable: false,
        defaultValue: 'CURRENT_TIMESTAMP',
      },
      updated_by: {
        type: 'character varying',
        maxLength: 1024,
        nullable: false,
        defaultValue: null,
      },
    },
    /**
     * Valid Postgres table structure for config table
     * Used to verify table integrity during node startup
     */
    CONFIG_TABLE: {
      network: {
        type: 'character varying',
        maxLength: 1024,
        nullable: false,
        defaultValue: null,
      },
    },
  },
  [DatabaseType.SQLITE]: {
    /**
     * Expected SQLite structure for columns for relations.
     * Used to verify table integrity during node startup and after indexing a new model.
     */
    RELATION_COLUMN: {
      type: 'varchar',
      maxLength: '1024',
      nullable: false,
      defaultValue: null,
    },
    /**
     * Valid SQLite table structure for mid tables
     * Used to verify table integrity during node startup and after indexing a new model.
     */
    COMMON_TABLE: {
      stream_id: {
        type: 'varchar',
        maxLength: '1024',
        nullable: false,
        defaultValue: null,
      },
      controller_did: {
        type: 'varchar',
        maxLength: '1024',
        nullable: false,
        defaultValue: null,
      },
      stream_content: {
        type: 'varchar',
        maxLength: '255',
        nullable: false,
        defaultValue: null,
      },
      tip: {
        type: 'varchar',
        maxLength: '255',
        nullable: false,
        defaultValue: null,
      },
      last_anchored_at: {
        type: 'integer',
        maxLength: null,
        nullable: true,
        defaultValue: null,
      },
      first_anchored_at: {
        type: 'integer',
        maxLength: null,
        nullable: true,
        defaultValue: null,
      },
      created_at: {
        type: 'integer',
        maxLength: null,
        nullable: false,
        defaultValue: null,
      },
      updated_at: {
        type: 'integer',
        maxLength: null,
        nullable: false,
        defaultValue: null,
      },
    },
    /**
     * Valid SQLite table structure for model indexing config table
     * Used to verify table integrity during node startup and after indexing a new model
     */
    CONFIG_TABLE_MODEL_INDEX: {
      model: {
        type: 'varchar',
        maxLength: '1024',
        nullable: false,
        defaultValue: null,
      },
      is_indexed: {
        type: 'boolean',
        maxLength: null,
        nullable: false,
        defaultValue: "'1'",
      },
      created_at: {
        type: 'datetime',
        maxLength: null,
        nullable: false,
        defaultValue: 'CURRENT_TIMESTAMP',
      },
      updated_at: {
        type: 'datetime',
        maxLength: null,
        nullable: false,
        defaultValue: 'CURRENT_TIMESTAMP',
      },
      updated_by: {
        type: 'varchar',
        maxLength: '1024',
        nullable: false,
        defaultValue: null,
      },
    },
    /**
     * Valid SQLite table structure for config table
     * Used to verify table integrity during node startup
     */
    CONFIG_TABLE: {
      network: {
        type: 'varchar',
        maxLength: '1024',
        nullable: false,
        defaultValue: null,
      },
    },
  },
}
