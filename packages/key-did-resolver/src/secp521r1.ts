// Brent Shambaugh <brent.shambaugh@gmail.com>. 2021.

import * as u8a from 'uint8arrays'
import  multibase from'multibase'
import * as bigintModArith from 'bigint-mod-arith'

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
  * Converts a byte array into a Hex String.
  *
  * @param pubKeyBytes - public key
  * @returns hex string
  * @throws TypeError: input cannot be null or undefined.
  */
export function pubKeyBytesToHex(pubKeyBytes: Uint8Array) : string {
  if(!testUint8Array(pubKeyBytes)) {
    throw new TypeError('input must be a Uint8Array');
  }
 const bbf = u8a.toString(pubKeyBytes,'base16')
 return bbf;
}

/**
 * Decompress a compressed public key in SEC format.
 * See section 2.3.3 in SEC 1 v2 : https://www.secg.org/sec1-v2.pdf. 
 *
 * Code based on: https://stackoverflow.com/questions/17171542/algorithm-for-elliptic-curve-point-compression/30431547#30431547
 *
 * @param - 33 byte compressed public key. 1st byte: 0x02 for even or 0x03 for odd. Following 32 bytes: x coordinate expressed as big-endian.
 * @throws TypeError: input cannot be null or undefined.
 */
 export function ECPointDecompress( comp : Uint8Array ) : BigIntPoint {
  if(!testUint8Array(comp)) {
    throw new TypeError('input must be a Uint8Array');
   }
  // two, prime, b, and pIdent are constants for the P-256 curve
  const two = BigInt(2);
  const prime = (two ** 521n) - 1n;
  const b = BigInt("000109384903807373427451111239076680556993620759895168374899458639449595311615073501601370873757375962324859213229670631330943845253159101291214232748847898598441058363725152142129326129780047268409114441015993725554835256314039467401291");
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
 * @param publicKeyHex - public key as hex string.
 * @returns
 * @throws TypeError: input cannot be null or undefined.
 */
export function publicKeyToXY(publicKeyHex: string) : base64urlPoint  {
  if(!testHexString(publicKeyHex)) {
    throw new TypeError('input must be string with characters 0-9,A-F,a-f'); 
   }
 const u8aOctetPoint = publicKeyHexToUint8ArrayPointPair(publicKeyHex);
 const xm = u8a.toString(multibase.encode('base64url',u8aOctetPoint.xOctet));
 const ym = u8a.toString(multibase.encode('base64url',u8aOctetPoint.yOctet));
 return { xm, ym };
}

/**
 * 
 * @param publicKeyHex - public key as hex string. 
 * @returns - point with Uint8Array bytes using base16
 * @throws TypeError: input cannot be null or undefined.
 */
export function publicKeyHexToUint8ArrayPointPair(publicKeyHex: string) : octetPoint {
   if(!testHexString(publicKeyHex)) {
      throw new TypeError('input must be string with characters 0-9,A-F,a-f');
    }
    const xHex = publicKeyHex.slice(0,publicKeyHex.length/2);
    const yHex = publicKeyHex.slice(publicKeyHex.length/2,publicKeyHex.length);
    const xOctet = u8a.fromString(xHex,'base16');
    const yOctet = u8a.fromString(yHex,'base16');
    return { xOctet, yOctet };
}

/**
 * Tests to see if the argument is a Hex String.
 * @param str
 * @returns
 */
export function testHexString(str : string) : boolean {
 const regex = new RegExp(/^[A-Fa-f0-9]+/i);
 if(regex.test(str)) {
     if(str.length == regex.exec(str)[0].length) {
         return true;
     }
  }
  return false;
}

/**
 * Test to see if the argument is the Uint8Array
 * @param param
 * @returns
 */
export function testUint8Array(param: Uint8Array) : boolean {
  if(param == null) {
     return false;
  }
  if(param.constructor === Uint8Array) {
     return true;
  } else {
     return false;
  }
}


/**
 * 
 * @param ecpoint - Public key.
 * @returns Uint8Array with bytes as base16
 * @throws TypeError: input cannot be null or undefined.
 * @throws Error: Input coordinates must be BigInt
 * @throws Error: Input must have properties x and y
 * @throws TypeError: Input must be an object with properties x and y
*/
export function publicKeyIntToXY(ecpoint: BigIntPoint): base64urlPoint  {
  if(ecpoint == null) { throw new TypeError('input cannot be null or undefined.'); }

  if(typeof ecpoint !== "object") { throw new TypeError("Input must be an object with properties x and y"); }

  if(!Object.prototype.hasOwnProperty.call(ecpoint, "x") ||  !Object.prototype.hasOwnProperty.call(ecpoint, "y")) { throw new Error("Input must have properties x and y"); }

  if(typeof ecpoint.x !== "bigint" &&  typeof ecpoint.y !== "bigint") { throw new Error("Input coordinates must be BigInt");  }

    const u8aOctetPoint = publicKeyIntToUint8ArrayPointPair(ecpoint);
    const xm = u8a.toString(multibase.encode('base64url',u8aOctetPoint.xOctet));
    const ym = u8a.toString(multibase.encode('base64url',u8aOctetPoint.yOctet));
    return { xm, ym };
}

/**
 * 
 * @param ecpoint -  Public key.
 * @returns Uint8Array with bytes as base10
 * @throws TypeError: input cannot be null or undefined.
 * @throws Error: Input coordinates must be BigInt
 * @throws Error: Input must have properties x and y
 * @throws TypeError: Input must be an object with properties x and y
 */
export function publicKeyIntToUint8ArrayPointPair(ecpoint: BigIntPoint) : octetPoint {
     if(ecpoint == null) { throw new TypeError('input cannot be null or undefined.'); }

     if(typeof ecpoint !== "object") { throw new TypeError("Input must be an object with properties x and y"); }

     if(!Object.prototype.hasOwnProperty.call(ecpoint, "x") ||  !Object.prototype.hasOwnProperty.call(ecpoint, "y")) { throw new Error("Input must have properties x and y"); }

     if(typeof ecpoint.x !== "bigint" &&  typeof ecpoint.y !== "bigint") { throw new Error("Input coordinates must be BigInt");  }

       const xHex = (ecpoint.x).toString();
       const yHex = (ecpoint.y).toString();
       const xOctet = u8a.fromString(xHex,'base10');
       const yOctet = u8a.fromString(yHex,'base10');
       return { xOctet, yOctet };
}

/**
 * 
 * @param pubKeyBytes - public key as uncompressed byte array with no prefix (raw key), 
 *  uncompressed with 0x04 prefix, or compressed with 0x02 prefix if even and 0x03 prefix if odd.
 * @returns point x,y with coordinates as multibase encoded base64urls
 * 
 * See the the did:key specification: https://w3c-ccg.github.io/did-method-key/#p-256. 
 * At present only raw p-256 keys are covered in the specification.
 * @throws TypeError: input cannot be null or undefined.
 * @throws Error: Unexpected pubKeyBytes
 * @internal
 */
export function pubKeyBytesToXY(pubKeyBytes: Uint8Array) : base64urlPoint  {
  if(!testUint8Array(pubKeyBytes)) {
    throw new TypeError('input must be a Uint8Array');
  }
  const publicKeyHex = pubKeyBytesToHex(pubKeyBytes);
  const bytesCount = publicKeyHex.length / 2;

  // raw p-521 key
  if(bytesCount == 132) {
     return publicKeyToXY(publicKeyHex); 
   }

  // uncompressed p-521 key, SEC format
  if(bytesCount == 133) {
   if(publicKeyHex.slice(0,2) == '04') {
     const publicKey = publicKeyHex.slice(2);
     return publicKeyToXY(publicKey);
   }
  }

  // compressed p-521 key, SEC format
  if(bytesCount == 67) {
   if(publicKeyHex.slice(0,2) == '03' || publicKeyHex.slice(0,2) == '02') {
     const publicKey = u8a.fromString(publicKeyHex,'base16')
     const point = ECPointDecompress(publicKey);
      return publicKeyIntToXY(point);
    }
  }

     throw new Error('Unexpected pubKeyBytes');
}
