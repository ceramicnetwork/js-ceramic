import { Doctype } from '@ceramicnetwork/ceramic-common'
import type { ParsedDID, DIDResolver, DIDDocument, Resolver } from 'did-resolver'

interface Ceramic {
  loadDocument(docId: string): Promise<Doctype>;
}

export interface ThreeIDDocument extends DIDDocument {
  idx?: string;
}

export type ThreeIDResolver = (
  did: string,
  parsed: ParsedDID,
  resolver: Resolver
) => Promise<null | ThreeIDDocument>

export interface ResolverRegistry {
  '3': ThreeIDResolver;
  [index: string]: DIDResolver;
}

export function wrapDocument(content: any, did: string): ThreeIDDocument {
  // this should be generated in a much more dynamic way based on the content of the doc
  // keys should be encoded using multicodec, by looking at the codec bits
  // we can determine the key type.
  return {
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
    idx: content.idx
  }
}

export function getResolver(ceramic: Ceramic): ResolverRegistry {
  return {
    '3': async (did: string, parsed: ParsedDID): Promise<ThreeIDDocument | null> => {
      const doctype = await ceramic.loadDocument(`/ceramic/${parsed.id}`)
      return wrapDocument(doctype.content, did)
    },
  }
}
