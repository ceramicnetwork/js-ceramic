import * as u8a from 'uint8arrays'
import { LRUCache } from 'least-recent'

interface DAG {
  get(cid: string): any
}

interface IPFS {
  dag: DAG
}

// Legacy 3ids available from 3box, other v1 will always be resolved through ipfs and other services
const THREEBOX_API_URL = 'https://ipfs.3box.io'
const LIMIT = 100
const fetchCache = new LRUCache<string, any>(LIMIT)

const fetchJson = async (url: string): Promise<any> => {
  const cached = fetchCache.get(url)
  if (cached) return cached
  const r = await fetch(url)
  if (r.ok) {
    const json = await r.json()
    fetchCache.set(url, json)
    return json
  } else {
    throw new Error('Not a valid 3ID')
  }
}

const didDocReq = (cid: string): string =>
  `${THREEBOX_API_URL}/did-doc?cid=${encodeURIComponent(cid)}`

// Mocks ipfs obj for 3id resolve, to resolve through api, until ipfs instance is available
const ipfsMock: IPFS = {
  dag: {
    get: async (cid) => fetchJson(didDocReq(cid)),
  },
}

// TODO, from idw, key utils in future
const encodeKey = (key: Uint8Array, encryption?: boolean): string => {
  const bytes = new Uint8Array(key.length + 2)
  if (encryption) {
    bytes[0] = 0xec // x25519 multicodec
  } else {
    bytes[0] = 0xe7 // secp256k1 multicodec
  }
  bytes[1] = 0x01 // multicodec varint
  bytes.set(key, 2)
  return `z${u8a.toString(bytes, 'base58btc')}`
}

// Consumes uncompressed hex key string, and returns compressed hex key string
const compressKey = (key: string) => {
  // reference: https://github.com/indutny/elliptic/blob/e71b2d9359c5fe9437fbf46f1f05096de447de57/lib/elliptic/curve/base.js#L298
  // drop 1 byte prefix, point x & y 32 bytes each, hex encoded
  const xpoint = key.slice(2, 66)
  const ypoint = key.slice(66, 130)
  // if even
  //@ts-expect-error arithmetic op hex string
  const prefix = (ypoint & 1) === 0 ? '02' : '03'
  return `${prefix}${xpoint}`
}

export type LegacyResolverResult = {
  publicKeys: Record<string, string>
  keyDid: string
}

type LegacySigningKey = { id: string; publicKeyHex: string }
type LegacyEncryptionKey = { id: string; publicKeyBase64: string }
type LegacyPublicKeyEntry = LegacySigningKey | LegacyEncryptionKey

class NotValid3IdError extends Error {
  constructor() {
    super(`Not a valid 3ID`)
  }
}

// Returns v0 3id public keys in ceramic 3id doc form
export async function LegacyResolver(
  didId: string,
  ipfs = ipfsMock
): Promise<LegacyResolverResult> {
  const doc = (await ipfs.dag.get(didId)).value
  if (!Array.isArray(doc.publicKey)) {
    throw new NotValid3IdError()
  }

  const signingKey = doc.publicKey.find((e: LegacyPublicKeyEntry) =>
    e.id.endsWith('signingKey')
  )?.publicKeyHex
  const encryptionKey = doc.publicKey.find((e: LegacyPublicKeyEntry) =>
    e.id.endsWith('encryptionKey')
  )?.publicKeyBase64

  if (!signingKey || !encryptionKey) {
    throw new NotValid3IdError()
  }

  const signingKeyCompressed = compressKey(signingKey)
  const signing = encodeKey(u8a.fromString(signingKeyCompressed, 'base16'))
  const encryption = encodeKey(u8a.fromString(encryptionKey, 'base64pad'), true)

  return {
    keyDid: `did:key:${signing}`,
    publicKeys: {
      [signing.slice(-15)]: signing,
      [encryption.slice(-15)]: encryption,
    },
  }
}
