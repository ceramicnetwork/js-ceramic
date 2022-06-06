import type {
  DIDResolutionResult,
  DIDResolutionOptions,
  DIDDocument,
  DIDDocumentMetadata,
  ParsedDID,
  Resolver,
  ResolverRegistry,
  VerificationMethod,
} from 'did-resolver'
import type { StreamState, MultiQuery, CeramicApi, LogEntry } from '@ceramicnetwork/common'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { LegacyResolver } from './legacyResolver.js'
import * as u8a from 'uint8arrays'
import { StreamID, CommitID } from '@ceramicnetwork/streamid'
import { CID } from 'multiformats/cid'
import { errorRepresentation, withResolutionError } from './error-representation.js'
import { CommitType } from '@ceramicnetwork/common'

const DID_LD_JSON = 'application/did+ld+json'
const DID_JSON = 'application/did+json'

const isLegacyDid = (didId: string): boolean => {
  try {
    CID.parse(didId)
    return true
  } catch (e) {
    return false
  }
}

/**
 * Converts unix timestamp to ISO string without ms.
 */
const formatTime = (timestamp: number): string => {
  return new Date(timestamp * 1000).toISOString().split('.')[0] + 'Z'
}

/**
 * Wraps the content from the Ceramic 3ID document tile and formats it
 * as a proper DIDDocument.
 *
 * @param content - the content from the 3ID Ceramic tile
 * @param did - the did to use when wrapping the document
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function wrapDocument(content: any, did: string): DIDDocument | null {
  if (!(content && content.publicKeys)) return null
  const startDoc: DIDDocument = {
    id: did,
    verificationMethod: [],
    authentication: [],
    keyAgreement: [],
  }
  return Object.entries(content.publicKeys as string[]).reduce((diddoc, [keyName, keyValue]) => {
    const keyBuf = u8a.fromString(keyValue.slice(1), 'base58btc')
    const entry: VerificationMethod = {
      id: `${did}#${keyName}`,
      type: '',
      controller: did,
      // remove multicodec varint
      publicKeyBase58: u8a.toString(keyBuf.slice(2), 'base58btc'),
      // We might want to use 'publicKeyMultibase' here if it
      // ends up in the did-core spec.
    }
    if (keyBuf[0] === 0xe7) {
      // it's secp256k1
      entry.type = 'EcdsaSecp256k1Signature2019'
      diddoc.verificationMethod.push(entry)
      diddoc.authentication.push(entry)
    } else if (keyBuf[0] === 0xec) {
      // it's x25519
      entry.type = 'X25519KeyAgreementKey2019'
      diddoc.verificationMethod.push(entry)
      diddoc.keyAgreement.push(entry)
    }
    return diddoc
  }, startDoc)
}

/**
 * Return last anchor log entry, or genesis if no anchors found
 */
function lastAnchorOrGenesisEntry(log: LogEntry[]): LogEntry {
  // Look for last anchor
  for (let index = log.length - 1; index >= 0; index--) {
    const entry = log[index]
    if (entry.type === CommitType.ANCHOR) {
      return entry
    }
  }
  // Genesis, if no anchor present
  return log[0]
}

/**
 * Extracts the DIDDocumentMetadata for the 3ID that we have resolved.
 * Requires the latest version of the 3ID ceramic document state as
 * well as the state of the version we are resolving
 *
 * @param requestedVersionState - the StreamState of the version of the 3ID we are resolving
 * @param latestVersionState - the StreamState of the latest version of the 3ID we are resolving
 */
function extractMetadata(
  requestedVersionState: StreamState,
  latestVersionState: StreamState
): DIDDocumentMetadata {
  const metadata: DIDDocumentMetadata = {}
  const { timestamp: updated, cid: versionId } = lastAnchorOrGenesisEntry(requestedVersionState.log)

  const { timestamp: nextUpdate, cid: nextVersionId } =
    latestVersionState.log.find(
      ({ timestamp }) => timestamp > updated || (!updated && timestamp)
    ) || {}

  if (updated) {
    metadata.updated = formatTime(updated)
  }
  if (nextUpdate) {
    metadata.nextUpdate = formatTime(nextUpdate)
  }
  if (versionId) {
    metadata.versionId = requestedVersionState.log.length === 1 ? '0' : versionId?.toString()
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
  const versionId = query
    .split('&')
    .find((e) => e.includes('versionId') || e.includes('version-id'))
  const versionTime = query.split('&').find((e) => e.includes('versionTime'))
  return {
    commit: versionId ? versionId.split('=')[1] : undefined,
    timestamp: versionTime
      ? Math.floor(new Date(versionTime.split('=')[1]).getTime() / 1000)
      : undefined,
  }
}

const legacyResolve = async (
  ceramic: CeramicApi,
  didId: string,
  verNfo: VersionInfo
): Promise<DIDResolutionResult> => {
  const legacyPublicKeys = await LegacyResolver(didId) // can add opt to pass ceramic ipfs to resolve

  // TODO - calculate streamid using a CID, annoyingly not working because of dependency issues.
  // This would remove one request to ceramic.
  //const genesisCommit = { header: { family: '3id', controllers: [legacyPublicKeys.keyDid] }, unique: '0' }
  //const streamid = new StreamID('tile', await dagCBOR.util.cid(new Uint8Array(dagCBOR.util.serialize(genesisCommit))))
  const metadata = { controllers: [legacyPublicKeys.keyDid], family: '3id', deterministic: true }
  const streamid = (
    await TileDocument.create(ceramic, null, metadata, { anchor: false, publish: false })
  ).id
  const didResult = await resolve(ceramic, streamid.toString(), verNfo, didId)
  if (didResult.didDocument === null) {
    didResult.didDocument = wrapDocument(legacyPublicKeys, `did:3:${didId}`)
  }
  return didResult
}

const resolve = async (
  ceramic: CeramicApi,
  didId: string,
  verNfo: VersionInfo,
  v03ID?: string
): Promise<DIDResolutionResult> => {
  const streamId = StreamID.fromString(didId)
  let commitId
  const query: Array<MultiQuery> = [{ streamId }]
  if (verNfo.commit) {
    commitId = CommitID.make(streamId, verNfo.commit)
    query.push({ streamId: commitId })
  } else if (verNfo.timestamp) {
    query.push({
      streamId,
      atTime: verNfo.timestamp,
    })
  }
  const resp = await ceramic.multiQuery(query)

  if (!resp[didId]) throw new Error(`Failed to properly resolve 3ID, stream ${didId} not found in response.`)
  const latestVersionState = resp[didId].state
  const commitIdStr = commitId?.toString() || Object.keys(resp).find((k) => k !== didId)
  const requestedVersionState = resp[commitIdStr]?.state || latestVersionState
  const metadata = extractMetadata(requestedVersionState, latestVersionState)

  const tile = resp[commitIdStr || didId] as TileDocument | undefined

  if (commitIdStr && !tile) {
    throw new Error(`No resolution for commit ${commitIdStr}`)
  }

  const content = tile.state.content
  const document = wrapDocument(content, `did:3:${v03ID || didId}`)

  return {
    didResolutionMetadata: { contentType: DID_JSON },
    didDocument: document,
    didDocumentMetadata: metadata,
  }
}

export function getResolver(ceramic: CeramicApi): ResolverRegistry {
  return {
    '3': (
      did: string,
      parsed: ParsedDID,
      resolver: Resolver,
      options: DIDResolutionOptions
    ): Promise<DIDResolutionResult> => {
      return withResolutionError(async () => {
        const contentType = options.accept || DID_JSON
        const verNfo = getVersionInfo(parsed.query)
        const id = parsed.id

        // application/did+json
        const didResult = () => {
          if (isLegacyDid(id)) {
            return legacyResolve(ceramic, id, verNfo)
          } else {
            return resolve(ceramic, id, verNfo)
          }
        }

        switch (contentType) {
          case DID_JSON:
            return didResult()
          case DID_LD_JSON: {
            const result = await didResult()
            result.didDocument['@context'] = 'https://www.w3.org/ns/did/v1'
            result.didResolutionMetadata.contentType = DID_LD_JSON
            return result
          }
          default:
            return errorRepresentation({ error: 'representationNotSupported' })
        }
      })
    },
  }
}
