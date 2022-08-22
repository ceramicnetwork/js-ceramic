// Brent Shambaugh <brent.shambaugh@gmail.com>. 2021.

import * as u8a from 'uint8arrays'

import * as nist_weierstrauss from 'nist-weierstrauss'
import {base64urlPoint} from 'nist-weierstrauss'

/**
 * Constructs the document based on the method key
 */
export function keyToDidDoc (pubKeyBytes: Uint8Array, fingerprint: string): any {
  const did = `did:key:${fingerprint}`
  const keyId = `${did}#${fingerprint}`
  const key = pubKeyBytesToXY(pubKeyBytes);
  return {
    id: did,
    verificationMethod: [{
      id: keyId,
      type: 'JsonWebKey2020',
      controller: did,
       publicKeyJwk: {
         kty: "EC",
               crv: "P-521",
               x: key.xm,
               y: key.ym,
       },
    }],
    authentication: [keyId],
    assertionMethod: [keyId],
    capabilityDelegation: [keyId],
    capabilityInvocation: [keyId],
  }
  }

/**
 *
 * @param pubKeyBytes - public key as compressed with 0x02 prefix if even and 0x03 prefix if odd.
 * @returns point x,y with coordinates as multibase encoded base64urls
 *
 * See the the did:key specification: https://w3c-ccg.github.io/did-method-key/#p-521.
 * For compression see: https://tools.ietf.org/id/draft-jivsov-ecc-compact-05.html#rfc.section.3
 * @throws TypeError: input cannot be null or undefined.
 * @throws Error: Unexpected pubKeyBytes
 * @internal
 */
export function pubKeyBytesToXY(pubKeyBytes: Uint8Array) : base64urlPoint  {
  if(!nist_weierstrauss.nist_weierstrauss_common.testUint8Array(pubKeyBytes)) {
    throw new TypeError('input must be a Uint8Array');
  }
  const publicKeyHex = nist_weierstrauss.nist_weierstrauss_common.pubKeyBytesToHex(pubKeyBytes);

  // compressed p-521 key, SEC format
  // publicKeyHex.length / 2.0 = 67.0 bytes
 if((132 <= publicKeyHex.length) && (publicKeyHex.length <= 134)) {
  if(publicKeyHex.slice(0,2) == '03' || publicKeyHex.slice(0,2) == '02') {
     const publicKey = u8a.fromString(publicKeyHex,'base16')
     const point = nist_weierstrauss.secp521r1.ECPointDecompress(publicKey);
      return nist_weierstrauss.nist_weierstrauss_common.publicKeyIntToXY(point);
    }
 }

    throw new Error('Unexpected pubKeyBytes');
}
