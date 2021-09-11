import varint from 'varint'
import multibase from 'multibase'
import type {
  DIDResolutionResult,
  DIDResolutionOptions,
  ResolverRegistry,
  ParsedDID,
  Resolver,
} from 'did-resolver'

import * as secp256k1 from './secp256k1'
import * as ed25519 from './ed25519'

const DID_LD_JSON = 'application/did+ld+json'
const DID_JSON = 'application/did+json'
// supported drivers
const prefixToDriverMap: any = {
  0xe7: secp256k1,
  0xed: ed25519,
}

export function getResolver(): ResolverRegistry {
  return {
    key: async (
      did: string,
      parsed: ParsedDID,
      r: Resolver,
      options: DIDResolutionOptions
    ): Promise<DIDResolutionResult> => {
      const contentType = options.accept || DID_JSON
      const response: DIDResolutionResult = {
        didResolutionMetadata: { contentType },
        didDocument: null,
        didDocumentMetadata: {},
      }
      try {
        const multicodecPubKey: any = multibase.decode(parsed.id)
        const keyType = varint.decode(multicodecPubKey)
        const pubKeyBytes = multicodecPubKey.slice(varint.decode.bytes)
        const doc = await prefixToDriverMap[keyType].keyToDidDoc(pubKeyBytes, parsed.id)
        if (contentType === DID_LD_JSON) {
          doc['@context'] = 'https://w3id.org/did/v1'
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
    },
  }
}

export default { getResolver }
