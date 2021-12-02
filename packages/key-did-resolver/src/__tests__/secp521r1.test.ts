// Brent Shambaugh <brent.shambaugh@gmail.com>. 2021.

import varint from "varint"
import multibase from "multibase"
import * as mapper from "../secp521r1"
import * as u8a from 'uint8arrays'

describe('Secp521r1 mapper', () => {

     // testing the key from the did:key from the compressed public key
    it('successfully resolves the document from did', async () => {
        const id = "z2J9gaYhkf4Ax2QA65KkcrSxr8JDSxUBwzFq3jmq5iBroY2tE7s1uohXVqEvALPxbvdzbWWQTtHvTprUdbNFha3HawyPcD9P"

        const multicodecPubKey = multibase.decode(id)
        varint.decode(multicodecPubKey) // decode is changing param multicodecPubKey as well
        const pubKeyBytes = multicodecPubKey.slice(varint.decode.bytes)
        const doc = await mapper.keyToDidDoc(pubKeyBytes, id)
        expect(doc).toMatchSnapshot()
     })
  
     // testing the key from the did:key from the compressed public key
    it('successfully resolves the document from did', async () => {
        const id = "z2J9gcGdbo8riFqfRzgo3gjJyFcbNJm75hrnpDrZTNqQQxgNVBTtKndBiKxzGXrAbyw5W88VDbR1B1FvRQNTnSezghqnJ7p6"

        const multicodecPubKey = multibase.decode(id)
        varint.decode(multicodecPubKey) // decode is changing param multicodecPubKey as well
        const pubKeyBytes = multicodecPubKey.slice(varint.decode.bytes)
        const doc = await mapper.keyToDidDoc(pubKeyBytes, id)
        expect(doc).toMatchSnapshot()
     })


          // testing the key from the did:key from the compressed public key
    it('successfully resolves the document from did', async () => {
        const id = "z2J9gcGTjd3NaNifwmaNZN27xioMAzHHCDBmkuQ552hm9kWrzhUepDCSAhiuRYBj1sSXR1LBxgqh6vasYzc8JhC12FpaNDhT"

        const multicodecPubKey = multibase.decode(id)
        varint.decode(multicodecPubKey) // decode is changing param multicodecPubKey as well
        const pubKeyBytes = multicodecPubKey.slice(varint.decode.bytes)
        const doc = await mapper.keyToDidDoc(pubKeyBytes, id)
        expect(doc).toMatchSnapshot()
     })
  
})

test('expect ECPointDecompress to throw an error for undefined', () => {
      expect(() => {
      mapper.ECPointDecompress();
      }).toThrowError('input must be a Uint8Array');
});

test('expect ECPointDecompress to throw an error for null', () => {
      expect(() => {
      mapper.ECPointDecompress(null);
      }).toThrowError('input must be a Uint8Array');
});

test('expect ECPointDecompress to throw an error for unexpected input', () => {
      expect(() => {
      mapper.ECPointDecompress(5);
      }).toThrowError('input must be a Uint8Array');
});

test('expect publicKeyBytesToXY to throw an error for undefined', () => {
      expect(() => {
      mapper.pubKeyBytesToXY();
      }).toThrowError('input must be a Uint8Array');
});

test('expect publicKeyBytesToXY to throw an error for null', () => {
      expect(() => {
      mapper.pubKeyBytesToXY(null);
      }).toThrowError('input must be a Uint8Array');
});

test('expect publicKeyBytesToXY to throw an error for and integer input', () => {
      expect(() => {
      mapper.pubKeyBytesToXY(5);
      }).toThrowError('input must be a Uint8Array');
});

test('test a compressed public key in hex to an x,y point with x, and y url encoded with an unsupported prefixi: try2', () => {
   const inputPublicKeyHex = '050013673d87114741d183ee420e19472782c1c50a35794abad05d453246b5fd56c1bbb6baea58fa5a19e26586d4bc3db18ff91fac537cdf0913a204c5c6a9949cce8c';
   const publicKey_u8a = pubKeyHexToUint8Array(inputPublicKeyHex);
   expect(() => {
      mapper.pubKeyBytesToXY(publicKey_u8a);
    }).toThrowError('Unexpected pubKeyBytes');
});


test('test a compressed public key in hex to an x,y point with x, and y url encoded with an unsupported prefixi: try3', () => {
   const inputPublicKeyHex = '040024fd2216f69ad8a84a8ec630fa4879f82639795a83fa07769d134544130f3af5cfd86ff5460ee7e88a21115cfb9c91898c8ca492feca1992b35c23690af58bd112';
   const publicKey_u8a = pubKeyHexToUint8Array(inputPublicKeyHex);
   expect(() => {
      mapper.pubKeyBytesToXY(publicKey_u8a);
    }).toThrowError('Unexpected pubKeyBytes');
});

test('test a compressed public key in hex to an x,y point with x, and y url encoded with an unsupported prefix', () => {
   const inputPublicKeyHex = '010024fd2216f69ad8a84a8ec630fa4879f82639795a83fa07769d134544130f3af5cfd86ff5460ee7e88a21115cfb9c91898c8ca492feca1992b35c23690af58bd112'
   const publicKey_u8a = pubKeyHexToUint8Array(inputPublicKeyHex);
   expect(() => {
      mapper.pubKeyBytesToXY(publicKey_u8a);
   }).toThrowError('Unexpected pubKeyBytes');
});

test('test a compressed public key in hex to an x,y point with x, and y url encoded with an unexpected length', () => {
   const inputPublicKeyHex = '030024fd2216f69ad8a84a8ec630fa4879f82639795a83fa07769d134544130f3af5cfd86ff5460ee7e88a21115cfb9c91898c8ca492feca19';
   const publicKey_u8a = pubKeyHexToUint8Array(inputPublicKeyHex);
   expect(() => {
      mapper.pubKeyBytesToXY(publicKey_u8a);
   }).toThrowError('Unexpected pubKeyBytes');
});

test('test a hex string longer than 67 bytes', () => {
   const inputPublicKeyHex = '010024fd2216f69ad8a84a8ec630fa4879f82639795a83fa07769d134544130f3af5cfd86ff5460ee7e88a21115cfb9c91898c8ca492feca1992b35c23690af58bd112000'
   const publicKey_u8a = pubKeyHexToUint8Array(inputPublicKeyHex);
   expect(() => {
      mapper.pubKeyBytesToXY(publicKey_u8a);
   }).toThrowError('Unexpected pubKeyBytes');
});


test('test a hex string longer than 67 bytes: try2', () => {
   const inputPublicKeyHex = '030024fd2216f69ad8a84a8ec630fa4879f82639795a83fa07769d134544130f3af5cfd86ff5460ee7e88a21115cfb9c91898c8ca492feca1992b35c23690af58bd11200';
   const publicKey_u8a = pubKeyHexToUint8Array(inputPublicKeyHex);
   expect(() => {
      mapper.pubKeyBytesToXY(publicKey_u8a);
   }).toThrowError('Unexpected pubKeyBytes');
})

test('test a compressed public key in hex to an x,y point with x, and y url encoded', () => {
   const inputPublicKeyHex = '0300978fcb87684ebbfb723e695fa6e46640e05624f3e3be9e01c23f713088aa542a8006c259b6a8152f5991bf3713eada06b9eb30c0fcc5c9f877143e51d0c960f8e4';
   const output = {
        xm: 'l4_Lh2hOu_tyPmlfpuRmQOBWJPPjvp4Bwj9xMIiqVCqABsJZtqgVL1mRvzcT6toGueswwPzFyfh3FD5R0Mlg-OQ',
        ym: 'iV1Wy8VO05NKYylHjeXy7RL5zM2gG5pP8PIqBjbFXdo9MPZ3MsyyIF54Ykz76jFp55cD3CrynsUTD41JCQyFrJs'
   };
   const publicKey_u8a = pubKeyHexToUint8Array(inputPublicKeyHex);
   const pubKeyBytesToXY = mapper.pubKeyBytesToXY(publicKey_u8a);
   expect(pubKeyBytesToXY).toEqual(output);
});

test('key decompression (y-coordinate even)', () => {
  const inputCompressedPoint = Uint8Array.from([2,1,136,150,76,97,65,179,107,240,223,46,252,94,95,182,167,112,107,112,89,123,182,47,127,128,174,58,9,124,57,243,252,135,25,91,0,99,153,233,154,136,48,21,214,42,104,181,152,232,34,58,26,117,10,127,126,153,27,98,170,127,154,76,15,186,131]);
  const output = {
        x: 5263732472326197894199528512881258061258008985078293539314860591268612844870409579995212283440520259722240821760850735845522405972639427405605101549097302659n,
        y: 1607355092586893166614735742487687197205018279836427959934123116181383543385248294164182350918606129115312468371462347169202332686725754242897081121013431644n
  };
  const point = mapper.ECPointDecompress( inputCompressedPoint );
  expect(point).toEqual(output);
});

test('key decompression (y-coordinate odd)', () => {
   const inputCompressedPoint = Uint8Array.from([3,0,151,143,203,135,104,78,187,251,114,62,105,95,166,228,102,64,224,86,36,243,227,190,158,1,194,63,113,48,136,170,84,42,128,6,194,89,182,168,21,47,89,145,191,55,19,234,218,6,185,235,48,192,252,197,201,248,119,20,62,81,208,201,96,248,228]);
   const output = {
         x: 2032110154488788077213201567120364960961965815286199604659291906768970909969119283818899578872461517336788602155693417440814335996232300768684759707497330916n,
         y: 1841758248948177066704050081277018555328484709289967242827139435277985400572702195216268205445645568812241874891622506750070402046267339319053879267599690907n
   };
   const point = mapper.ECPointDecompress( inputCompressedPoint )
   expect(point).toEqual(output);
});

//**** end of tests

// Function for test. Eliminate this when key-did-resolver is written.

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
