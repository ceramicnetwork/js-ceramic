import { CeramicApi } from '@ceramicnetwork/common'
import { DID } from 'dids'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'
import KeyDidResolver from 'key-did-resolver'
import { Resolver } from 'did-resolver'
import * as sha256 from '@stablelib/sha256'
import * as uint8arrays from 'uint8arrays'
import * as random from '@stablelib/random'

export function makeDID(ceramic: CeramicApi, seed?: string): DID {
  const effectiveSeed = seed || random.randomString(32)
  const digest = sha256.hash(uint8arrays.fromString(effectiveSeed))
  const provider = new Ed25519Provider(digest)

  const keyDidResolver = KeyDidResolver.getResolver()
  const threeIdResolver = ThreeIdResolver.getResolver(ceramic)
  const resolver = new Resolver({
    ...threeIdResolver,
    ...keyDidResolver,
  })
  return new DID({ provider, resolver })
}
