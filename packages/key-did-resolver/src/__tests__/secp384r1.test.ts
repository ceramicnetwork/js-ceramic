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

    /**
    // testing the key from the did:key from the uncompressed public key
    it('successfully resolves the document from did', async () => {
        const id = ""

        const multicodecPubKey = multibase.decode(id)
        varint.decode(multicodecPubKey) // decode is changing param multicodecPubKey as well
        const pubKeyBytes = multicodecPubKey.slice(varint.decode.bytes)
        const doc = await mapper.keyToDidDoc(pubKeyBytes, id)
        expect(doc).toMatchSnapshot()
    })
    **/

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

test('key decompression (y-coordinate odd)', () => {

   const inputCompressedPoint = Uint8Array.from([3,249,195,111,137,100,98,51,120,189,192,104,212,188,224,126,209,124,143,164,134,249,172,12,38,19,202,60,140,48,109,123,182]);
   const output = {
          x: 112971204272793929541699765384018665134067875121047561926148644683187420494774n,
          y: 13038276010400560657327464707708345466200402936352359974176190171319880557135n
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
