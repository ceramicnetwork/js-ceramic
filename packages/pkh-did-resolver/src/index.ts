import { AccountId, ChainIdParams } from 'caip'
import type {
  DIDResolutionResult,
  DIDResolutionOptions,
  ResolverRegistry,
  ParsedDID,
  Resolver,
} from 'did-resolver'

const DID_LD_JSON = 'application/did+ld+json'
const DID_JSON = 'application/did+json'
const SUPPORTED_NAMESPACES = ['eip155', 'bip122']

function toDidDoc (did: string, accountId: string): any {
  const { namespace } = AccountId.parse(accountId).chainId as ChainIdParams
  if (!SUPPORTED_NAMESPACES.includes(namespace)) {
    throw new Error(`chain namespace not supported ${namespace}`)
  }
  const vmId = did + '#blockchainAccountId'
  return {
    '@context': [
      "https://www.w3.org/ns/did/v1",
      {
        "blockchainAccountId": "https://w3id.org/security#blockchainAccountId",
        "EcdsaSecp256k1RecoveryMethod2020": "https://identity.foundation/EcdsaSecp256k1RecoverySignature2020#EcdsaSecp256k1RecoveryMethod2020"
      }
    ],
    id: did,
    verificationMethod: [{
      id: vmId,
      type: 'EcdsaSecp256k1RecoveryMethod2020',
      controller: did,
      blockchainAccountId: accountId
    }],
    authentication: [ vmId ],
    assertionMethod: [ vmId ]
  }
}

export default {
  getResolver: (): ResolverRegistry => ({
    pkh: async (
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
        const doc = toDidDoc(did, parsed.id)
        if (contentType === DID_LD_JSON) {
          response.didDocument = doc
        } else if (contentType === DID_JSON) {
          delete doc['@context']
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
  }),
}
