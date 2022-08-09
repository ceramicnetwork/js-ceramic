// Brent Shambaugh <brent.shambaugh@gmail.com>. 2021.

import * as mapper from "../nist_weierstrass_common.js"
import * as u8a from 'uint8arrays'

test('test a hex string with unexpected input', () => {
   const inputPublicKeyHex = '';
   const publicKey_u8a = mapper.testHexString(inputPublicKeyHex);
   expect(publicKey_u8a).toEqual(false);
});

test('test a hex string with unexpected input : try 2', () => {
   const inputPublicKeyHex = 99;
   const publicKey_u8a = mapper.testHexString(inputPublicKeyHex);
   expect(publicKey_u8a).toEqual(false);
});

test('test a hex string shorter than 33 bytes', () => {
   const inputPublicKeyHex = 'abc09';
   const publicKey_u8a = mapper.testHexString(inputPublicKeyHex);
   expect(publicKey_u8a).toEqual(true);
});

test('test testUint8Array with correct input', () => {
   const inputCompressedPoint = Uint8Array.from([3,127,35,88,48,221,61,239,167,34,239,26,162,73,214,160,221,187,164,249,144,176,129,117,56,147,63,87,54,64,101,53,66]);
   const publicKey_u8a = mapper.testUint8Array(inputCompressedPoint);
   expect(publicKey_u8a).toEqual(true);
});

test('test testUint8Array with number', () => {
   const inputCompressedPoint = 5;
   const publicKey_u8a = mapper.testUint8Array(inputCompressedPoint);
   expect(publicKey_u8a).toEqual(false);
});

test('test testUint8Array with number', () => {
   const inputCompressedPoint = 'donkey';
   const publicKey_u8a = mapper.testUint8Array(inputCompressedPoint);
   expect(publicKey_u8a).toEqual(false);
});

test('expect pubKeyBytesToHex to throw an error for null', () => {
      expect(() => {
      mapper.pubKeyBytesToHex(null);
      }).toThrowError('input must be a Uint8Array');
});

test('expect pubKeyBytesToHex to throw an error for undefined', () => {
      expect(() => {
      mapper.pubKeyBytesToHex();
      }).toThrowError('input must be a Uint8Array');
});

test('expect pubKeyBytesToHex to throw an error for an unexpected integer', () => {
      expect(() => {
      mapper.pubKeyBytesToHex(5);
      }).toThrowError('input must be a Uint8Array');
});

test('expect pubKeyBytesToHex to throw an error for an unexpected object', () => {
      expect(() => {
      mapper.pubKeyBytesToHex({x: 6n, y: 5n});
      }).toThrowError('input must be a Uint8Array');
});

test('expect pubKeyBytesToHex to convert byte array to hex string', () => {
 const output = '80247f235830dd3defa722ef1aa249d6a0ddbba4f990b0817538933f573640653542856da88d335f1fb25b8bcfbe089528dce09b1f7cb99fdd60f88300f4c2cc6d35';
 const input = Uint8Array.from([
   128,  36, 127,  35,  88,  48, 221,  61, 239, 167,  34,
   239,  26, 162,  73, 214, 160, 221, 187, 164, 249, 144,
   176, 129, 117,  56, 147,  63,  87,  54,  64, 101,  53,
    66, 133, 109, 168, 141,  51,  95,  31, 178,  91, 139,
   207, 190,   8, 149,  40, 220, 224, 155,  31, 124, 185,
   159, 221,  96, 248, 131,   0, 244, 194, 204, 109,  53
 ]);
 const result = mapper.pubKeyBytesToHex(input);
 expect(result).toEqual(output);
 });

test('expect publicKeyIntToXY to throw an error for incorrect type', () => {
      expect(() => {
      mapper.publicKeyIntToXY(5);
      }).toThrowError('Input must be an object with properties x and y');
});

test('expect publicKeyIntToXY to throw an error for {x: null, y: null}', () => {
      expect(() => {
      mapper.publicKeyIntToXY({x: null, y: null});
      }).toThrowError('Input coordinates must be BigInt');
});

test('expect publicKeyIntToXY to throw an error for {x: undefined, y: undefined}', () => {
      expect(() => {
      mapper.publicKeyIntToXY();
      }).toThrow();
});


test('expect publicKeyHextToUint8ArrayPointPair to throw an error for {x: undefined, y: undefined}', () => {
      expect(() => {
      mapper.publicKeyHexToUint8ArrayPointPair();
      }).toThrowError('input must be string with characters 0-9,A-F,a-f');
});


test('expect publicKeyHexToUint8ArrayPointPair to throw an error for incorrect type', () => {
      expect(() => {
      mapper.publicKeyHexToUint8ArrayPointPair(5);
      }).toThrowError('input must be string with characters 0-9,A-F,a-f');
});


test('expect publicKeyHexToUint8ArrayPointPair to throw an error for {x: null, y: null}', () => {
      expect(() => {
      mapper.publicKeyHexToUint8ArrayPointPair({x: null, y: null});
      }).toThrowError('input must be string with characters 0-9,A-F,a-f');
});

test('expect publicKeyHexToUint8ArrayPointPair to throw an error for {x: undefined, y: undefined}', () => {
      expect(() => {
      mapper.publicKeyHexToUint8ArrayPointPair({x: undefined, y: undefined});
      }).toThrowError('input must be string with characters 0-9,A-F,a-f');
});

test('expect publicKeyHexToUint8ArrayPointPair to throw an error for null', () => {
      expect(() => {
      mapper.publicKeyHexToUint8ArrayPointPair(null);
      }).toThrowError('input must be string with characters 0-9,A-F,a-f');
});

test('expect publicKeyToXY to throw an error for null', () => {
      expect(() => {
      mapper.publicKeyToXY(null);
      }).toThrowError('input must be string with characters 0-9,A-F,a-f');
});

test('expect publicKeyToXY to throw an error for undefined', () => {
      expect(() => {
      mapper.publicKeyToXY();
      }).toThrowError('input must be string with characters 0-9,A-F,a-f');
});

test('expect publicKeyToXY to throw an error for a non string', () => {
      expect(() => {
      mapper.publicKeyToXY(5);
      }).toThrowError('input must be string with characters 0-9,A-F,a-f');
});

test('expect publicKeyToXY to throw an error for an invalid hex string', () => {
      expect(() => {
      mapper.publicKeyToXY('095ty');
      }).toThrowError('input must be string with characters 0-9,A-F,a-f');
});

test('empty key string to should not evaluate to null, or should it??', () => {
   const inputPublicKeyHex = '';
   expect(() => {
      mapper.publicKeyHexToUint8ArrayPointPair(inputPublicKeyHex);
   }).toThrowError('input must be string with characters 0-9,A-F,a-f');
 });

test('test a hex string shorter than 33 bytes', () => {
   const inputPublicKeyHex = '36f8964623378bdc068d4bce07ed17c8fa486f9ac0c2613ca3c8c306d7bb6'
   const publicKey_u8a = pubKeyHexToUint8Array(inputPublicKeyHex);
   expect(publicKey_u8a).not.toEqual(null);
});

test('test a compressed public key in hex with an odd number of characters', () => {
   const inputPublicKeyHex = '2f9c36f8964623378bdc068d4bce07ed17c8fa486f9ac0c2613ca3c8c306d7bb6';
   const output = Uint8Array.from([2,249,195,111,137,100,98,51,120,189,192,104,212,188,224,126,209,124,143,164,134,249,172,12,38,19,202,60,140,48, 109, 123, 182]);
   const publicKey_u8a = pubKeyHexToUint8Array(inputPublicKeyHex);
   expect(publicKey_u8a).toEqual(output);
});

test('convert a public key x,y where x and y are integers to an x,y point with x and y base64url encoded', () => {
  const ecpoint = {
          x: 112971204272793929541699765384018665134067875121047561926148644683187420494774n,
          y: 13038276010400560657327464707708345466200402936352359974176190171319880557135n
   };
  const output = {
    xm: '-cNviWRiM3i9wGjUvOB-0XyPpIb5rAwmE8o8jDBte7Y',
    ym: 'HNNnF7isXk_qitI9yNB4PCMY7krXqA224AJq0LByok8'
  };

  const base64urlPoint = mapper.publicKeyIntToXY(ecpoint);
  expect(base64urlPoint).toEqual(output);

});


test('convert raw public key as a hex string into an x,y point with x and y base64url encoded', () => {
  const inputPublicKeyHex = 'f9c36f8964623378bdc068d4bce07ed17c8fa486f9ac0c2613ca3c8c306d7bb61cd36717b8ac5e4fea8ad23dc8d0783c2318ee4ad7a80db6e0026ad0b072a24f'
  const output = {
    xm: '-cNviWRiM3i9wGjUvOB-0XyPpIb5rAwmE8o8jDBte7Y',
    ym: 'HNNnF7isXk_qitI9yNB4PCMY7krXqA224AJq0LByok8'
  };
  const base64urlPoint = mapper.publicKeyToXY(inputPublicKeyHex);
  expect(base64urlPoint).toEqual(output);
});

test('expect publicKeyIntToXY to throw an error for incorrect type', () => {
      expect(() => {
      mapper.publicKeyIntToXY(5);
      }).toThrowError('Input must be an object with properties x and y');
});

test('expect publicKeyIntToXY to throw an error for {x: null, y: null}', () => {
      expect(() => {
      mapper.publicKeyIntToXY({x: null, y: null});
      }).toThrowError('Input coordinates must be BigInt');
});

test('expect publicKeyIntToXY to have properties x and y', () => {
      expect(() => {
      mapper.publicKeyIntToXY({x: 5n, z: 8n});
      }).toThrowError('Input must have properties x and y');
});

test('expect publicKeyIntToXY to throw an error for {x: undefined, y: undefined}', () => {
      expect(() => {
      mapper.publicKeyIntToXY();
      }).toThrowError('input cannot be null or undefined.');
});

test('expect publicKeyIntToUint8ArrayPointPair to throw an error for {x: undefined, y: undefined}', () => {
      expect(() => {
      mapper.publicKeyHexToUint8ArrayPointPair();
      }).toThrowError('input must be string with characters 0-9,A-F,a-f');
});

test('expect publicKeyIntToUint8ArrayPointPair to throw an error for {x: 5, y: 9}', () => {
      expect(() => {
      mapper.publicKeyIntToUint8ArrayPointPair({x: 5,y: 9});
      }).toThrowError('Input coordinates must be BigInt');
});

test('expect publicKeyIntToUint8ArrayPointPair to throw an error for null', () => {
      expect(() => {
      mapper.publicKeyIntToUint8ArrayPointPair(null);
      }).toThrowError('input cannot be null or undefined.');
});

test('expect publicKeyIntToUint8ArrayPointPair to throw an error for mislabled coordinate properties', () => {
      expect(() => {
      mapper.publicKeyIntToUint8ArrayPointPair({x: 5n, z: 7n});
      }).toThrowError('Input must have properties x and y');
});

test('expect publicKeyIntToUint8ArrayPointPair to throw an error for a non object', () => {
      expect(() => {
      mapper.publicKeyIntToUint8ArrayPointPair(6);
      }).toThrowError('Input must be an object with properties x and y');
});

test('convert a public key x,y where x and y are integers to a pair of Uint8Arrays', () => {
   const ecpoint = {
          x: 112971204272793929541699765384018665134067875121047561926148644683187420494774n,
          y: 13038276010400560657327464707708345466200402936352359974176190171319880557135n
   };
   const output = { xOctet : Uint8Array.from([
                              249, 195, 111, 137, 100,  98,  51,
                              120, 189, 192, 104, 212, 188, 224,
                              126, 209, 124, 143, 164, 134, 249,
                              172,  12,  38,  19, 202,  60, 140,
                              48, 109, 123, 182
                               ] ) ,
                    yOctet : Uint8Array.from([
                               28, 211, 103,  23, 184, 172,  94,  79,
                               234, 138, 210, 61, 200, 208, 120,  60,
                               35,  24, 238,  74, 215, 168,  13, 182,
                               224,  2, 106, 208, 176, 114, 162,  79
                               ] )
                  };

   const u8aPoint = mapper.publicKeyIntToUint8ArrayPointPair(ecpoint);
   expect(u8aPoint).toEqual(output);
});

test('key compression (y-coordinate even)', () => {
  // inputPublicKeyHex derived from: https://stackoverflow.com/questions/67135136/unable-to-verify-a-raw-uint8array-ecdsa-secp256r1-message-signature-pubkey-usi

  const inputPublicKeyHex = '39c3dd74131729446dc1b3da67d49fc046fcbf072fcc5b9fa51c05b974307f969c403b1635f0449f02bd422751e33121a4434f152f2b2b2a3f675219c5d925f6'
  const output = Uint8Array.from([2,57,195,221,116,19,23,41,68,109,193,179,218,103,212,159,192,70,252,191,7,47,204,91,159,165,28,5,185,116,48,127,150]);

  const u8aPoint = mapper.publicKeyHexToUint8ArrayPointPair(inputPublicKeyHex);
  const compressedPoint = ECPointCompress(u8aPoint.xOctet, u8aPoint.yOctet);

  expect(compressedPoint).toEqual(output);

});

test('key compression (y-coordinate odd) key#2', () => {
   const inputPublicKeyHex = '7f235830dd3defa722ef1aa249d6a0ddbba4f990b0817538933f573640653542856da88d335f1fb25b8bcfbe089528dce09b1f7cb99fdd60f88300f4c2cc6d35'
   const output = Uint8Array.from([3,127,35,88,48,221,61,239,167,34,239,26,162,73,214,160,221,187,164,249,144,176,129,117,56,147,63,87,54,64,101,53,66]);

   const u8aPoint = mapper.publicKeyHexToUint8ArrayPointPair(inputPublicKeyHex);
   const compressedPoint = ECPointCompress(u8aPoint.xOctet, u8aPoint.yOctet);

   expect(compressedPoint).toEqual(output);
});

test('key compression (y-coordinate odd)', () => {
   const inputPublicKeyHex = 'f9c36f8964623378bdc068d4bce07ed17c8fa486f9ac0c2613ca3c8c306d7bb61cd36717b8ac5e4fea8ad23dc8d0783c2318ee4ad7a80db6e0026ad0b072a24f'
   const output = Uint8Array.from([3,249,195,111,137,100,98,51,120,189,192,104,212,188,224,126,209,124,143,164,134,249,172,12,38,19,202,60,140,48,109,123,182]);

   const u8aPoint = mapper.publicKeyHexToUint8ArrayPointPair(inputPublicKeyHex);
   const compressedPoint = ECPointCompress(u8aPoint.xOctet, u8aPoint.yOctet);

   expect(compressedPoint).toEqual(output);
});

test('raw public key as hex string to x,y point with x and y as uint8Arrays', () => {
   const inputPublicKeyHex = 'f9c36f8964623378bdc068d4bce07ed17c8fa486f9ac0c2613ca3c8c306d7bb61cd36717b8ac5e4fea8ad23dc8d0783c2318ee4ad7a80db6e0026ad0b072a24f'
   const output = { xOctet : Uint8Array.from([
                              249, 195, 111, 137, 100,  98,  51,
                              120, 189, 192, 104, 212, 188, 224,
                              126, 209, 124, 143, 164, 134, 249,
                              172,  12,  38,  19, 202,  60, 140,
                              48, 109, 123, 182
                               ] ) ,
                    yOctet : Uint8Array.from([
                               28, 211, 103,  23, 184, 172,  94,  79,
                               234, 138, 210, 61, 200, 208, 120,  60,
                               35,  24, 238,  74, 215, 168,  13, 182,
                               224,  2, 106, 208, 176, 114, 162,  79
                               ] )
                  };

     const u8aPoint = mapper.publicKeyHexToUint8ArrayPointPair(inputPublicKeyHex);
     expect(u8aPoint).toEqual(output);
});

test('show how to compress a raw public key in hex and return a compressed key in hex', () => {
   const inputPublicKeyHex = 'f9c36f8964623378bdc068d4bce07ed17c8fa486f9ac0c2613ca3c8c306d7bb61cd36717b8ac5e4fea8ad23dc8d0783c2318ee4ad7a80db6e0026ad0b072a24f';
   const output = '03f9c36f8964623378bdc068d4bce07ed17c8fa486f9ac0c2613ca3c8c306d7bb6';
   const compresedKey = compresedKeyInHex(inputPublicKeyHex);
   expect(compresedKey).toEqual(output);
});

test('show how to convert a raw public key in hex and return an uncompressed key in hex', () => {
  const inputPublicKeyHex = 'f9c36f8964623378bdc068d4bce07ed17c8fa486f9ac0c2613ca3c8c306d7bb61cd36717b8ac5e4fea8ad23dc8d0783c2318ee4ad7a80db6e0026ad0b072a24f';
  const output = '04f9c36f8964623378bdc068d4bce07ed17c8fa486f9ac0c2613ca3c8c306d7bb61cd36717b8ac5e4fea8ad23dc8d0783c2318ee4ad7a80db6e0026ad0b072a24f';
  const uncompressedKey = '04'+ inputPublicKeyHex;
  expect(uncompressedKey).toEqual(output);
});

/*
 * tests for functions declared within the test file
 *
 */


test('test a null coordinates in ECPointCompress', () => {
   const x = null;
   const y = null;
   expect(() => {
      ECPointCompress(x,y);
   }).toThrowError('input cannot be null or undefined.');
});

test('test a undefined coordinates in ECPointCompress', () => {
   const x = undefined;
   const y = undefined;
   expect(() => {
      ECPointCompress(x,y);
   }).toThrowError('input cannot be null or undefined.');
});

test('test null in pubKeyHexToUint8Array', () => {
   const inputPublicKeyHex = null;
   expect(() => {
      pubKeyHexToUint8Array(inputPublicKeyHex);
   }).toThrowError('input cannot be null or undefined.');
});

test('test undefined in pubKeyHexToUint8Array', () => {
   const inputPublicKeyHex = undefined;
   expect(() => {
      pubKeyHexToUint8Array(inputPublicKeyHex);
   }).toThrowError('input cannot be null or undefined.');
});

test('test an empty string in pubKeyHexToUint8Array', () => {
   const inputPublicKeyHex = ''
   const publicKey_u8a = pubKeyHexToUint8Array(inputPublicKeyHex);
   expect(publicKey_u8a).toBeDefined();
   expect(publicKey_u8a).not.toBeNull();
   // removed because jest gives::: Received: serializes to the same string
   // expect(publicKey_u8a).toEqual([])
});

test('test compresedKeyInHex with an empty string', () => {
   const inputPublicKeyHex = '';
   const compressedKey = compresedKeyInHex(inputPublicKeyHex);
   expect(compressedKey).toBeDefined();
   expect(compressedKey).not.toBeNull();
});

test('test compresedKeyInHex with null', () => {
   const inputPublicKeyHex = null;
   expect(() => {
      compresedKeyInHex(inputPublicKeyHex);
   }).toThrowError('input cannot be null or undefined.');
});

test('test compresedKeyInHex with undefined', () => {
   const inputPublicKeyHex = undefined;
   expect(() => {
      compresedKeyInHex(inputPublicKeyHex);
   }).toThrowError('input cannot be null or undefined.');
});

//**** end of tests for functions withing the test file

// Common functions used for tests. Eliminate these when the key-did-provider is written.

// write a separate test for this function...
// source: https://stackoverflow.com/questions/17171542/algorithm-for-elliptic-curve-point-compression
function ECPointCompress( x: Uint8Array, y: Uint8Array )
{

   if(x == null || y == null) {
     throw new TypeError('input cannot be null or undefined.');
    }

   const out = new Uint8Array( x.length + 1 );

    out[0] = 2 + ( y[ y.length-1 ] & 1 );
    out.set( x, 1 );

    return out;
}

function pubKeyHexToUint8Array(publicKeyHex: string) {
  if(publicKeyHex == null) {
   throw new TypeError('input cannot be null or undefined.');
  }
    if(publicKeyHex.length % 2 == 0) {
          return u8a.fromString(publicKeyHex,'base16');
      } else {
          return u8a.fromString(('0'+publicKeyHex),'base16');
    }
}

function compresedKeyInHex(publicKeyHex: string) {
  if(publicKeyHex == null) {
    throw new TypeError('input cannot be null or undefined.');
  }
  const xHex = publicKeyHex.slice(0,publicKeyHex.length/2);
  const yHex = publicKeyHex.slice(publicKeyHex.length/2,publicKeyHex.length);

  const xOctet = u8a.fromString(xHex,'base16')
  const yOctet = u8a.fromString(yHex,'base16');

  const compressedPoint = ECPointCompress( xOctet , yOctet );
  const compressedPointHex = u8a.toString(compressedPoint,'base16');
  return compressedPointHex;
}
