import type { DiagnosticsLogger } from '@ceramicnetwork/common'
import { Networks } from '@ceramicnetwork/common'
import { buildIndexing, IndexingConfig } from '../indexing/build-indexing.js'
import { SqliteIndexApi } from '../indexing/sqlite/sqlite-index-api.js'
import { DatabaseIndexApi } from '../indexing/database-index-api.js'

/**
 * Returns true if (1) runs on mainnet, (2) uses SQLite, (3) have models to index.
 */
function isNonProduction(
  indexApi: DatabaseIndexApi,
  network: Networks,
  modelsToIndex: any
): boolean {
  return (
    network === Networks.MAINNET && // runs on mainnet
    indexApi instanceof SqliteIndexApi && // uses SQLite
    Array.isArray(modelsToIndex) && // have models to index
    modelsToIndex.length > 0
  )
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
    logger.warn(`Indexing is not configured. Please add the indexing settings to your config file`)
    return undefined
  }
  const indexApi = buildIndexing(indexingConfig)
  if (isNonProduction(indexApi, network, indexingConfig.models)) {
    logger.warn(
      'SQLite configuration detected for indexing database.  For production deployments we recommend using Postgres not SQLite as it will scale better'
    )
  }
  return indexApi
}
