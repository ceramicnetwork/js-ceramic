import { toString } from 'uint8arrays/to-string'
import { convertPublicKeyToX25519 } from '@stablelib/ed25519'

function encodeKey(key: Uint8Array): string {
  const bytes = new Uint8Array(key.length + 2)
  bytes[0] = 0xec
  // The multicodec is encoded as a varint so we need to add this.
  // See js-multicodec for a general implementation
  bytes[1] = 0x01
  bytes.set(key, 2)
  return `z${toString(bytes, 'base58btc')}`
}

/**
 * Constructs the document based on the method key
 */
export function keyToDidDoc(pubKeyBytes: Uint8Array, fingerprint: string): any {
  const did = `did:key:${fingerprint}`
  const keyId = `${did}#${fingerprint}`
  const x25519PubBytes = convertPublicKeyToX25519(pubKeyBytes)
  const x25519KeyId = `${did}#${encodeKey(x25519PubBytes)}`
  return {
    id: did,
    verificationMethod: [
      {
        id: keyId,
        type: 'Ed25519VerificationKey2018',
        controller: did,
        publicKeyBase58: toString(pubKeyBytes, 'base58btc'),
      },
    ],
    authentication: [keyId],
    assertionMethod: [keyId],
    capabilityDelegation: [keyId],
    capabilityInvocation: [keyId],
    keyAgreement: [
      {
        id: x25519KeyId,
        type: 'X25519KeyAgreementKey2019',
        controller: did,
        publicKeyBase58: toString(x25519PubBytes, 'base58btc'),
      },
    ],
  }
}
