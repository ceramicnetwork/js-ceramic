import mergeOpts from 'merge-options'
import { CeramicConfig, Ceramic } from '@ceramicnetwork/core'
import { IpfsApi } from '@ceramicnetwork/common'
import tmp from 'tmp-promise'
import { createDid } from './create_did.js'
import type { ProvidersCache } from '@ceramicnetwork/core'

export async function createCeramic(
  ipfs: IpfsApi,
  config: CeramicConfig & { seed?: string } = {},
  providersCache?: ProvidersCache
): Promise<Ceramic> {
  const stateStoreDirectory = await tmp.tmpName()
  const appliedConfig = mergeOpts(
    {
      stateStoreDirectory: stateStoreDirectory,
      anchorOnRequest: false,
      streamCacheLimit: 100,
      pubsubTopic: '/ceramic/inmemory/test', // necessary so Ceramic instances can talk to each other
      indexing: {
        db: `sqlite://${stateStoreDirectory}/ceramic.sqlite`,
        allowQueriesBeforeHistoricalSync: false,
        disableComposedb: false,
        enableHistoricalSync: false,
      },
      sync: false,
    },
    config
  )

  const [modules, params] = await Ceramic._processConfig(ipfs, appliedConfig)
  if (providersCache) {
    modules.providersCache = providersCache
  }
  const ceramic = new Ceramic(modules, params)
  await ceramic._init(false)

  const did = createDid(ceramic, appliedConfig.seed || 'SEED')
  ceramic.did = did
  await did.authenticate()

  return ceramic
}
