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
    logger.warn(
      `Compose DB Indexing is not configured. Please add the indexing settings to your config file`
    )
    return undefined
  }

  if (indexingConfig.disableComposedb === true) {
    logger.warn(
      'Compose DB indexing is actively disabled. Change the corresponding CLI flag, config option or ENV variable to enable it.'
    )
    return undefined
  }

  const indexApi = buildIndexing(indexingConfig, logger, network)
  // TODO(CDB-2078): replace env var with config option from ceramic_config
  if (
    process.env.CERAMIC_ENABLE_EXPERIMENTAL_SYNC === 'true' &&
    indexApi instanceof SqliteIndexApi
  ) {
    throw Error(
      'SQLite is not supported for the Compose DB indexing database with historical syncing enabled. Please setup a Postgres instance and update the config file.'
    )
    return undefined
  }

  // TODO(CDB-2078): extend with addt. properties from startup if MAINNET or sync is enabled
  if (network === Networks.MAINNET && indexApi instanceof SqliteIndexApi) {
    throw Error(
      'SQLite is not supported for the Compose DB indexing database in production use. Please setup a Postgres instance and update the config file.'
    )
    return undefined
  }

  return indexApi
}
