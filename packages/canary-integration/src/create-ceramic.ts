import { CeramicConfig, Ceramic } from '@ceramicnetwork/core'
import { IpfsApi } from '@ceramicnetwork/common'
import * as uint8arrays from 'uint8arrays'
import * as sha256 from '@stablelib/sha256'
import tmp from 'tmp-promise'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import * as ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'
import * as KeyDidResolver from 'key-did-resolver'
import { Resolver } from 'did-resolver'
import { DID } from 'dids'

export async function createCeramic(
  ipfs: IpfsApi,
  config?: CeramicConfig & { seed?: string }
): Promise<Ceramic> {
  const appliedConfig = {
    stateStoreDirectory: await tmp.tmpName(),
    anchorOnRequest: false,
    streamCacheLimit: 100,
    pubsubTopic: '/ceramic/inmemory/test', // necessary so Ceramic instances can talk to each other
    ...config,
  }
  const ceramic = await Ceramic.create(ipfs, appliedConfig)
  const seed = sha256.hash(uint8arrays.fromString(appliedConfig.seed || 'SEED'))
  const provider = new Ed25519Provider(seed)
  const keyDidResolver = KeyDidResolver.getResolver()
  const threeIdResolver = ThreeIdResolver.getResolver(ceramic)
  const resolver = new Resolver({
    ...threeIdResolver,
    ...keyDidResolver,
  })
  const did = new DID({ provider, resolver })
  await ceramic.setDID(did)
  await did.authenticate()

  return ceramic
}
