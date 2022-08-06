import * as u8a from 'uint8arrays'
import * as bigintModArith from 'bigint-mod-arith'
import * as nist_weierstrass_common from './nist-weierstrass-common.js'
import { BigIntPoint } from './nist-weierstrass-common'

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
