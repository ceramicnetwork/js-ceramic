// Brent Shambaugh <brent.shambaugh@gmail.com>. 2021.

import * as u8a from 'uint8arrays'
import  multibase from'multibase'
import * as bigintModArith from 'bigint-mod-arith'

import * as nist_p_common from './nist_p_common'

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
  * Elliptic curve point with coordinates expressed as byte arrays (Uint8Array)
  */
interface octetPoint {
  xOctet: Uint8Array,
  yOctet: Uint8Array
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
               crv: "P-384",
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
 *
 * @param - 49 byte compressed public key. 1st byte: 0x02 for even or 0x03 for odd. Following 32 bytes: x coordinate expressed as big-endian.
 * @throws TypeError: input cannot be null or undefined.
 */
 export function ECPointDecompress( comp : Uint8Array ) : BigIntPoint {
  if(!nist_p_common.testUint8Array(comp)) {
    throw new TypeError('input must be a Uint8Array');
   }
  // two, prime, b, and pIdent are constants for the P-256 curve
  const two = BigInt(2);
  const prime = (two ** 384n) - (two ** 128n) - (two ** 96n) + (two ** 32n ) - 1n;
  const b = 27580193559959705877849011840389048093056905856361568521428707301988689241309860865136260764883745107765439761230575n;
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
  if(!nist_p_common.testUint8Array(pubKeyBytes)) {
    throw new TypeError('input must be a Uint8Array');
  }
  const publicKeyHex = nist_p_common.pubKeyBytesToHex(pubKeyBytes);
  const bytesCount = publicKeyHex.length / 2;

  // raw p-384 key
  if(bytesCount == 96) {
     return nist_p_common.publicKeyToXY(publicKeyHex); 
   }

  // uncompressed p-384 key, SEC format
  if(bytesCount == 97) {
   if(publicKeyHex.slice(0,2) == '04') {
     const publicKey = publicKeyHex.slice(2);
     return nist_p_common.publicKeyToXY(publicKey);
   }
  }

  // compressed p-384 key, SEC format
  if(bytesCount == 49) {
   if(publicKeyHex.slice(0,2) == '03' || publicKeyHex.slice(0,2) == '02') {
     const publicKey = u8a.fromString(publicKeyHex,'base16')
     const point = ECPointDecompress(publicKey);
      return nist_p_common.publicKeyIntToXY(point);
    }
  }

     throw new Error('Unexpected pubKeyBytes');
}
