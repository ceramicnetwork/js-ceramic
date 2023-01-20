import { Ed25519Provider } from 'key-did-provider-ed25519'
import * as u8a from 'uint8arrays'
import { DID } from 'dids'
import * as KeyDidResolver from 'key-did-resolver'
import { Resolver } from 'did-resolver'
import { randomBytes } from '@stablelib/random'

export function makeNodeDID(seed: Uint8Array): DID {
  const provider = makeNodeDIDProvider(seed)
  const keyDidResolver = KeyDidResolver.getResolver()
  const resolver = new Resolver({ ...keyDidResolver })
  return new DID({ provider, resolver })
}

export function makeNodeDIDProvider(seed: Uint8Array): Ed25519Provider {
  return new Ed25519Provider(seed)
}

export function generateSeed(): string {
  return u8a.toString(randomBytes(32), 'base16')
}

export function generateSeedUrl(): URL {
  const seed = generateSeed()
  const url = `inplace:ed25519#${seed}`
  return new URL(url)
}

/**
 * Parses seed url
 *
 * Examples:
 *   When the seed is in the url itself it must be formatted as `inplace:<scheme>#<seed>`.
 *   A URL should look like `new URL('inplace:ed25519#abc123')`
 *
 * @param seedUrl Url for seed
 * @returns base16 uint8 array
 */
export function parseSeedUrl(seedUrl: URL): Uint8Array {
  let seed: string
  if (seedUrl.protocol == 'inplace:') {
    seed = seedUrl.hash.slice(1)
  }
  return parseSeed(seed)
}

export function parseSeed(seed: string) {
  return u8a.fromString(seed, 'base16')
}
