// Brent Shambaugh <brent.shambaugh@gmail.com>. 2021.

import * as u8a from 'uint8arrays'
import  multibase from'multibase'
//import * as bigintModArith from 'bigint-mod-arith'

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
 const xm = (u8a.toString(multibase.encode('base64url',u8aOctetPoint.xOctet))).slice(1);
 const ym = (u8a.toString(multibase.encode('base64url',u8aOctetPoint.yOctet))).slice(1);
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
 * Points xm and ym follow the base64url format in JSON Web Key (JWK) in RFC 7517: https://datatracker.ietf.org/doc/html/rfc7517
*/
export function publicKeyIntToXY(ecpoint: BigIntPoint): base64urlPoint  {
  if(ecpoint == null) { throw new TypeError('input cannot be null or undefined.'); }

  if(typeof ecpoint !== "object") { throw new TypeError("Input must be an object with properties x and y"); }

  if(!Object.prototype.hasOwnProperty.call(ecpoint, "x") ||  !Object.prototype.hasOwnProperty.call(ecpoint, "y")) { throw new Error("Input must have properties x and y"); }

  if(typeof ecpoint.x !== "bigint" &&  typeof ecpoint.y !== "bigint") { throw new Error("Input coordinates must be BigInt");  }

    const u8aOctetPoint = publicKeyIntToUint8ArrayPointPair(ecpoint);
    const xm = (u8a.toString(multibase.encode('base64url',u8aOctetPoint.xOctet))).slice(1);
    const ym = (u8a.toString(multibase.encode('base64url',u8aOctetPoint.yOctet))).slice(1);
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
