import type { DiagnosticsLogger } from '@ceramicnetwork/common'
import { Networks } from '@ceramicnetwork/common'
import { buildIndexing, IndexingConfig } from './build-indexing.js'
import { DatabaseIndexApi, SqliteIndexApi } from './database-index-api.js'

export class UnsupportedIndexingDatabaseError extends Error {
  constructor() {
    super(
      'SQLite is not supported for the ComposeDB indexing database in production use. Please setup a Postgres instance and update the config file to use ComposeDB, or disable ComposeDB to start up without an indexing database.'
    )
  }
}

/**
 * Make IndexAPI instance. Call `buildIndexing` inside.
 */
export function makeIndexApi(
  indexingConfig: IndexingConfig | undefined,
  network: Networks,
  logger: DiagnosticsLogger
): DatabaseIndexApi | undefined {
  if (!indexingConfig) {
    logger.warn(
      `ComposeDB Indexing is not configured. Please add the indexing settings to your config file`
    )
    return undefined
  }

  if (indexingConfig.disableComposedb === true) {
    logger.warn(
      'ComposeDB indexing is actively disabled. Change the corresponding CLI flag, config option or ENV variable to enable it.'
    )
    return undefined
  }

  const indexApi = buildIndexing(indexingConfig, logger, network)
  // TODO(CDB-2310): replace experimental env var with config option from ceramic_config
  if (indexingConfig.enableHistoricalSync && indexApi instanceof SqliteIndexApi) {
    throw new UnsupportedIndexingDatabaseError()
  }

  // TODO(CDB-2078): extend with addt. properties from startup if MAINNET or sync is enabled
  if (network === Networks.MAINNET && indexApi instanceof SqliteIndexApi) {
    throw new UnsupportedIndexingDatabaseError()
  }

  return indexApi
}
