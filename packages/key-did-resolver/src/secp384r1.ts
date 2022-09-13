// Brent Shambaugh <brent.shambaugh@gmail.com>. 2021.

import * as u8a from 'uint8arrays'

import * as nist_weierstrauss from 'nist-weierstrauss'
import {base64urlPoint} from 'nist-weierstrauss'

/**
 * Constructs the document based on the method key
 */
export function keyToDidDoc(pubKeyBytes: Uint8Array, fingerprint: string): any {
  const did = `did:key:${fingerprint}`
  const keyId = `${did}#${fingerprint}`
  const key = pubKeyBytesToXY(pubKeyBytes)
  return {
    id: did,
    verificationMethod: [
      {
        id: keyId,
        type: 'JsonWebKey2020',
        controller: did,
        publicKeyJwk: {
          kty: 'EC',
          crv: 'P-384',
          x: key.xm,
          y: key.ym,
        },
      },
    ],
    authentication: [keyId],
    assertionMethod: [keyId],
    capabilityDelegation: [keyId],
    capabilityInvocation: [keyId],
  }
}

/**
 *
 * @param pubKeyBytes - public key as uncompressed byte array with no prefix (raw key),
 *  uncompressed with 0x04 prefix, or compressed with 0x02 prefix if even and 0x03 prefix if odd.
 * @returns point x,y with coordinates as multibase encoded base64urls
 *
 * See the the did:key specification: https://w3c-ccg.github.io/did-method-key/#p-384.
 * At present only raw p-384 keys are covered in the specification.
 * @throws TypeError: input cannot be null or undefined.
 * @throws Error: Unexpected pubKeyBytes
 * @internal
 */
export function pubKeyBytesToXY(pubKeyBytes: Uint8Array) : base64urlPoint  {
  if(!nist_weierstrauss.nist_weierstrauss_common.testUint8Array(pubKeyBytes)) {
    throw new TypeError('input must be a Uint8Array');
  }
  const publicKeyHex = nist_weierstrauss.nist_weierstrauss_common.pubKeyBytesToHex(pubKeyBytes);
  const bytesCount = publicKeyHex.length / 2;

  // raw p-384 key
  if(bytesCount == 96) {
     return nist_weierstrauss.nist_weierstrauss_common.publicKeyToXY(publicKeyHex);
   }

  // uncompressed p-384 key, SEC format
  if(bytesCount == 97) {
   if(publicKeyHex.slice(0,2) == '04') {
     const publicKey = publicKeyHex.slice(2);
     return nist_weierstrauss.nist_weierstrauss_common.publicKeyToXY(publicKey);
   }
  }

  // compressed p-384 key, SEC format
  if(bytesCount == 49) {
   if(publicKeyHex.slice(0,2) == '03' || publicKeyHex.slice(0,2) == '02') {
     const publicKey = u8a.fromString(publicKeyHex,'base16')
     const point = nist_weierstrauss.secp384r1.ECPointDecompress(publicKey);
      return nist_weierstrauss.nist_weierstrauss_common.publicKeyIntToXY(point);
    }
  }

  throw new Error('Unexpected pubKeyBytes')
}
