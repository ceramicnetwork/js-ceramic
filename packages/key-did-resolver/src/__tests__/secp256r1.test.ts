// Brent Shambaugh <brent.shambaugh@gmail.com>. 2021.

import varint from "varint"
import { base58btc } from 'multiformats/bases/base58'
import * as mapper from "../secp256r1.js"
import * as u8a from 'uint8arrays'

describe('Secp256r1 mapper', () => {

    it('successfully resolves the document from did:key from raw public key', async () => {
        const id = "zruuPojWkzGPb8sVc42f2YxcTXKUTpAUbdrzVovaTBmGGNyK6cGFaA4Kp7SSLKecrxYz8Sc9d77Rss7rayYt1oFCaNJ"

	const multiformatPubKey = base58btc.decode(id);
        varint.decode(multiformatPubKey) // decode is changing param multiformatPubKey as well
        const pubKeyBytes = multiformatPubKey.slice(varint.decode.bytes)
        const doc = await mapper.keyToDidDoc(pubKeyBytes, id)
        expect(doc).toMatchSnapshot()
    })

    it('successfully resolves the document from did:key from raw public key #2', async () => {
        const id = "zrusAFgBbf84b8mBz8Cmy8UoFWKV52EaeRnK86vnLo4Z5QoRypE6hXVPN2urevZMAMtcTaCDFLWBaE1Q3jmdb1FHgve"

	const multiformatPubKey = base58btc.decode(id);
        varint.decode(multiformatPubKey) // decode is changing param multiformatPubKey as well
        const pubKeyBytes = multiformatPubKey.slice(varint.decode.bytes)
        const doc = await mapper.keyToDidDoc(pubKeyBytes, id)
        expect(doc).toMatchSnapshot()
    })

    it('successfully resolves the document from did:key from raw public key #3', async () => {
        const id = "zrurwcJZss4ruepVNu1H3xmSirvNbzgBk9qrCktB6kaewXnJAhYWwtP3bxACqBpzjZdN7TyHNzzGGSSH5qvZsSDir9z"

	const multiformatPubKey = base58btc.decode(id);
        varint.decode(multiformatPubKey) // decode is changing param multiformatPubKey as well
        const pubKeyBytes = multiformatPubKey.slice(varint.decode.bytes)
        const doc = await mapper.keyToDidDoc(pubKeyBytes, id)
        expect(doc).toMatchSnapshot()
     })

    it('successfully resolves the document from did:key from compressed public key', async () => {
        const id = "zDnaeUKTWUXc1HDpGfKbEK31nKLN19yX5aunFd7VK1CUMeyJu"

	const multiformatPubKey = base58btc.decode(id);
        varint.decode(multiformatPubKey) // decode is changing param multiformatPubKey as well
        const pubKeyBytes = multiformatPubKey.slice(varint.decode.bytes)
        const doc = await mapper.keyToDidDoc(pubKeyBytes, id)
        expect(doc).toMatchSnapshot()
    })

    it('successfully resolves the document from did:key from compressed public key #2', async () => {
        const id = "zDnaerx9CtbPJ1q36T5Ln5wYt3MQYeGRG5ehnPAmxcf5mDZpv"

	const multiformatPubKey = base58btc.decode(id);
        varint.decode(multiformatPubKey) // decode is changing param multiformatPubKey as well
        const pubKeyBytes = multiformatPubKey.slice(varint.decode.bytes)
        const doc = await mapper.keyToDidDoc(pubKeyBytes, id)
        expect(doc).toMatchSnapshot()
    })

    it('successfully resolves the document from did:key from compressed public key #3', async () => {
        const id = "zDnaerDaTF5BXEavCrfRZEk316dpbLsfPDZ3WJ5hRTPFU2169"

	const multiformatPubKey = base58btc.decode(id);
        varint.decode(multiformatPubKey) // decode is changing param multiformatPubKey as well
        const pubKeyBytes = multiformatPubKey.slice(varint.decode.bytes)
        const doc = await mapper.keyToDidDoc(pubKeyBytes, id)
        expect(doc).toMatchSnapshot()
    })

    it('successfully resolves the document from did:key from uncompressed public key', async () => {
        const id = "z4oJ8emo5e6mGPCUS5wncFZXAyuVzGRyJZvoduwq7FrdZYPd1LZQbDKsp1YAMX8x14zBwy3yHMSpfecJCMDeRFUgFqYsY"

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
      xm: '-cNviWRiM3i9wGjUvOB-0XyPpIb5rAwmE8o8jDBte7Y',
      ym: 'HNNnF7isXk_qitI9yNB4PCMY7krXqA224AJq0LByok8'
      };
   const publicKey_u8a = pubKeyHexToUint8Array(inputPublicKeyHex);
   const pubKeyBytesToXY = mapper.pubKeyBytesToXY(publicKey_u8a);
   expect(pubKeyBytesToXY).toEqual(output);
});

test('test a uncompressed public key in hex to an x,y point with x, and y url encoded', () => {
   const inputPublicKeyHex = '04f9c36f8964623378bdc068d4bce07ed17c8fa486f9ac0c2613ca3c8c306d7bb61cd36717b8ac5e4fea8ad23dc8d0783c2318ee4ad7a80db6e0026ad0b072a24f'
   const output = {
      xm: '-cNviWRiM3i9wGjUvOB-0XyPpIb5rAwmE8o8jDBte7Y',
      ym: 'HNNnF7isXk_qitI9yNB4PCMY7krXqA224AJq0LByok8'
   };
   const publicKey_u8a = pubKeyHexToUint8Array(inputPublicKeyHex);
   const pubKeyBytesToXY = mapper.pubKeyBytesToXY(publicKey_u8a);
   expect(pubKeyBytesToXY).toEqual(output);
});

test('test a raw public key in hex to an x,y point with x, and y url encoded', () => {
   const inputPublicKeyHex = 'f9c36f8964623378bdc068d4bce07ed17c8fa486f9ac0c2613ca3c8c306d7bb61cd36717b8ac5e4fea8ad23dc8d0783c2318ee4ad7a80db6e0026ad0b072a24f'
   const output = {
      xm: '-cNviWRiM3i9wGjUvOB-0XyPpIb5rAwmE8o8jDBte7Y',
      ym: 'HNNnF7isXk_qitI9yNB4PCMY7krXqA224AJq0LByok8'
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
