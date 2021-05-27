// Brent Shambaugh <brent.shambaugh@gmail.com>. 2021.

import varint from "varint"
import multibase from "multibase"
import * as mapper from "../secp256r1"
import * as u8a from 'uint8arrays'

describe('Secp256r1 mapper', () => {

    // testing the key from the did:key from the raw public key
    it('successfully resolves the document from did', async () => {
        const id = "zruuPojWkzGPb8sVc42f2YxcTXKUTpAUbdrzVovaTBmGGNyK6cGFaA4Kp7SSLKecrxYz8Sc9d77Rss7rayYt1oFCaNJ"

        const multicodecPubKey = multibase.decode(id)
        varint.decode(multicodecPubKey) // decode is changing param multicodecPubKey as well
        const pubKeyBytes = multicodecPubKey.slice(varint.decode.bytes)
        const doc = await mapper.keyToDidDoc(pubKeyBytes, id)
        expect(doc).toMatchSnapshot()
    })

    // testing the key from the did:key from the compressed public key
    it('successfully resolves the document from did', async () => {
        const id = "zDnaeUKTWUXc1HDpGfKbEK31nKLN19yX5aunFd7VK1CUMeyJu"

        const multicodecPubKey = multibase.decode(id)
        varint.decode(multicodecPubKey) // decode is changing param multicodecPubKey as well
        const pubKeyBytes = multicodecPubKey.slice(varint.decode.bytes)
        const doc = await mapper.keyToDidDoc(pubKeyBytes, id)
        expect(doc).toMatchSnapshot()
    })

    // testing the key from the did:key from the uncompressed public key
    it('successfully resolves the document from did', async () => {
        const id = "z4oJ8emo5e6mGPCUS5wncFZXAyuVzGRyJZvoduwq7FrdZYPd1LZQbDKsp1YAMX8x14zBwy3yHMSpfecJCMDeRFUgFqYsY"

        const multicodecPubKey = multibase.decode(id)
        varint.decode(multicodecPubKey) // decode is changing param multicodecPubKey as well
        const pubKeyBytes = multicodecPubKey.slice(varint.decode.bytes)
        const doc = await mapper.keyToDidDoc(pubKeyBytes, id)
        expect(doc).toMatchSnapshot()
    })

})

test('expect pubKeyBytesToHex to throw an error for null', () => {
      expect(() => {
      mapper.pubKeyBytesToHex(null);
      }).toThrowError('input cannot be null or undefined.');
});

test('expect pubKeyBytesToHex to throw an error for undefined', () => {
      expect(() => {
      mapper.pubKeyBytesToHex();
      }).toThrowError('input cannot be null or undefined.');
});

test('expect ECPointDecompress to throw an error for undefined', () => {
      expect(() => {
      mapper.ECPointDecompress();
      }).toThrowError('input cannot be null or undefined.');
});

test('expect ECPointDecompress to throw an error for null', () => {
      expect(() => {
      mapper.ECPointDecompress(null);
      }).toThrowError('input cannot be null or undefined.');
});

test('expect publicKeyIntToXY to throw an error for incorrect type', () => {
      expect(() => {
      mapper.publicKeyIntToXY(5);
      }).toThrowError('input cannot be null or undefined.');
});

test('expect publicKeyIntToXY to throw an error for {x: null, y: null}', () => {
      expect(() => {
      mapper.publicKeyIntToXY({x: null, y: null});
      }).toThrowError('input cannot be null or undefined.');
});

test('expect publicKeyIntToXY to throw an error for {x: undefined, y: undefined}', () => {
      expect(() => {
      mapper.publicKeyIntToXY();
      }).toThrow();
});


test('expect publicKeyIntToUint8ArrayPointPair to throw an error for {x: undefined, y: undefined}', () => {
      expect(() => {
      mapper.publicKeyHexToUint8ArrayPointPair();
      }).toThrow();
});


test('expect publicKeyIntToUint8ArrayPointPair to throw an error for incorrect type', () => {
      expect(() => {
      mapper.publicKeyHexToUint8ArrayPointPair(5);
      }).toThrow();
});


test('expect publicKeyIntToUint8ArrayPointPair to throw an error for {x: null, y: null}', () => {
      expect(() => {
      mapper.publicKeyHexToUint8ArrayPointPair({x: null, y: null});
      }).toThrow();
});

test('expect publicKeyIntToUint8ArrayPointPair to throw an error for {x: undefined, y: undefined}', () => {
      expect(() => {
      mapper.publicKeyHexToUint8ArrayPointPair({x: undefined, y: undefined});
      }).toThrow();
});

test('expect publicKeyHexToUint8ArrayPointPair to throw an error for null', () => {
      expect(() => {
      mapper.publicKeyHexToUint8ArrayPointPair(null);
      }).toThrowError('input cannot be null or undefined.');
});

test('expect publicKeyToXY to throw an error for null', () => {
      expect(() => {
      mapper.publicKeyToXY(null);
      }).toThrowError('input cannot be null or undefined.');
});

test('expect publicKeyToXY to throw an error for undefined', () => {
      expect(() => {
      mapper.publicKeyToXY();
      }).toThrowError('input cannot be null or undefined.');
});

test('expect publicKeyBytesToXY to throw an error for undefined', () => {
      expect(() => {
      mapper.pubKeyBytesToXY();
      }).toThrowError('input cannot be null or undefined.');
});

test('expect publicKeyBytesToXY to throw an error for null', () => {
      expect(() => {
      mapper.pubKeyBytesToXY(null);
      }).toThrowError('input cannot be null or undefined.');
});

test('empty key string to should not evaluate to null, or should it??', () => {
   const inputPublicKeyHex = '';
   const u8aPoint = mapper.publicKeyHexToUint8ArrayPointPair(inputPublicKeyHex);
   expect(u8aPoint.xOctet).not.toEqual(null);
   expect(u8aPoint.yOctet).not.toEqual(null);
 });


test('public key as empty string', () => {
  const inputPublicKeyHex = '';
  const output = { xm: 'u', ym: 'u' };
  const base64urlPoint = mapper.publicKeyToXY(inputPublicKeyHex);
  expect(base64urlPoint).toEqual(output);
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

test('test a uncompressed public key in hex to an x,y point with x, and y url encoded with an unsupported prefix', () => {
   const inputPublicKeyHex = '03f9c36f8964623378bdc068d4bce07ed17c8fa486f9ac0c2613ca3c8c306d7bb61cd36717b8ac5e4fea8ad23dc8d0783c2318ee4ad7a80db6e0026ad0b072a24f'
   const publicKey_u8a = pubKeyHexToUint8Array(inputPublicKeyHex);
   expect(() => {
      mapper.pubKeyBytesToXY(publicKey_u8a);
   }).toThrowError('Unexpected pubKeyBytes');
});

test('test a compressed public key in hex to an x,y point with x, and y url encoded with an unsupported prefixi: try2', () => {
   const inputPublicKeyHex = '05f9c36f8964623378bdc068d4bce07ed17c8fa486f9ac0c2613ca3c8c306d7bb6'
   const publicKey_u8a = pubKeyHexToUint8Array(inputPublicKeyHex);
   expect(() => {
      mapper.pubKeyBytesToXY(publicKey_u8a);
    }).toThrowError('Unexpected pubKeyBytes');  
});

test('test a compressed public key in hex to an x,y point with x, and y url encoded with an unsupported prefixi: try3', () => {
   const inputPublicKeyHex = '04f9c36f8964623378bdc068d4bce07ed17c8fa486f9ac0c2613ca3c8c306d7bb6';
   const publicKey_u8a = pubKeyHexToUint8Array(inputPublicKeyHex);
   expect(() => {
      mapper.pubKeyBytesToXY(publicKey_u8a);
    }).toThrowError('Unexpected pubKeyBytes');
});

test('test a compressed public key in hex to an x,y point with x, and y url encoded with an unsupported prefix', () => {
   const inputPublicKeyHex = '04f9c36f8964623378bdc068d4bce07ed17c8fa486f9ac0c2613ca3c8c306d7bb6'
   const publicKey_u8a = pubKeyHexToUint8Array(inputPublicKeyHex);
   expect(() => {
      mapper.pubKeyBytesToXY(publicKey_u8a);
   }).toThrowError('Unexpected pubKeyBytes');
});

test('test a compressed public key in hex to an x,y point with x, and y url encoded with an unexpected length', () => {
   const inputPublicKeyHex = '0239c3dd74131729446dc1b3da67d49fc046fcbf072fcc5b9fa51c05b974307f9642';
   const publicKey_u8a = pubKeyHexToUint8Array(inputPublicKeyHex);
   expect(() => {
      mapper.pubKeyBytesToXY(publicKey_u8a);
   }).toThrowError('Unexpected pubKeyBytes');
});

test('test a hex string longer than 65 bytes', () => {
   const inputPublicKeyHex = '0704f9c36f8964623378bdc068d4bce07ed17c8fa486f9ac0c2613ca3c8c306d7bb61cd36717b8ac5e4fea8ad23dc8d0783c2318ee4ad7a80db6e0026ad0b072a24f'
   const publicKey_u8a = pubKeyHexToUint8Array(inputPublicKeyHex);
   expect(() => {
      mapper.pubKeyBytesToXY(publicKey_u8a);
   }).toThrowError('Unexpected pubKeyBytes');
});

test('test a hex string longer than 65 bytes: try2', () => {
   const inputPublicKeyHex = '04f9c36f8964623378bdc068d4bce07ed17c8fa486f9ac0c2613ca3c8c306d7bb61cd36717b8ac5e4fea8ad23dc8d0783c2318ee4ad7a80db6e0026ad0b072a24f07';
   const publicKey_u8a = pubKeyHexToUint8Array(inputPublicKeyHex);
   expect(() => {
      mapper.pubKeyBytesToXY(publicKey_u8a);
   }).toThrowError('Unexpected pubKeyBytes');
})

test('test a compressed public key in hex to an x,y point with x, and y url encoded', () => {
   const inputPublicKeyHex = '03f9c36f8964623378bdc068d4bce07ed17c8fa486f9ac0c2613ca3c8c306d7bb6'
   const output = {
      xm: 'u-cNviWRiM3i9wGjUvOB-0XyPpIb5rAwmE8o8jDBte7Y',
      ym: 'uHNNnF7isXk_qitI9yNB4PCMY7krXqA224AJq0LByok8'  
      };
   const publicKey_u8a = pubKeyHexToUint8Array(inputPublicKeyHex);  
   const pubKeyBytesToXY = mapper.pubKeyBytesToXY(publicKey_u8a);
   expect(pubKeyBytesToXY).toEqual(output);
});

test('test a uncompressed public key in hex to an x,y point with x, and y url encoded', () => {
   const inputPublicKeyHex = '04f9c36f8964623378bdc068d4bce07ed17c8fa486f9ac0c2613ca3c8c306d7bb61cd36717b8ac5e4fea8ad23dc8d0783c2318ee4ad7a80db6e0026ad0b072a24f'
   const output = {
      xm: 'u-cNviWRiM3i9wGjUvOB-0XyPpIb5rAwmE8o8jDBte7Y',
      ym: 'uHNNnF7isXk_qitI9yNB4PCMY7krXqA224AJq0LByok8'
   }; 
   const publicKey_u8a = pubKeyHexToUint8Array(inputPublicKeyHex);
   const pubKeyBytesToXY = mapper.pubKeyBytesToXY(publicKey_u8a);
   expect(pubKeyBytesToXY).toEqual(output);
});

test('test a raw public key in hex to an x,y point with x, and y url encoded', () => {
   const inputPublicKeyHex = 'f9c36f8964623378bdc068d4bce07ed17c8fa486f9ac0c2613ca3c8c306d7bb61cd36717b8ac5e4fea8ad23dc8d0783c2318ee4ad7a80db6e0026ad0b072a24f'
   const output = {
      xm: 'u-cNviWRiM3i9wGjUvOB-0XyPpIb5rAwmE8o8jDBte7Y',
      ym: 'uHNNnF7isXk_qitI9yNB4PCMY7krXqA224AJq0LByok8'
   }; 
   const publicKey_u8a = pubKeyHexToUint8Array(inputPublicKeyHex);
   const pubKeyBytesToXY = mapper.pubKeyBytesToXY(publicKey_u8a);
   expect(pubKeyBytesToXY).toEqual(output);   
});

test('convert a public key x,y where x and y are integers to an x,y point with x and y base64url encoded', () => {
  const ecpoint = {
          x: 112971204272793929541699765384018665134067875121047561926148644683187420494774n,
          y: 13038276010400560657327464707708345466200402936352359974176190171319880557135n
   };
  const output = {
    xm: 'u-cNviWRiM3i9wGjUvOB-0XyPpIb5rAwmE8o8jDBte7Y',
    ym: 'uHNNnF7isXk_qitI9yNB4PCMY7krXqA224AJq0LByok8'
  };

  const base64urlPoint = mapper.publicKeyIntToXY(ecpoint);
  expect(base64urlPoint).toEqual(output);

});


test('convert raw public key as a hex string into an x,y point with x and y base64url encoded', () => {
  const inputPublicKeyHex = 'f9c36f8964623378bdc068d4bce07ed17c8fa486f9ac0c2613ca3c8c306d7bb61cd36717b8ac5e4fea8ad23dc8d0783c2318ee4ad7a80db6e0026ad0b072a24f'
  const output = {
    xm: 'u-cNviWRiM3i9wGjUvOB-0XyPpIb5rAwmE8o8jDBte7Y',
    ym: 'uHNNnF7isXk_qitI9yNB4PCMY7krXqA224AJq0LByok8'
  };
  const base64urlPoint = mapper.publicKeyToXY(inputPublicKeyHex);
  expect(base64urlPoint).toEqual(output);
});  

test('expect publicKeyIntToUint8ArrayPointPair to throw an error for {x: undefined, y: undefined}', () => {
      expect(() => {
      mapper.publicKeyHexToUint8ArrayPointPair();
      }).toThrowError('input cannot be null or undefined.');
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


test('test a compressed public key in hex to an x,y point as BigInt (with the wrong parity)', () => {
   const inputPublicKeyHex = '02f9c36f8964623378bdc068d4bce07ed17c8fa486f9ac0c2613ca3c8c306d7bb6';
   const output = {
         x: 112971204272793929541699765384018665134067875121047561926148644683187420494774n,
         y: 102753813199955688105369982241699228063885740478937954221357441137547217296816n
   };
   const publicKey_u8a = pubKeyHexToUint8Array(inputPublicKeyHex);
   const point = mapper.ECPointDecompress(publicKey_u8a);
   expect(point).toEqual(output);
});


test('key decompression (y-coordinate even)', () => {
  const inputCompressedPoint = Uint8Array.from([2,57,195,221,116,19,23,41,68,109,193,179,218,103,212,159,192,70,252,191,7,47,204,91,159,165,28,5,185,116,48,127,150]);
  const output = {
         x: 26127895962184884692520600754586230836934108530588605558459884945533706469270n,
        y: 70674290392969052505695590170208788569527910698023358885182794820324123289078n
  };

  const point = mapper.ECPointDecompress( inputCompressedPoint );

  expect(point).toEqual(output);
});

test('key compression (y-coordinate even)', () => {
  // inputPublicKeyHex derived from: https://stackoverflow.com/questions/67135136/unable-to-verify-a-raw-uint8array-ecdsa-secp256r1-message-signature-pubkey-usi

  const inputPublicKeyHex = '39c3dd74131729446dc1b3da67d49fc046fcbf072fcc5b9fa51c05b974307f969c403b1635f0449f02bd422751e33121a4434f152f2b2b2a3f675219c5d925f6'
  const output = Uint8Array.from([2,57,195,221,116,19,23,41,68,109,193,179,218,103,212,159,192,70,252,191,7,47,204,91,159,165,28,5,185,116,48,127,150]);

  const u8aPoint = mapper.publicKeyHexToUint8ArrayPointPair(inputPublicKeyHex);
  const compressedPoint = ECPointCompress(u8aPoint.xOctet, u8aPoint.yOctet);

  expect(compressedPoint).toEqual(output);

});

test('key decompression (y-coordinate odd) key#2', () => {

   const inputCompressedPoint = Uint8Array.from([3,127,35,88,48,221,61,239,167,34,239,26,162,73,214,160,221,187,164,249,144,176,129,117,56,147,63,87,54,64,101,53,66]);
   const output = {
        x: 57506180088397527878367021711159096752486239922681589595989108987041675556162n,
        y: 60351358491784072971514173700673656664870632871947100762396585099496243621173n
   };

   const point = mapper.ECPointDecompress( inputCompressedPoint )

   expect(point).toEqual(output);
});

test('key compression (y-coordinate odd) key#2', () => {
   const inputPublicKeyHex = '7f235830dd3defa722ef1aa249d6a0ddbba4f990b0817538933f573640653542856da88d335f1fb25b8bcfbe089528dce09b1f7cb99fdd60f88300f4c2cc6d35'
   const output = Uint8Array.from([3,127,35,88,48,221,61,239,167,34,239,26,162,73,214,160,221,187,164,249,144,176,129,117,56,147,63,87,54,64,101,53,66]);
   
   const u8aPoint = mapper.publicKeyHexToUint8ArrayPointPair(inputPublicKeyHex);
   const compressedPoint = ECPointCompress(u8aPoint.xOctet, u8aPoint.yOctet);
   
   expect(compressedPoint).toEqual(output);
});

test('key decompression (y-coordinate odd)', () => {

   const inputCompressedPoint = Uint8Array.from([3,249,195,111,137,100,98,51,120,189,192,104,212,188,224,126,209,124,143,164,134,249,172,12,38,19,202,60,140,48,109,123,182]);
   const output = {
          x: 112971204272793929541699765384018665134067875121047561926148644683187420494774n,
          y: 13038276010400560657327464707708345466200402936352359974176190171319880557135n
   };

   const point = mapper.ECPointDecompress( inputCompressedPoint )

   expect(point).toEqual(output);
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
