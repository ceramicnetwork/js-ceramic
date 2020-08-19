import { Doctype } from '@ceramicnetwork/ceramic-common'
import type { ParsedDID, DIDResolver, DIDDocument } from 'did-resolver'

interface Ceramic {
  loadDocument(docId: string): Promise<Doctype>
}

export type ResolverRegistry = Record<string, DIDResolver>

export function wrapDocument(content: any, did: string): DIDDocument {
  // this should be generated in a much more dynamic way based on the content of the doc
  // keys should be encoded using multicodec, by looking at the codec bits
  // we can determine the key type.
  const doc: DIDDocument = {
    '@context': 'https://w3id.org/did/v1',
    id: did,
    publicKey: [
      {
        id: `${did}#signingKey`,
        type: 'Secp256k1VerificationKey2018',
        controller: did,
        publicKeyHex: content.publicKeys.signing,
      },
      {
        id: `${did}#encryptionKey`,
        type: 'Curve25519EncryptionPublicKey',
        controller: did,
        publicKeyBase64: content.publicKeys.encryption,
      },
    ],
    authentication: [
      {
        type: 'Secp256k1SignatureAuthentication2018',
        publicKey: `${did}#signingKey`,
      },
    ],
  }

  if (content.idx != null) {
    doc.service = [
      {
        id: `${did}#idx`,
        type: 'IdentityIndexRoot',
        serviceEndpoint: content.idx,
      },
    ]
  }

  return doc
}

export function getResolver(ceramic: Ceramic): ResolverRegistry {
  return {
    '3': async (did: string, parsed: ParsedDID): Promise<DIDDocument> => {
      const doctype = await ceramic.loadDocument(`/ceramic/${parsed.id}`)
      return wrapDocument(doctype.content, did)
    },
  }
}
