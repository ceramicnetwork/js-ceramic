import { CeramicApi } from '@ceramicnetwork/common'
import * as uint8arrays from 'uint8arrays'
import * as sha256 from '@stablelib/sha256'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import * as ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'
import * as KeyDidResolver from 'key-did-resolver'
import * as PkhDidResolver from 'pkh-did-resolver'
import { Resolver } from 'did-resolver'
import { DID } from 'dids'

export function createDid(ceramic: CeramicApi, seed = 'SEED'): DID {
  const seedHash = sha256.hash(uint8arrays.fromString(seed))
  const provider = new Ed25519Provider(seedHash)
  const keyDidResolver = KeyDidResolver.getResolver()
  const pkhDidResolver = PkhDidResolver.getResolver()
  const threeIdResolver = ThreeIdResolver.getResolver(ceramic)
  const resolver = new Resolver({
    ...threeIdResolver,
    ...pkhDidResolver,
    ...keyDidResolver,
  })
  return new DID({ provider, resolver })
}
