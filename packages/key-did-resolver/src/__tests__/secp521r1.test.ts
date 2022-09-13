// Brent Shambaugh <brent.shambaugh@gmail.com>. 2021.

import varint from "varint"
import { base58btc } from 'multiformats/bases/base58'
import * as mapper from "../secp521r1.js"
import * as u8a from 'uint8arrays'

describe('Secp521r1 mapper', () => {

    // testing the key from the did:key from the compressed public key
    it('successfully resolves the document from did', async () => {
        const id = "z2J9gcGdb2nEyMDmzQYv2QZQcM1vXktvy1Pw4MduSWxGabLZ9XESSWLQgbuPhwnXN7zP7HpTzWqrMTzaY5zWe6hpzJ2jnw4f"
	const multiformatPubKey = base58btc.decode(id);
        varint.decode(multiformatPubKey) // decode is changing param multiformatPubKey as well
        const pubKeyBytes = multiformatPubKey.slice(varint.decode.bytes)
        const doc = await mapper.keyToDidDoc(pubKeyBytes, id)
        expect(doc).toMatchSnapshot()
    })

    // testing the key from the did:key from the compressed public key
    it('successfully resolves the document from did', async () => {
        const id = "z2J9gaYxrKVpdoG9A4gRnmpnRCcxU6agDtFVVBVdn1JedouoZN7SzcyREXXzWgt3gGiwpoHq7K68X4m32D8HgzG8wv3sY5j7"
	const multiformatPubKey = base58btc.decode(id);
        varint.decode(multiformatPubKey) // decode is changing param multiformatPubKey as well
        const pubKeyBytes = multiformatPubKey.slice(varint.decode.bytes)
        const doc = await mapper.keyToDidDoc(pubKeyBytes, id)
        expect(doc).toMatchSnapshot()
    })

    // testing the key from the did:key from the compressed public key
    it('successfully resolves the document from did', async () => {
        const id = "z2J9gaYaTUV4Ps5GYNNMm4nAyj4pGxd3Nh2zyeFjpEy631ZJ3dYfTDZ68GAhYbNuTn2eMAhKd6hhbzfxLn66vrQ6992jCSxX"
	const multiformatPubKey = base58btc.decode(id);
        varint.decode(multiformatPubKey) // decode is changing param multiformatPubKey as well
        const pubKeyBytes = multiformatPubKey.slice(varint.decode.bytes)
        const doc = await mapper.keyToDidDoc(pubKeyBytes, id)
        expect(doc).toMatchSnapshot()
     })

    // testing the key from the did:key from the compressed public key
    it('successfully resolves the document from did', async () => {
        const id = "z2J9gcGTLNfNooB4Mvx7qeEBccSWARJ3y1xjwbMH9A7ra6oq71rD1daVSVm2YmjUZRWJms18QTZXTnhaH5ihiKiVaG52cuAs"
        const multiformatPubKey = base58btc.decode(id);
        varint.decode(multiformatPubKey) // decode is changing param multiformatPubKey as well
        const pubKeyBytes = multiformatPubKey.slice(varint.decode.bytes)
        const doc = await mapper.keyToDidDoc(pubKeyBytes, id)
        expect(doc).toMatchSnapshot()
     })

    // testing the key from the did:key from the compressed public key
    it('successfully resolves the document from did', async () => {
        const id = "z2J9gaZDkUkcV4j5nMPp4dzks3vygMwKRSZWg9j7HNYcR5JLRu361LN6TwrBK3r19VisFYUZEGEXhqqffAprjgmVtCwfCUB1"
	const multiformatPubKey = base58btc.decode(id);
        varint.decode(multiformatPubKey) // decode is changing param multiformatPubKey as well
        const pubKeyBytes = multiformatPubKey.slice(varint.decode.bytes)
        const doc = await mapper.keyToDidDoc(pubKeyBytes, id)
        expect(doc).toMatchSnapshot()
     })


    // testing the key from the did:key from the compressed public key
    it('successfully resolves the document from did', async () => {
        const id = "z2J9gaYd3MzVdZSQDj1zqsxv2tLD5Np3oD7G5F5dHbsF7Sbf1ovGkRfFcaUZMSSDKheREWxapez3vzVwkRYvrSMt4PM4Am1z"
        const multiformatPubKey = base58btc.decode(id);
        varint.decode(multiformatPubKey) // decode is changing param multiformatPubKey as well
        const pubKeyBytes = multiformatPubKey.slice(varint.decode.bytes)
        const doc = await mapper.keyToDidDoc(pubKeyBytes, id)
        expect(doc).toMatchSnapshot()
     })

    // testing the key from the did:key from the compressed public key
    it('successfully resolves the document from did', async () => {
        const id = "z2J9gaYhkf4Ax2QA65KkcrSxr8JDSxUBwzFq3jmq5iBroY2tE7s1uohXVqEvALPxbvdzbWWQTtHvTprUdbNFha3HawyPcD9P"

	const multiformatPubKey = base58btc.decode(id);
        varint.decode(multiformatPubKey) // decode is changing param multiformatPubKey as well
        const pubKeyBytes = multiformatPubKey.slice(varint.decode.bytes)
        const doc = await mapper.keyToDidDoc(pubKeyBytes, id)
        expect(doc).toMatchSnapshot()
     })

     // testing the key from the did:key from the compressed public key
    it('successfully resolves the document from did', async () => {
        const id = "z2J9gcGdbo8riFqfRzgo3gjJyFcbNJm75hrnpDrZTNqQQxgNVBTtKndBiKxzGXrAbyw5W88VDbR1B1FvRQNTnSezghqnJ7p6"

	const multiformatPubKey = base58btc.decode(id);
        varint.decode(multiformatPubKey) // decode is changing param multiformatPubKey as well
        const pubKeyBytes = multiformatPubKey.slice(varint.decode.bytes)
        const doc = await mapper.keyToDidDoc(pubKeyBytes, id)
        expect(doc).toMatchSnapshot()
     })


          // testing the key from the did:key from the compressed public key
    it('successfully resolves the document from did', async () => {
        const id = "z2J9gcGTjd3NaNifwmaNZN27xioMAzHHCDBmkuQ552hm9kWrzhUepDCSAhiuRYBj1sSXR1LBxgqh6vasYzc8JhC12FpaNDhT"

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
