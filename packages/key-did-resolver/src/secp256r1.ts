import * as u8a from 'uint8arrays'
import multicodec from 'multicodec'
import  multibase from'multibase'
import * as bigintModArith from 'bigint-mod-arith'

interface BigIntPoint {
   x: BigInt,
   y : BigInt
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

function pubKeyBytesToHex(pubKeyBytes: Uint8Array) {
 const bbf = u8a.toString(pubKeyBytes,'base16')
 return bbf;
}

// source: https://stackoverflow.com/questions/17171542/algorithm-for-elliptic-curve-point-compression/30431547#30431547
// accessed: May 11, 2021
export function ECPointDecompress( comp : Uint8Array ) {
  const two = BigInt(2);
  const prime = (two ** 256n) - (two ** 224n) + (two ** 192n) + (two ** 96n) - 1n;
  const b = 41058363725152142129326129780047268409114441015993725554835256314039467401291n;
  const pIdent = (prime + 1n) / 4n;

  const signY = BigInt(comp[0] - 2);
  const x = comp.subarray(1);
  const xBig = BigInt(u8a.toString(x,'base10'));

  const a = xBig**3n - xBig*3n + b;
  let yBig = bigintModArith.modPow(a,pIdent,prime);

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

export function publicKeyToXY(publicKeyHex: string) {
 const u8aOctetPoint = publicKeyHexToUint8ArrayPointPair(publicKeyHex);
 const xm = u8a.toString(multibase.encode('base64url',u8aOctetPoint.xOctet));
 const ym = u8a.toString(multibase.encode('base64url',u8aOctetPoint.yOctet));
 return { xm, ym };
}

export function publicKeyHexToUint8ArrayPointPair(publicKeyHex: string) {
    const xHex = publicKeyHex.slice(0,publicKeyHex.length/2);
    const yHex = publicKeyHex.slice(publicKeyHex.length/2,publicKeyHex.length);
    const xOctet = u8a.fromString(xHex,'base16');
    const yOctet = u8a.fromString(yHex,'base16');
    return { xOctet, yOctet };
}

export function publicKeyIntToXY(ecpoint: BigIntPoint) {
  const u8aOctetPoint = publicKeyIntToUint8ArrayPointPair(ecpoint);
  const xm = u8a.toString(multibase.encode('base64url',u8aOctetPoint.xOctet));
  const ym = u8a.toString(multibase.encode('base64url',u8aOctetPoint.yOctet));
  return { xm, ym };
}

export function publicKeyIntToUint8ArrayPointPair(ecpoint: BigIntPoint) {
  const xHex = (ecpoint.x).toString();
  const yHex = (ecpoint.y).toString();
  const xOctet = u8a.fromString(xHex,'base10');
  const yOctet = u8a.fromString(yHex,'base10');
  return { xOctet, yOctet };
}

export function pubKeyBytesToXY(pubKeyBytes: Uint8Array) {

 try {
  
  if(pubKeyBytes === null || pubKeyBytes === undefined) {
    throw new TypeError('input cannot be null or undefined.');
  }
  const publicKeyHex = pubKeyBytesToHex(pubKeyBytes);
  const bytesCount = publicKeyHex.length / 2;
  let XYpairObject = null;

  // raw p-256 key
  if(bytesCount == 64) {
    XYpairObject = publicKeyToXY(publicKeyHex);
  }

  // uncompressed p-256 key, SEC format
  if(bytesCount == 65) {
   if(publicKeyHex.slice(0,2) == '04') {
     const publicKey = publicKeyHex.slice(2);
     XYpairObject = publicKeyToXY(publicKey);
   }
  }

  // compressed p-256 key, SEC format
  if(bytesCount == 33) {
   if(publicKeyHex.slice(0,2) == '03' || publicKeyHex.slice(0,2) == '02') {
     const publicKey = u8a.fromString(publicKeyHex,'base16')
     const point = ECPointDecompress(publicKey);
     XYpairObject = publicKeyIntToXY(point);
    }
  }

  return XYpairObject;
 } finally {

 } 
}
