// TODO - the 3id-did-resolver should be it's own package
import Ceramic from './ceramic'
import { ParsedDID, DIDResolver, DIDDocument } from 'did-resolver'

interface ResolverRegistry {
  [index: string]: DIDResolver
}

export default {
  getResolver: (ceramic: Ceramic): ResolverRegistry => ({
    '3': async (did: string, parsed: ParsedDID): Promise<DIDDocument | null> => {
      const doc = await ceramic.loadDocument(`/ceramic/${parsed.id}`)
      const content = doc.content
      // this should be generated in a much more dynamic way based on the content of the doc
      // keys should be encoded using multicodec, by looking at the codec bits
      // we can determine the key type.
      return {
        '@context': 'https://w3id.org/did/v1',
        id: did,
        publicKey: [{
          id: `${did}#signingKey`,
          type: 'Secp256k1VerificationKey2018',
          owner: did,
          publicKeyHex: content.publicKeys.signing
        }, {
          id: `${did}#encryptionKey`,
          type: 'Curve25519EncryptionPublicKey',
          owner: did,
          publicKeyBase64: content.publicKeys.encryption
        }],
        authentication: [{
          type: 'Secp256k1SignatureAuthentication2018',
          publicKey: `${did}#signingKey`,
        }]
      }
    }
  })
}
