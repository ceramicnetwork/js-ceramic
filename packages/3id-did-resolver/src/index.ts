import type {
  DIDResolver,
  DIDResolutionResult,
  DIDResolutionOptions,
  DIDDocument,
  ParsedDID,
  Resolver,
  ResolverRegistry,
  VerificationMethod
} from 'did-resolver'
import { Doctype } from "@ceramicnetwork/common"
import LegacyResolver from './legacyResolver'
import * as u8a from 'uint8arrays'
import { DocID, CommitID } from '@ceramicnetwork/docid'
import CID from 'cids'

interface Ceramic {
  loadDocument(docId: DocID | CommitID): Promise<Doctype>;
  createDocument(type: string, content: any, opts: any): Promise<Doctype>;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function wrapDocument(content: any, did: string): DIDDocument {
  if (!(content && content.publicKeys)) throw new Error('Not a valid 3ID')
  const startDoc: DIDDocument = {
    id: did,
    verificationMethod: [],
    authentication: [],
    keyAgreement: [],
    publicKey: []
  }
  return Object.entries(content.publicKeys as string[]).reduce((diddoc, [keyName, keyValue]) => {
    const keyBuf = u8a.fromString(keyValue.slice(1), 'base58btc')
    const entry: VerificationMethod = {
      id: `${did}#${keyName}`,
      type: '',
      controller: did,
      // remove multicodec varint
      publicKeyBase58: u8a.toString(keyBuf.slice(2), 'base58btc')
    }
    if (keyBuf[0] === 0xe7) { // it's secp256k1
      entry.type = 'EcdsaSecp256k1Signature2019'
      diddoc.verificationMethod.push(entry)
      diddoc.authentication.push(entry)
      diddoc.publicKey.push(entry)
    } else if (keyBuf[0] === 0xec) { // it's x25519
      entry.type = 'X25519KeyAgreementKey2019'
      diddoc.verificationMethod.push(entry)
      diddoc.keyAgreement.push(entry)
      diddoc.publicKey.push(entry)
    }
    return diddoc
  }, startDoc)
}

const DID_LD_JSON = 'application/did+ld+json'
const DID_JSON = 'application/did+json'

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
  // version-id was changed to versionId in the latest did-core spec
  // https://github.com/w3c/did-core/pull/553
  const versionParam = query.split('&').find(e => e.includes('versionId') || e.includes('version-id'))
  return versionParam ? versionParam.split('=')[1] : null
}

const legacyResolve = async (ceramic: Ceramic, didId: string, commit?: string): Promise<DIDDocument | null> => {
  const legacyPublicKeys = await LegacyResolver(didId) // can add opt to pass ceramic ipfs to resolve
  if (!legacyPublicKeys) return null

  const legacyDoc = wrapDocument(legacyPublicKeys, `did:3:${didId}`)
  if (commit === '0') return legacyDoc

  try {
    const docParams =  { deterministic: true, metadata: { controllers: [legacyPublicKeys.keyDid], family: '3id' } }
    const doc = await ceramic.createDocument('tile', docParams, { anchor: false, publish: false })
    const didDoc = await resolve(ceramic, doc.id.toString(), commit, didId)
    return didDoc
  } catch(e) {
    if (commit) throw new Error('Not a valid 3ID')
    return legacyDoc
  }
}

const resolve = async (ceramic: Ceramic, didId: string, commit?: string, v03ID?: string): Promise<DIDDocument | null> =>  {
  const commitId = DocID.fromString(didId).atCommit(commit)
  const doctype = await ceramic.loadDocument(commitId)
  return wrapDocument(doctype.content, `did:3:${v03ID || didId}`)
}

export default {
  getResolver: (ceramic: Ceramic): ResolverRegistry => ({
    '3': async (did: string, parsed: ParsedDID, resolver: Resolver, options: DIDResolutionOptions): Promise<DIDResolutionResult> => {
      const contentType = options.accept || DID_JSON
      const response: DIDResolutionResult = {
        didResolutionMetadata: { contentType },
        didDocument: null,
        didDocumentMetadata: {}
      }
      try {
        const version = getVersion(parsed.query)
        const doc = await (isLegacyDid(parsed.id) ? legacyResolve(ceramic, parsed.id, version) : resolve(ceramic, parsed.id, version))
        if (contentType === DID_LD_JSON) {
          doc['@context'] = 'https://w3id.org/did/v1',
          response.didDocument = doc
        } else if (contentType === DID_JSON) {
          response.didDocument = doc
        } else {
          delete response.didResolutionMetadata.contentType
          response.didResolutionMetadata.error = 'representationNotSupported'
        }
      } catch (e) {
        response.didResolutionMetadata.error = 'invalidDid'
        response.didResolutionMetadata.message = e.toString()
      }
      return response
    }
  })
}
