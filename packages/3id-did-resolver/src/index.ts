import type {
  DIDResolver,
  DIDResolutionResult,
  DIDResolutionOptions,
  DIDDocument,
  DIDDocumentMetadata,
  ParsedDID,
  Resolver,
  ResolverRegistry,
  VerificationMethod
} from 'did-resolver'
import type { DocState, MultiQuery, CeramicApi } from "@ceramicnetwork/common"
import LegacyResolver from './legacyResolver'
import * as u8a from 'uint8arrays'
import { DocID, CommitID } from '@ceramicnetwork/docid'
import CID from 'cids'
//import dagCBOR from 'ipld-dag-cbor'

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

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function wrapDocument(content: any, did: string): DIDDocument | null {
  if (!(content && content.publicKeys)) return null
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

function extractMetadata(resolvedState: DocState, fullState: DocState): DIDDocumentMetadata {
  const metadata: DIDDocumentMetadata = {}
  let { timestamp: updated, cid: versionId } = resolvedState.log.pop() || {}

  const {
    timestamp: nextUpdate,
    cid: nextVersionId
  } = fullState.log.find(({ timestamp }) => timestamp > updated || (!updated && timestamp)) || {}
  const created = fullState.log.find(({ timestamp }) => Boolean(timestamp))?.timestamp

  if (created) {
    metadata.created = (new Date(created * 1000)).toISOString()
  }
  if (updated) {
    metadata.updated = (new Date(updated * 1000)).toISOString()
  }
  if (nextUpdate) {
    metadata.nextUpdate = (new Date(nextUpdate * 1000)).toISOString()
  }
  if (versionId) {
    metadata.versionId = resolvedState.log.length === 0 ? '0' : versionId?.toString()
  }
  if (nextVersionId) {
    metadata.nextVersionId = nextVersionId.toString()
  }
  return metadata
}

interface VersionInfo {
  commit?: string
  timestamp?: number
}
/**
 * Gets the identifier of the version of the did document that was requested. This will correspond
 * to a specific 'commit' of the ceramic document
 * @param query
 */
function getVersionInfo(query = ''): VersionInfo {
  // version-id was changed to versionId in the latest did-core spec
  // https://github.com/w3c/did-core/pull/553
  const versionId = query.split('&').find(e => e.includes('versionId') || e.includes('version-id'))
  const versionTime = query.split('&').find(e => e.includes('versionTime'))
  return {
    commit: versionId ? versionId.split('=')[1] : undefined,
    timestamp: versionTime ? Math.floor((new Date(versionTime.split('=')[1])).getTime() / 1000) : undefined
  }
}

const legacyResolve = async (ceramic: CeramicApi, didId: string, verNfo: VersionInfo): Promise<DIDResolutionResult> => {
  const legacyPublicKeys = await LegacyResolver(didId) // can add opt to pass ceramic ipfs to resolve

  // TODO - calculate docid using a CID, annoyingly not working because of dependency issues.
  // This would remove one request to ceramic.
  //const genesisCommit = { header: { family: '3id', controllers: [legacyPublicKeys.keyDid] }, unique: '0' }
  //const docid = new DocID('tile', await dagCBOR.util.cid(new Uint8Array(dagCBOR.util.serialize(genesisCommit))))
  const docParams =  { deterministic: true, metadata: { controllers: [legacyPublicKeys.keyDid], family: '3id' } }
  const docid = (await ceramic.createDocument('tile', docParams, { anchor: false, publish: false })).id
  const didResult = await resolve(ceramic, docid.toString(), verNfo, didId)
  if (didResult.didDocument === null) {
    didResult.didDocument = wrapDocument(legacyPublicKeys, `did:3:${didId}`)
  }
  return didResult
}

const resolve = async (ceramic: CeramicApi, didId: string, verNfo: VersionInfo, v03ID?: string): Promise<DIDResolutionResult> =>  {
  const docId = DocID.fromString(didId)
  let commitId
  const query: Array<MultiQuery> = [{ docId }]
  if (verNfo.commit) {
    commitId = docId.atCommit(verNfo.commit)
    query.push({ docId: commitId })
  } else if (verNfo.timestamp) {
    query.push({
      docId,
      atTime: verNfo.timestamp
    })
  }
  const resp = await ceramic.multiQuery(query)

  const fullState = resp[didId].state
  const commitIdStr = commitId?.toString() || Object.keys(resp).find(k => k !== didId)
  const resolvedState = resp[commitIdStr]?.state || fullState
  const metadata = extractMetadata(resolvedState, fullState)

  const content = resp[commitIdStr || didId].content
  const document = wrapDocument(content, `did:3:${v03ID || didId}`)

  return {
    didResolutionMetadata: { contentType: DID_JSON },
    didDocument: document,
    didDocumentMetadata: metadata
  }
}

export default {
  getResolver: (ceramic: CeramicApi): ResolverRegistry => ({
    '3': async (did: string, parsed: ParsedDID, resolver: Resolver, options: DIDResolutionOptions): Promise<DIDResolutionResult> => {
      const contentType = options.accept || DID_JSON
      try {
        const verNfo = getVersionInfo(parsed.query)
        const didResult = await (isLegacyDid(parsed.id) ? legacyResolve(ceramic, parsed.id, verNfo) : resolve(ceramic, parsed.id, verNfo))

        if (contentType === DID_LD_JSON) {
          didResult.didDocument['@context'] = 'https://w3id.org/did/v1'
          didResult.didResolutionMetadata.contentType = DID_LD_JSON
        } else if (contentType !== DID_JSON) {
          didResult.didDocument = null
          didResult.didDocumentMetadata = {}
          delete didResult.didResolutionMetadata.contentType
          didResult.didResolutionMetadata.error = 'representationNotSupported'
        }
        return didResult
      } catch (e) {
        return {
          didResolutionMetadata: {
            error: 'invalidDid',
            message: e.toString()
          },
          didDocument: null,
          didDocumentMetadata: {}
        }
      }
    }
  })
}
