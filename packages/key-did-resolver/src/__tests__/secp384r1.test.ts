// Brent Shambaugh <brent.shambaugh@gmail.com>. 2021.

import varint from "varint"
import multibase from "multibase"
import * as mapper from "../secp384r1"
import * as u8a from 'uint8arrays'

describe('Secp384r1 mapper', () => {

    it('Secp384r1 mapper successfully resolves the document from did:key from raw public key', async () => {
        const id = "zFwfeyrSyWdksRYykTGGtagWazFB5zS4CjQcxDMQSNmCTQB5QMqokx2VJz4vBB2hN1nUrYDTuYq3kd1BM5cUCfFD4awiNuzEBuoy6rZZTMCsZsdvWkDXY6832qcAnzE7YGw43KU"

        const multicodecPubKey = multibase.decode(id)
        varint.decode(multicodecPubKey) // decode is changing param multicodecPubKey as well
        const pubKeyBytes = multicodecPubKey.slice(varint.decode.bytes)
        const doc = await mapper.keyToDidDoc(pubKeyBytes, id)
        expect(doc).toMatchSnapshot()
    })

    it('Secp384r1 mapper successfully resolves the document from did:key from raw public key #2', async () => {
        const id = "zFwepbBSaPFjt5T1zWptHaXugLNxHYABfJrDoAZRYxKjNkpdfrniF3pvYQAXwxVB7afhmsgzYtSCzTVZQ3F5SPHzP5PuHgtBGNYucZTSrnA7yTTDr7WGQZaTTkJWfiH47jW5ahU"

        const multicodecPubKey = multibase.decode(id)
        varint.decode(multicodecPubKey) // decode is changing param multicodecPubKey as well
        const pubKeyBytes = multicodecPubKey.slice(varint.decode.bytes)
        const doc = await mapper.keyToDidDoc(pubKeyBytes, id)
        expect(doc).toMatchSnapshot()
    })
    
    it('Secp384r1 mapper successfully resolves the document from did:key from raw public key #3', async () => {
        const id = "zFwfwzpxzCAUjJK6X7cLDFjxbp6G3iJy6AcntWLBu5SxJeGBjge7jVkmARyUqkJideMFofkhGF94wLopAmuqCH1JQ3fbzxmrBwKK52qF5w429kUJk5NdR8BJwDxpeWryV4oAH27";

        const multicodecPubKey = multibase.decode(id)
        varint.decode(multicodecPubKey) // decode is changing param multicodecPubKey as well
        const pubKeyBytes = multicodecPubKey.slice(varint.decode.bytes)
        const doc = await mapper.keyToDidDoc(pubKeyBytes, id)
        expect(doc).toMatchSnapshot()
    })
    
    it('Secp384r1 mapper successfully resolves the document from did:key from compressed public key', async () => {
        const id = "z82Lm1MpAkeJcix9K8TMiLd5NMAhnwkjjCBeWHXyu3U4oT2MVJJKXkcVBgjGhnLBn2Kaau9"

        const multicodecPubKey = multibase.decode(id)
        varint.decode(multicodecPubKey) // decode is changing param multicodecPubKey as well
        const pubKeyBytes = multicodecPubKey.slice(varint.decode.bytes)
        const doc = await mapper.keyToDidDoc(pubKeyBytes, id)
        expect(doc).toMatchSnapshot()
    })

    it('Secp384r1 mapper successfully resolves the document from did:key from compressed public key #2', async () => {
        const id = "z82LkvCwHNreneWpsgPEbV3gu1C6NFJEBg4srfJ5gdxEsMGRJUz2sG9FE42shbn2xkZJh54"

        const multicodecPubKey = multibase.decode(id)
        varint.decode(multicodecPubKey) // decode is changing param multicodecPubKey as well
        const pubKeyBytes = multicodecPubKey.slice(varint.decode.bytes)
        const doc = await mapper.keyToDidDoc(pubKeyBytes, id)
        expect(doc).toMatchSnapshot()
    })
  
    it('Secp384r1 mapper successfully resolves the document from did:key from compressed public key #3', async () => {
        const id = "z82Lm2BuneDPATu4BSWzhZwuandHAwY4DJrv3gAbo8RvG6yBTLJx6AhgoSmKy8XSK4HaPvA"

        const multicodecPubKey = multibase.decode(id)
        varint.decode(multicodecPubKey) // decode is changing param multicodecPubKey as well
        const pubKeyBytes = multicodecPubKey.slice(varint.decode.bytes)
        const doc = await mapper.keyToDidDoc(pubKeyBytes, id)
        expect(doc).toMatchSnapshot()
    })
    
    // testing the key from the did:key from the uncompressed public key
    it('successfully resolves the document from did', async () => {
        const id = "z28xDr9xiQCrXbooH2aC3eMVv74QKvxBgP1DHCMBWz6CvTHmdt4rtsH9JSHGsyPzdQpfMBJSSAHFh1zTjiyLhKchrMnNfBVEtCziwX2yy3YiQY9t6WcVUpSdVHaxeRz5x6JYoGGPJ"

        const multicodecPubKey = multibase.decode(id)
        varint.decode(multicodecPubKey) // decode is changing param multicodecPubKey as well
        const pubKeyBytes = multicodecPubKey.slice(varint.decode.bytes)
        const doc = await mapper.keyToDidDoc(pubKeyBytes, id)
        expect(doc).toMatchSnapshot()
    })
    
    // testing the key from the did:key from the uncompressed public key
    it('successfully resolves the document from did', async () => {
        const id = "z28xDrNf4RYwmuLQmfFBWWwiaxZtqyfME8BGUHemrsKUn6ShdzCLZWq2ZhmmSpVK2rtSLoeA1CJjrwGjZ64yCjJ9odVTYDdAMSu2LsTL1c5ehyQdkatFonfv3d7VNCByDrqntBoVz";
	
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

test('test a uncompressed public key in hex to an x,y point with x, and y url with an unsupported prefix', () => {
   const inputPublicKeyHex = '05041d73367caac24ba6ef7a2cc6b32cb525ef806dbf4a9044507863fbc2e441ad9425f17021104e76637f844db9aec27168d967d6543947d9fbdb82021b9942a0a9f0e48cfd6075e69ae3674f6724368e42561bf73dbf107a0ed17e92858aa36f';
   const publicKey_u8a = pubKeyHexToUint8Array(inputPublicKeyHex);
   expect(() => {
      mapper.pubKeyBytesToXY(publicKey_u8a);
   }).toThrowError('Unexpected pubKeyBytes');
});
  
test('test a uncompressed public key in hex to an x,y point with x, and y url encoded with an unsupported prefix that is too long', () => {
   const inputPublicKeyHex = '03041d73367caac24ba6ef7a2cc6b32cb525ef806dbf4a9044507863fbc2e441ad9425f17021104e76637f844db9aec27168d967d6543947d9fbdb82021b9942a0a9f0e48cfd6075e69ae3674f6724368e42561bf73dbf107a0ed17e92858aa36f07';
   const publicKey_u8a = pubKeyHexToUint8Array(inputPublicKeyHex);
   expect(() => {
      mapper.pubKeyBytesToXY(publicKey_u8a);
   }).toThrowError('Unexpected pubKeyBytes');
});

test('test a compressed public key in hex to an x,y point with x, and y url encoded with an unsupported prefixi: try2', () => {
   const inputPublicKeyHex = '050e167184c0436f5940e63d89f3827bb90978cbd3b26ef66d52da7638ce0f83492fe3f27794d8dd75a8b9553161b8613a';
   const publicKey_u8a = pubKeyHexToUint8Array(inputPublicKeyHex);
   expect(() => {
      mapper.pubKeyBytesToXY(publicKey_u8a);
    }).toThrowError('Unexpected pubKeyBytes');
});

test('test a compressed public key in hex to an x,y point with x, and y url encoded with an unsupported prefixi: try3', () => {
   const inputPublicKeyHex = '040e167184c0436f5940e63d89f3827bb90978cbd3b26ef66d52da7638ce0f83492fe3f27794d8dd75a8b9553161b8613a';
   const publicKey_u8a = pubKeyHexToUint8Array(inputPublicKeyHex);
   expect(() => {
      mapper.pubKeyBytesToXY(publicKey_u8a);
    }).toThrowError('Unexpected pubKeyBytes');
});

test('test a compressed public key in hex to an x,y point with x, and y url encoded with an unsupported prefix', () => {
   const inputPublicKeyHex = '040e167184c0436f5940e63d89f3827bb90978cbd3b26ef66d52da7638ce0f83492fe3f27794d8dd75a8b9553161b8613a';
   const publicKey_u8a = pubKeyHexToUint8Array(inputPublicKeyHex);
   expect(() => {
      mapper.pubKeyBytesToXY(publicKey_u8a);
   }).toThrowError('Unexpected pubKeyBytes');
});

test('test a compressed public key in hex to an x,y point with x, and y url encoded with an unexpected length', () => {
   const inputPublicKeyHex = '020e167184c0436f5940e63d89f3827bb90978cbd3b26ef66d52da7638ce0f83492fe3f27794d8dd75a8b9553161b8613a07';
   const publicKey_u8a = pubKeyHexToUint8Array(inputPublicKeyHex);
   expect(() => {
      mapper.pubKeyBytesToXY(publicKey_u8a);
   }).toThrowError('Unexpected pubKeyBytes');
});

test('test a hex string longer than 97 bytes', () => {
   const inputPublicKeyHex = '0704041d73367caac24ba6ef7a2cc6b32cb525ef806dbf4a9044507863fbc2e441ad9425f17021104e76637f844db9aec27168d967d6543947d9fbdb82021b9942a0a9f0e48cfd6075e69ae3674f6724368e42561bf73dbf107a0ed17e92858aa36f';
   const publicKey_u8a = pubKeyHexToUint8Array(inputPublicKeyHex);
   expect(() => {
      mapper.pubKeyBytesToXY(publicKey_u8a);
   }).toThrowError('Unexpected pubKeyBytes');
});

test('test a hex string longer than 97 bytes: try2', () => {
   const inputPublicKeyHex = '04041d73367caac24ba6ef7a2cc6b32cb525ef806dbf4a9044507863fbc2e441ad9425f17021104e76637f844db9aec27168d967d6543947d9fbdb82021b9942a0a9f0e48cfd6075e69ae3674f6724368e42561bf73dbf107a0ed17e92858aa36f07';
   const publicKey_u8a = pubKeyHexToUint8Array(inputPublicKeyHex);
   expect(() => {
      mapper.pubKeyBytesToXY(publicKey_u8a);
   }).toThrowError('Unexpected pubKeyBytes');
})

test('test a compressed public key in hex to an x,y point with x, and y url encoded', () => {
   const inputPublicKeyHex = '020e167184c0436f5940e63d89f3827bb90978cbd3b26ef66d52da7638ce0f83492fe3f27794d8dd75a8b9553161b8613a';
   const output = {
     xm: 'DhZxhMBDb1lA5j2J84J7uQl4y9OybvZtUtp2OM4Pg0kv4_J3lNjddai5VTFhuGE6',
     ym: 'QAzuG_cfV32pd8adVMpKYk5x9a9ZA5DMntSKQjl46SaLEkRPs2_gWoIu0cCuY8cy'
   };
   const publicKey_u8a = pubKeyHexToUint8Array(inputPublicKeyHex);
   const pubKeyBytesToXY = mapper.pubKeyBytesToXY(publicKey_u8a);
   expect(pubKeyBytesToXY).toEqual(output);
});

test('test a uncompressed public key in hex to an x,y point with x, and y url encoded', () => {
   const inputPublicKeyHex = '04041d73367caac24ba6ef7a2cc6b32cb525ef806dbf4a9044507863fbc2e441ad9425f17021104e76637f844db9aec27168d967d6543947d9fbdb82021b9942a0a9f0e48cfd6075e69ae3674f6724368e42561bf73dbf107a0ed17e92858aa36f';
   const output = {
     xm: 'BB1zNnyqwkum73osxrMstSXvgG2_SpBEUHhj-8LkQa2UJfFwIRBOdmN_hE25rsJx',
     ym: 'aNln1lQ5R9n724ICG5lCoKnw5Iz9YHXmmuNnT2ckNo5CVhv3Pb8Qeg7RfpKFiqNv'
   };
   const publicKey_u8a = pubKeyHexToUint8Array(inputPublicKeyHex);
   const pubKeyBytesToXY = mapper.pubKeyBytesToXY(publicKey_u8a);
   expect(pubKeyBytesToXY).toEqual(output);
});

test('test a raw public key in hex to an x,y point with x, and y url encoded', () => {
   const inputPublicKeyHex = '041d73367caac24ba6ef7a2cc6b32cb525ef806dbf4a9044507863fbc2e441ad9425f17021104e76637f844db9aec27168d967d6543947d9fbdb82021b9942a0a9f0e48cfd6075e69ae3674f6724368e42561bf73dbf107a0ed17e92858aa36f';
   const output = {
      xm: 'BB1zNnyqwkum73osxrMstSXvgG2_SpBEUHhj-8LkQa2UJfFwIRBOdmN_hE25rsJx',
      ym: 'aNln1lQ5R9n724ICG5lCoKnw5Iz9YHXmmuNnT2ckNo5CVhv3Pb8Qeg7RfpKFiqNv'
    };
   const publicKey_u8a = pubKeyHexToUint8Array(inputPublicKeyHex);
   const pubKeyBytesToXY = mapper.pubKeyBytesToXY(publicKey_u8a);
   expect(pubKeyBytesToXY).toEqual(output);
});

test('test a compressed public key in hex to an x,y point as BigInt', () => {
   const inputPublicKeyHex = '0265a9eb600585a6ef6edbf4c4f7769bbadb3ffa721013ade91fd272fe30457888854f53b8c41598bddd28bb6fb637f971';
   const output = {
         x: 15647482891880695628361423295295048383141137301636270605834221988066059282765781769641660206771257338747460454447473n,
         y: 9546043628548965590572582485871225792872188688117717253140508546948981101702483600611360132547640944614267655802760n
   };
   const publicKey_u8a = pubKeyHexToUint8Array(inputPublicKeyHex);
   const point = mapper.ECPointDecompress(publicKey_u8a);
   expect(point).toEqual(output);
});


test('key decompression (y-coordinate even)', () => {
  const inputCompressedPoint = Uint8Array.from([2,  35, 113, 197, 135,  41, 168, 153, 179,  78, 104,  37, 216,  27, 218, 187, 126,  99,  72,  18, 196, 175, 235, 162, 201, 186, 142,  10, 149, 170, 210, 194,  49,  95, 248, 223,  21, 242,  90, 255, 4,  44, 200,  42,  72, 183, 130, 241,  36]);
  const output = {
        x: 5455395577368722148202284288295229016372960408130441469301488141758433415923379298322689245302276505277663568654628n,
	y: 2491330177551765948830201920923407579397228012261106122732934988988922617191325104752570464363844486817305467959018n
  };

  const point = mapper.ECPointDecompress( inputCompressedPoint );

  expect(point).toEqual(output);
});

test('key decompression (y-coordinate odd)', () => {

   const inputCompressedPoint = Uint8Array.from([3, 85, 60, 88, 67, 106, 249, 139, 178, 116, 167, 2, 233, 109, 11, 235, 188, 203, 103, 93, 18, 204, 150, 41, 122, 192,  55,  55, 55,  99, 127, 81, 127, 209, 143, 40, 136, 37, 1, 46, 95, 243, 141, 178, 93, 39, 156, 202, 42]);
   const output = {
         x: 13118978274206463185421015920426680429096138428147576347133764307914667369844920909760800880755191326175781961124394n,
         y: 17805753635780018091095764692198364444788931266580341460971181687466050846576932422297677291691773698932002655999591n
   };

   const point = mapper.ECPointDecompress( inputCompressedPoint )

   expect(point).toEqual(output);
});

test('key decompression (y-coordinate odd) key#2', () => {

   const inputCompressedPoint = Uint8Array.from([ 3, 171,  37, 12,  72, 230,  28, 207, 37, 101, 156, 140,  69, 139, 233, 213,  25,  26,  99, 179, 80,  88, 236,  18,  49,  84,  35, 158, 171, 117, 128, 162, 150,  77, 208, 229,  89, 196, 110, 214, 41, 237,  36,  9, 182, 118, 204, 121, 43 ]);
   
   const output = {
        x: 26341583073126796700418388682664298992635319922642610490472596881255947259679994775386951611010846056313433587743019n,
        y: 36342522670550545791098022209848857466288485673789913258992953762740028300348932631529997025438540520232064962412623n
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
