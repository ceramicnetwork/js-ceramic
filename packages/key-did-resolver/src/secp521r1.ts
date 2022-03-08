// Brent Shambaugh <brent.shambaugh@gmail.com>. 2021.

import * as u8a from 'uint8arrays'
import * as bigintModArith from './bigint-mod-arith.js'
import * as nist_weierstrass_common from './nist_weierstrass_common.js'

/**
  * x,y point as a BigInt (requires at least ES2020)
  * For BigInt see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt
  */
interface BigIntPoint {
   x: BigInt,
   y : BigInt
}

/**
  * xm,ym point with components expresse with base64url utilizing multiformats
  *
  * base64url is expressed in the Multibase Table: https://github.com/multiformats/multibase/blob/master/multibase.csv
  */
interface base64urlPoint {
   xm: string,
   ym: string
}

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
 * Decompress a compressed public key in SEC format.
 * See section 2.3.3 in SEC 1 v2 : https://www.secg.org/sec1-v2.pdf.
 *
 * Code based on: https://stackoverflow.com/questions/17171542/algorithm-for-elliptic-curve-point-compression/30431547#30431547
 * b on page 15 of https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-186-draft.pdf
 * @param - 67 byte compressed public key. 1st byte: 0x02 for even or 0x03 for odd. Following 32 bytes: x coordinate expressed as big-endian.
 * @throws TypeError: input cannot be null or undefined.
 */
 export function ECPointDecompress( comp : Uint8Array ) : BigIntPoint {
  if(!nist_weierstrass_common.testUint8Array(comp)) {
    throw new TypeError('input must be a Uint8Array');
   }
  // two, prime, b, and pIdent are constants for the P-521 curve
  const two = BigInt(2);
  const prime = (two ** 521n) - 1n;
  const b = 1093849038073734274511112390766805569936207598951683748994586394495953116150735016013708737573759623248592132296706313309438452531591012912142327488478985984n;
  const pIdent = (prime + 1n) / 4n;

  const signY = BigInt(comp[0] - 2);
  const x = comp.subarray(1);
  const xBig = BigInt(u8a.toString(x,'base10'));

  const a = xBig**3n - xBig*3n + b;
  let yBig = bigintModArith.modPow(a,pIdent,prime);

  // "// If the parity doesn't match it's the *other* root"
  if( yBig % 2n !== signY)
    {
         // y = prime - y
         yBig = prime - yBig;
    }

    return {
      x: xBig,
      y: yBig
    };

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
  if(!nist_weierstrass_common.testUint8Array(pubKeyBytes)) {
    throw new TypeError('input must be a Uint8Array');
  }
  const publicKeyHex = nist_weierstrass_common.pubKeyBytesToHex(pubKeyBytes);

  // compressed p-521 key, SEC format
  // publicKeyHex.length / 2.0 = 67.0 bytes
 if((132 <= publicKeyHex.length) && (publicKeyHex.length <= 134)) {
  if(publicKeyHex.slice(0,2) == '03' || publicKeyHex.slice(0,2) == '02') {
     const publicKey = u8a.fromString(publicKeyHex,'base16')
     const point = ECPointDecompress(publicKey);
      return nist_weierstrass_common.publicKeyIntToXY(point);
    }
 }

    throw new Error('Unexpected pubKeyBytes');
}
