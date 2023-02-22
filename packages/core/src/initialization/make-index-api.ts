import type { DiagnosticsLogger } from '@ceramicnetwork/common'
import { Networks } from '@ceramicnetwork/common'
import { buildIndexing, IndexingConfig } from '../indexing/build-indexing.js'
import { DatabaseIndexApi, SqliteIndexApi } from '../indexing/database-index-api.js'

/**
 * Make IndexAPI instance. Call `buildIndexing` inside.
 */
export function makeIndexApi(
  indexingConfig: IndexingConfig | undefined,
  network: Networks,
  logger: DiagnosticsLogger
): DatabaseIndexApi | undefined {
  if (!indexingConfig) {
    logger.warn(`Indexing is not configured. Please add the indexing settings to your config file`)
    return undefined
  }

  if (indexingConfig.composedbEnabled === false) {
    logger.warn(
      'Indexing is actively disabled. Change the corresponding CLI flag or ENV variable to enable it.'
    )
    return undefined
  }

  // TODO: extend with dynamic config check if MAINNET or sync is enabled
  if (network === Networks.MAINNET && indexingConfig.db.toLowerCase().startsWith('sqlite')) {
    logger.err(
      'SQLite is not supported for indexing in production use. Please setup a Postgres instance and update the config file.'
    )
    return undefined
  }

  const indexApi = buildIndexing(indexingConfig, logger, network)
  return indexApi
}
