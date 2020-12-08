import type { ParsedDID, DIDResolver, DIDDocument } from 'did-resolver'
import { Doctype } from "@ceramicnetwork/common"
import LegacyResolver from './legacyResolver'
import * as u8a from 'uint8arrays'
import DocID from '@ceramicnetwork/docid'
import CID from 'cids'

interface Ceramic {
  loadDocument(docId: DocID): Promise<Doctype>;
  createDocument(type: string, content: any, opts: any): Promise<Doctype>;
}

interface ResolverRegistry {
  [index: string]: DIDResolver;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function wrapDocument(content: any, did: string): DIDDocument {
  if (!(content && content.publicKeys)) throw new Error('Not a valid 3ID')
  const startDoc: DIDDocument = {
    '@context': 'https://w3id.org/did/v1',
    id: did,
    publicKey: [],
    authentication: [],
    keyAgreement: []
  }
  const doc = Object.entries(content.publicKeys as string[]).reduce((diddoc, [keyName, keyValue]) => {
    const keyBuf = u8a.fromString(keyValue.slice(1), 'base58btc')
    // remove multicodec varint
    const publicKeyBase58 =  u8a.toString(keyBuf.slice(2), 'base58btc')
    if (keyBuf[0] === 0xe7) { // it's secp256k1
      diddoc.publicKey.push({
        id: `${did}#${keyName}`,
        type: 'Secp256k1VerificationKey2018',
        controller: did,
        publicKeyBase58
      })
      diddoc.authentication.push({
        type: 'Secp256k1SignatureAuthentication2018',
        publicKey: `${did}#${keyName}`,
      })
    } else if (keyBuf[0] === 0xec) { // it's x25519
      // old key format, likely not needed in the future
      diddoc.publicKey.push({
        id: `${did}#${keyName}`,
        type: 'Curve25519EncryptionPublicKey',
        controller: did,
        publicKeyBase58
      })
      // new keyAgreement format for x25519 keys
      diddoc.keyAgreement.push({
        id: `${did}#${keyName}`,
        type: 'X25519KeyAgreementKey2019',
        controller: did,
        publicKeyBase58
      })
    }
    return diddoc
  }, startDoc)

  return doc
}

const isLegacyDid = (didId: string): boolean => {
  try {
    new CID(didId)
    return true
  } catch(e) {
    return false
  }
}

/**
 * Gets the identifier of the version of the did document that was requested. This will correspond
 * to a specific 'commit' of the ceramic document
 * @param query
 */
const getVersion = (query = ''): string | null => {
  const versionParam = query.split('&').find(e => e.includes('version-id'))
  return versionParam ? versionParam.split('=')[1] : null
}

const legacyResolve = async (ceramic: Ceramic, didId: string, commit?: string): Promise<DIDDocument | null> => {
  const legacyPublicKeys = await LegacyResolver(didId) // can add opt to pass ceramic ipfs to resolve
  if (!legacyPublicKeys) return null

  const legacyDoc = wrapDocument(legacyPublicKeys, `did:3:${didId}`)
  if (commit === '0') return legacyDoc

  try {
    const docParams =  { deterministic: true, metadata: { controllers: [legacyPublicKeys.keyDid], family: '3id' } }
    const doc = await ceramic.createDocument('tile', docParams, { applyOnly: true })
    const didDoc = await resolve(ceramic, doc.id.toString(), commit, didId)
    return didDoc
  } catch(e) {
    if (commit) throw new Error('Not a valid 3ID')
    return legacyDoc
  }
}

const resolve = async (ceramic: Ceramic, didId: string, commit?: string, v03ID?: string): Promise<DIDDocument | null> =>  {
  const docId = DocID.fromString(didId, commit)
  const doctype = await ceramic.loadDocument(docId)
  return wrapDocument(doctype.content, `did:3:${v03ID || didId}`)
}

export default {
  getResolver: (ceramic: Ceramic): ResolverRegistry => {
    return {
      '3': async (did: string, parsed: ParsedDID): Promise<DIDDocument | null> => {
        const version = getVersion(parsed.query)
        return isLegacyDid(parsed.id) ? legacyResolve(ceramic, parsed.id, version) : resolve(ceramic, parsed.id, version)
      }
    }
  }
}
