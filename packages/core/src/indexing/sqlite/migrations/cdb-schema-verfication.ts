/**
 * Expected SQLite structure for columns for relations.
 * Used to verify table integrity during node startup and after indexing a new model.
 */
export const RELATION_COLUMN_STRUCTURE = {
  type: 'varchar',
  maxLength: '1024',
  nullable: false,
  defaultValue: null,
}

/**
 * Valid SQLite table structure for mid tables
 * Used to verify table integrity during node startup and after indexing a new model.
 */
export const COMMON_TABLE_STRUCTURE = {
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
}

/**
 * Valid SQLite table structure for model indexing config table
 * Used to verify table integrity during node startup and after indexing a new model
 */
export const CONFIG_TABLE_MODEL_INDEX_STRUCTURE = {
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
}

/**
 * Valid SQLite table structure for config table
 * Used to verify table integrity during node startup
 */
export const CONFIG_TABLE_STRUCTURE = {
  network: {
    type: 'varchar',
    maxLength: '1024',
    nullable: false,
    defaultValue: null,
  },
}
