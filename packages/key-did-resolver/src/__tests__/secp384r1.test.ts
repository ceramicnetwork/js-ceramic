// Brent Shambaugh <brent.shambaugh@gmail.com>. 2021.

import varint from "varint"
import { base58btc } from 'multiformats/bases/base58'
import * as mapper from "../secp384r1"
import * as u8a from 'uint8arrays'

describe('Secp384r1 mapper', () => {

    it('Secp384r1 mapper successfully resolves the document from did:key from raw public key', async () => {
        const id = "zFwfeyrSyWdksRYykTGGtagWazFB5zS4CjQcxDMQSNmCTQB5QMqokx2VJz4vBB2hN1nUrYDTuYq3kd1BM5cUCfFD4awiNuzEBuoy6rZZTMCsZsdvWkDXY6832qcAnzE7YGw43KU"

        const multiformatPubKey = base58btc.decode(id);
        varint.decode(multiformatPubKey) // decode is changing param multiformatPubKey as well
        const pubKeyBytes = multiformatPubKey.slice(varint.decode.bytes)
        const doc = await mapper.keyToDidDoc(pubKeyBytes, id)
        expect(doc).toMatchSnapshot()
    })

    it('Secp384r1 mapper successfully resolves the document from did:key from raw public key #2', async () => {
        const id = "zFwepbBSaPFjt5T1zWptHaXugLNxHYABfJrDoAZRYxKjNkpdfrniF3pvYQAXwxVB7afhmsgzYtSCzTVZQ3F5SPHzP5PuHgtBGNYucZTSrnA7yTTDr7WGQZaTTkJWfiH47jW5ahU"

	const multiformatPubKey = base58btc.decode(id);
        varint.decode(multiformatPubKey) // decode is changing param multiformatPubKey as well
        const pubKeyBytes = multiformatPubKey.slice(varint.decode.bytes)
        const doc = await mapper.keyToDidDoc(pubKeyBytes, id)
        expect(doc).toMatchSnapshot()
    })
    
    it('Secp384r1 mapper successfully resolves the document from did:key from raw public key #3', async () => {
        const id = "zFwfwzpxzCAUjJK6X7cLDFjxbp6G3iJy6AcntWLBu5SxJeGBjge7jVkmARyUqkJideMFofkhGF94wLopAmuqCH1JQ3fbzxmrBwKK52qF5w429kUJk5NdR8BJwDxpeWryV4oAH27";

	const multiformatPubKey = base58btc.decode(id);
        varint.decode(multiformatPubKey) // decode is changing param multiformatPubKey as well
        const pubKeyBytes = multiformatPubKey.slice(varint.decode.bytes)
        const doc = await mapper.keyToDidDoc(pubKeyBytes, id)
        expect(doc).toMatchSnapshot()
    })
    
    it('Secp384r1 mapper successfully resolves the document from did:key from compressed public key', async () => {
        const id = "z82Lm1MpAkeJcix9K8TMiLd5NMAhnwkjjCBeWHXyu3U4oT2MVJJKXkcVBgjGhnLBn2Kaau9"

	const multiformatPubKey = base58btc.decode(id);
        varint.decode(multiformatPubKey) // decode is changing param multiformatPubKey as well
        const pubKeyBytes = multiformatPubKey.slice(varint.decode.bytes)
        const doc = await mapper.keyToDidDoc(pubKeyBytes, id)
        expect(doc).toMatchSnapshot()
    })

    it('Secp384r1 mapper successfully resolves the document from did:key from compressed public key #2', async () => {
        const id = "z82LkvCwHNreneWpsgPEbV3gu1C6NFJEBg4srfJ5gdxEsMGRJUz2sG9FE42shbn2xkZJh54"

	const multiformatPubKey = base58btc.decode(id);
        varint.decode(multiformatPubKey) // decode is changing param multiformatPubKey as well
        const pubKeyBytes = multiformatPubKey.slice(varint.decode.bytes)
        const doc = await mapper.keyToDidDoc(pubKeyBytes, id)
        expect(doc).toMatchSnapshot()
    })
  
    it('Secp384r1 mapper successfully resolves the document from did:key from compressed public key #3', async () => {
        const id = "z82Lm2BuneDPATu4BSWzhZwuandHAwY4DJrv3gAbo8RvG6yBTLJx6AhgoSmKy8XSK4HaPvA"

	const multiformatPubKey = base58btc.decode(id);
        varint.decode(multiformatPubKey) // decode is changing param multiformatPubKey as well
        const pubKeyBytes = multiformatPubKey.slice(varint.decode.bytes)
        const doc = await mapper.keyToDidDoc(pubKeyBytes, id)
        expect(doc).toMatchSnapshot()
    })
    
    // testing the key from the did:key from the uncompressed public key
    it('successfully resolves the document from did', async () => {
        const id = "z28xDr9xiQCrXbooH2aC3eMVv74QKvxBgP1DHCMBWz6CvTHmdt4rtsH9JSHGsyPzdQpfMBJSSAHFh1zTjiyLhKchrMnNfBVEtCziwX2yy3YiQY9t6WcVUpSdVHaxeRz5x6JYoGGPJ"

	const multiformatPubKey = base58btc.decode(id);
        varint.decode(multiformatPubKey) // decode is changing param multiformatPubKey as well
        const pubKeyBytes = multiformatPubKey.slice(varint.decode.bytes)
        const doc = await mapper.keyToDidDoc(pubKeyBytes, id)
        expect(doc).toMatchSnapshot()
    })
    
    // testing the key from the did:key from the uncompressed public key
    it('successfully resolves the document from did', async () => {
        const id = "z28xDrNf4RYwmuLQmfFBWWwiaxZtqyfME8BGUHemrsKUn6ShdzCLZWq2ZhmmSpVK2rtSLoeA1CJjrwGjZ64yCjJ9odVTYDdAMSu2LsTL1c5ehyQdkatFonfv3d7VNCByDrqntBoVz";

	const multiformatPubKey = base58btc.decode(id);
        varint.decode(multiformatPubKey) // decode is changing param multiformatPubKey as well
        const pubKeyBytes = multiformatPubKey.slice(varint.decode.bytes)
        const doc = await mapper.keyToDidDoc(pubKeyBytes, id)
        expect(doc).toMatchSnapshot()
    })
    


})

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
