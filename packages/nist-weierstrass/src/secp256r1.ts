import * as u8a from 'uint8arrays'
import * as bigintModArith from 'bigint-mod-arith'
import * as nist_weierstrass_common from './nist-weierstrass-common.js'
import { BigIntPoint } from './nist-weierstrass-common'

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
  if(!nist_weierstrass_common.testUint8Array(comp)) {
    throw new TypeError('input must be a Uint8Array');
   }
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


