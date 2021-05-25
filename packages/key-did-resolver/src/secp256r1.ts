import * as u8a from 'uint8arrays'
import  multibase from'multibase'
import * as bigintModArith from 'bigint-mod-arith'

/**
  * x,y point as a BigInt (requires at least ES2020)
  */
interface BigIntPoint {
   x: BigInt,
   y : BigInt
}

/**
  * xm,ym point as base64url utilizing multiformats
  *
  * {@link Expressed in Multibase Table: https://github.com/multiformats/multibase/blob/master/multibase.csv}
  */
interface base64urlPoint {
   xm: string,
   ym: string
}

/**
  * Elliptic Curve Points with compoents expressed as byte arrays
  */
interface octetPoint {
  xOctet: Uint8Array,
  yOctet: Uint8Array
}

/**
 * Constructs the document based on the method key
 *
 * @example
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
               crv: "P-256",
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
  * Converts a byte array into a Hex String.
  *
  * @param pubKeyBytes - cannot be null or undefined
  * 
  * @internal
  */
function pubKeyBytesToHex(pubKeyBytes: Uint8Array) {
 const bbf = u8a.toString(pubKeyBytes,'base16')
 return bbf;
}

/**
 * Decompress a compressed public key in SEC format.
 * See: Section 2.3.3 in {@link SEC 1 v2 | https://www.secg.org/sec1-v2.pdf}. 
 *
 * {@link https://stackoverflow.com/questions/17171542/algorithm-for-elliptic-curve-point-compression/30431547#30431547}
 *
 * @param - 33 byte compressed public key. 1st byte: 0x02 for even or 0x03 for odd. Following 32 bytes: x coordinate as big-endian.
 *
 * @internal
 */
 export function ECPointDecompress( comp : Uint8Array ) : BigIntPoint {
  // two, prime, b, and pIdent are constants for the P-256 curve
  const two = BigInt(2);
  const prime = (two ** 256n) - (two ** 224n) + (two ** 192n) + (two ** 96n) - 1n;
  const b = 41058363725152142129326129780047268409114441015993725554835256314039467401291n;
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

export function publicKeyToXY(publicKeyHex: string) : base64urlPoint  {
 const u8aOctetPoint = publicKeyHexToUint8ArrayPointPair(publicKeyHex);
 const xm = u8a.toString(multibase.encode('base64url',u8aOctetPoint.xOctet));
 const ym = u8a.toString(multibase.encode('base64url',u8aOctetPoint.yOctet));
 return { xm, ym };
}

export function publicKeyHexToUint8ArrayPointPair(publicKeyHex: string) : octetPoint {
    const xHex = publicKeyHex.slice(0,publicKeyHex.length/2);
    const yHex = publicKeyHex.slice(publicKeyHex.length/2,publicKeyHex.length);
    const xOctet = u8a.fromString(xHex,'base16');
    const yOctet = u8a.fromString(yHex,'base16');
    return { xOctet, yOctet };
}

export function publicKeyIntToXY(ecpoint: BigIntPoint): base64urlPoint  {
  const u8aOctetPoint = publicKeyIntToUint8ArrayPointPair(ecpoint);
  const xm = u8a.toString(multibase.encode('base64url',u8aOctetPoint.xOctet));
  const ym = u8a.toString(multibase.encode('base64url',u8aOctetPoint.yOctet));
  return { xm, ym };
}

export function publicKeyIntToUint8ArrayPointPair(ecpoint: BigIntPoint) : octetPoint {
  const xHex = (ecpoint.x).toString();
  const yHex = (ecpoint.y).toString();
  const xOctet = u8a.fromString(xHex,'base10');
  const yOctet = u8a.fromString(yHex,'base10');
  return { xOctet, yOctet };
}

export function pubKeyBytesToXY(pubKeyBytes: Uint8Array) : base64urlPoint  {
 
  if(pubKeyBytes == null) {
    throw new TypeError('input cannot be null or undefined.');
  }
  const publicKeyHex = pubKeyBytesToHex(pubKeyBytes);
  const bytesCount = publicKeyHex.length / 2;

  // raw p-256 key
  if(bytesCount == 64) {
     return publicKeyToXY(publicKeyHex); 
   }

  // uncompressed p-256 key, SEC format
  if(bytesCount == 65) {
   if(publicKeyHex.slice(0,2) == '04') {
     const publicKey = publicKeyHex.slice(2);
     return publicKeyToXY(publicKey);
   }
  }

  // compressed p-256 key, SEC format
  if(bytesCount == 33) {
   if(publicKeyHex.slice(0,2) == '03' || publicKeyHex.slice(0,2) == '02') {
     const publicKey = u8a.fromString(publicKeyHex,'base16')
     const point = ECPointDecompress(publicKey);
      return publicKeyIntToXY(point);
    }
  }

     throw new Error('Unexpected pubKeyBytes');
}
