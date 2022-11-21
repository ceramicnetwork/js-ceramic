import mergeOpts from 'merge-options'
import { CeramicConfig, Ceramic } from '@ceramicnetwork/core'
import { IpfsApi } from '@ceramicnetwork/common'
import tmp from 'tmp-promise'
import { createDid } from './create_did.js'

export async function createCeramic(
  ipfs: IpfsApi,
  config: CeramicConfig & { seed?: string } = {}
): Promise<Ceramic> {
  const stateStoreDirectory = await tmp.tmpName()
  const appliedConfig: CeramicConfig = mergeOpts(
    {
      stateStoreDirectory: stateStoreDirectory,
      anchorOnRequest: false,
      streamCacheLimit: 100,
      pubsubTopic: '/ceramic/inmemory/test', // necessary so Ceramic instances can talk to each other
      indexing: {
        db: `sqlite://${stateStoreDirectory}/ceramic.sqlite`,
        allowQueriesBeforeHistoricalSync: false,
      },
    },
    config
  )
  const ceramic = await Ceramic.create(ipfs, appliedConfig)
  const did = createDid(ceramic, appliedConfig.seed || 'SEED')
  await ceramic.setDID(did)
  await did.authenticate()

  return ceramic
}
