/**
 * Expected Postgres structure for columns for relations.
 * Used to verify table integrity during node startup and after indexing a new model.
 */
export const RELATION_COLUMN_STRUCTURE = {
  type: 'character varying',
  maxLength: 1024,
  nullable: false,
  defaultValue: null,
}

/**
 * Valid Postgres table structure for mid tables
 * Used to verify table integrity during node startup and after indexing a new model
 */
export const COMMON_TABLE_STRUCTURE = {
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
}
