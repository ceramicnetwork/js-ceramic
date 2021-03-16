import fetch from 'cross-fetch'
import * as u8a from 'uint8arrays'
import { LRUMap } from 'lru_map'

interface DAG {
  get(cid: string): any;
}

interface IPFS {
  dag: DAG;
}

// Legacy 3ids available from 3box, other v1 will always be resolved through ipfs and other services
const THREEBOX_API_URL = 'https://ipfs.3box.io'
const LIMIT = 100
const fetchCache = new LRUMap<string, any>(LIMIT)

const fetchJson = async (url: string): Promise<any> =>  {
  //return {
    //"value": {"id":"did:3:GENESIS","@context":"https://w3id.org/did/v1","publicKey":[{"id":"did:3:GENESIS#signingKey","type":"Secp256k1VerificationKey2018","publicKeyHex":"04de2478508c4396147e884d77013009cc3124139cae3634be7ffc221e9d0092a1b33e38fcdeb6354ad3b1cd1c6ffc4d69d409a21e7aa4e8b8bd998390758e20e0"},{"id":"did:3:GENESIS#encryptionKey","type":"Curve25519EncryptionPublicKey","publicKeyBase64":"5HH9HIKBrQ7iERd4AfH+il3v+GkestWehJV6SdzHNnA="},{"id":"did:3:GENESIS#managementKey","type":"Secp256k1VerificationKey2018","ethereumAddress":"0x3f0bb6247d647a30f310025662b29e6fa382b61d"}],"authentication":[{"type":"Secp256k1SignatureAuthentication2018","publicKey":"did:3:GENESIS#signingKey"}]}
  //}
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

const didDocReq = (cid: string): string => `${THREEBOX_API_URL}/did-doc?cid=${encodeURIComponent(cid)}`

// Mocks ipfs obj for 3id resolve, to resolve through api, until ipfs instance is available
const ipfsMock: IPFS = {
  dag: {
    get: async cid => fetchJson(didDocReq(cid))
  }
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


// Returns v0 3id public keys in ceramic 3id doc form
const LegacyResolver = async (didId: string, ipfs = ipfsMock): Promise<any> => {
  const doc = (await ipfs.dag.get(didId)).value
  let signingKey, encryptionKey

  try {
    const keyEntrySigning = doc.publicKey.findIndex(e => e.id.endsWith('signingKey'))
    const keyEntryEncryption = doc.publicKey.findIndex(e => e.id.endsWith('encryptionKey'))
    signingKey = doc.publicKey[keyEntrySigning].publicKeyHex
    encryptionKey = doc.publicKey[keyEntryEncryption].publicKeyBase64
  } catch (e) {
    throw new Error('Not a valid 3ID')
  }

  const signingKeyCompressed = compressKey(signingKey)
  const signing = encodeKey(u8a.fromString(signingKeyCompressed, 'base16'))
  const encryption = encodeKey(u8a.fromString(encryptionKey, 'base64pad'), true)

  return {
    keyDid: `did:key:${signing}`,
    publicKeys: {
      [signing.slice(-15)]: signing,
      [encryption.slice(-15)]: encryption,
    }
  }
}

export default LegacyResolver
