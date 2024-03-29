export type { IndexingConfig } from './build-indexing.js'
export { CONFIG_TABLE_NAME } from './config.js'
export { INDEXED_MODEL_CONFIG_TABLE_NAME } from './database-index-api.js'
export { BLOCK_CONFIRMATIONS, STATE_TABLE_NAME, SyncApi } from './history-sync/sync-api.js'
export { ISyncApi, ModelSyncOptions } from './history-sync/interfaces.js'
export { LocalIndexApi } from './local-index-api.js'
export { getDefaultCDBDatabaseConfig } from './migrations/1-create-model-table.js'
