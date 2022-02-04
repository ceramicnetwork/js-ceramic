# did:key method resolver 
![ceramicnetwork](https://circleci.com/gh/ceramicnetwork/js-ceramic.svg?style=shield)
[![MIT license](https://img.shields.io/badge/License-MIT-blue.svg)](https://lbesson.mit-license.org/)
[![](https://img.shields.io/badge/Chat%20on-Discord-orange.svg?style=flat)](https://discord.gg/6VRZpGP)
[![Twitter](https://img.shields.io/twitter/follow/ceramicnetwork?label=Follow&style=social)](https://twitter.com/ceramicnetwork)

> This package contains did:key method resolver implementation

## Installation
```
$ npm install key-did-resolver
```
### Usage
This code includes support for the curves Ed25519, Secp256k1, Secp256r1 (P-256), Secp384r1 (P-384), and Secp521r1 (P-521) which follow the test vectors at:
[https://github.com/w3c-ccg/did-method-key/tree/main/test-vectors](https://github.com/w3c-ccg/did-method-key/tree/main/test-vectors)

This code has been tested with the following `did:key`[^1] providers:
|  Curve              | Repositry                                                      |
| ------------------- | -------------------------------------------------------------- |
| Ed25519             | https://github.com/ceramicnetwork/key-did-provider-ed25519     |
| Secp256k1           | https://github.com/ceramicnetwork/key-did-provider-secp256k1   |
| P-256, P-384, P-521 | https://github.com/bshambaugh/did-key-creator                  |

Compressed[^2] forms of P-256, P-384, and P-521 are preferred. [^3]

[^1]: The syntax of a did:key is `did:key:id`. The did:key `id` is the `base58btc string` representation of the `Uint8Array (byte array)` consisting of the `the multicodec name` followed by `the public key {raw,uncompressed,compressed}`.

[^2]: Compressed keys are the X coordinate of the public key with a prefix that depends on the sign of the Y curve coordinate. The prefix is '02' if even and '03' if odd.

[^3]: During development there was not yet consensus on using all compressed keys. Support for uncompressed keys with the '04' prefix and
raw keys (just the x,y bytes with no prefix) was kept for the P-256 and P-384 curves.

### Code
Using [@ceramicnetwork/core](https://developers.ceramic.network/reference/typescript/modules/_ceramicnetwork_core.html) with secp256k1 did-key:
```
import KeyDIDResolver from 'key-did-resolver'
import {Resolver} from 'did-resolver'
import {Ceramic} from '@ceramicnetwork/core'
import * as IPFS from 'ipfs-core'
import dagJose from 'dag-jose'
import {convert} from 'blockcodec-to-ipld-format'

const ipfs = await IPFS.create({
    ipld: { formats: [dagJose] },
})

const config = {}
const ceramic = await Ceramic.create(ipfs, config)
const keyDidResolver = KeyDIDResolver.getResolver(ceramic)
console.log(keyDidResolver)
const didResolver = new Resolver(keyDidResolver)
const doc = await didResolver.resolve('did:key:z6MktvqCyLxTsXUH1tUZncNdVeEZ7hNh7npPRbUU27GTrYb8')

console.log(doc)
console.log(doc.didDocument.verificationMethod)
```

Using [@ceramicnetwork/http-client](https://developers.ceramic.network/reference/typescript/modules/_ceramicnetwork_http_client.html) with secp256k1 did-key:
```
// Usage from cloned GitHub Repository:
// import * as keyDIDResolver from '../js-ceramic/packages/key-did-resolver/lib/index.js';
import KeyDIDResolver from 'key-did-resolver'
import {Resolver} from 'did-resolver'

import { CeramicClient } from '@ceramicnetwork/http-client'
const API_URL = "https://ceramic-clay.3boxlabs.com" // or your ceramic endpoint
const ceramic = new CeramicClient(API_URL)

const keyDidResolver = KeyDIDResolver.getResolver(ceramic)
const didResolver = new Resolver(keyDidResolver)
const doc = await didResolver.resolve('did:key:zQ3shokFTS3brHcDQrn82RUDfCZESWL1ZdCEJwekUDPQiYBme')

console.log(doc)
console.log(doc.didDocument.verificationMethod)
```

### Output
Using [@ceramicnetwork/core](https://developers.ceramic.network/reference/typescript/modules/_ceramicnetwork_core.html) with secp256k1 did-key:
```
{
  didResolutionMetadata: { contentType: 'application/did+json' },
  didDocument: {
    id: 'did:key:zQ3shokFTS3brHcDQrn82RUDfCZESWL1ZdCEJwekUDPQiYBme',
    verificationMethod: [ [Object] ],
    authentication: [
      'did:key:zQ3shokFTS3brHcDQrn82RUDfCZESWL1ZdCEJwekUDPQiYBme#zQ3shokFTS3brHcDQrn82RUDfCZESWL1ZdCEJwekUDPQiYBme'
    ],
    assertionMethod: [
      'did:key:zQ3shokFTS3brHcDQrn82RUDfCZESWL1ZdCEJwekUDPQiYBme#zQ3shokFTS3brHcDQrn82RUDfCZESWL1ZdCEJwekUDPQiYBme'
    ],
    capabilityDelegation: [
      'did:key:zQ3shokFTS3brHcDQrn82RUDfCZESWL1ZdCEJwekUDPQiYBme#zQ3shokFTS3brHcDQrn82RUDfCZESWL1ZdCEJwekUDPQiYBme'
    ],
    capabilityInvocation: [
      'did:key:zQ3shokFTS3brHcDQrn82RUDfCZESWL1ZdCEJwekUDPQiYBme#zQ3shokFTS3brHcDQrn82RUDfCZESWL1ZdCEJwekUDPQiYBme'
    ]
  },
  didDocumentMetadata: {}
}
[
  {
    id: 'did:key:zQ3shokFTS3brHcDQrn82RUDfCZESWL1ZdCEJwekUDPQiYBme#zQ3shokFTS3brHcDQrn82RUDfCZESWL1ZdCEJwekUDPQiYBme',
    type: 'Secp256k1VerificationKey2018',
    controller: 'did:key:zQ3shokFTS3brHcDQrn82RUDfCZESWL1ZdCEJwekUDPQiYBme',
    publicKeyBase58: '23o6Sau8NxxzXcgSc3PLcNxrzrZpbLeBn1izfv3jbKhuv'
  }
]

```
Using [@ceramicnetwork/http-client](https://developers.ceramic.network/reference/typescript/modules/_ceramicnetwork_http_client.html) with secp256k1 did-key:
```
Swarm listening on /ip4/127.0.0.1/tcp/4011/p2p/QmYGmd8VoQ1sZ82diHEzhbPxfrjrxryLMnJem4UaNnEf8K
Swarm listening on /ip4/10.0.0.5/tcp/4011/p2p/QmYGmd8VoQ1sZ82diHEzhbPxfrjrxryLMnJem4UaNnEf8K
Swarm listening on /ip4/127.0.0.1/tcp/4012/ws/p2p/QmYGmd8VoQ1sZ82diHEzhbPxfrjrxryLMnJem4UaNnEf8K
Swarm listening on /ip4/10.0.0.5/tcp/4012/ws/p2p/QmYGmd8VoQ1sZ82diHEzhbPxfrjrxryLMnJem4UaNnEf8K
Connecting to ceramic network 'inmemory' using pubsub topic '/ceramic/inmemory-2974851949'
Peer discovery is not supported for ceramic network: inmemory. This node may fail to load documents from other nodes on the network.
This node with peerId QmYGmd8VoQ1sZ82diHEzhbPxfrjrxryLMnJem4UaNnEf8K is not included in the peer list for Ceramic network inmemory. It will not be discoverable by other nodes in the network, and so data created against this node will not be available to the rest of the network.
Connected to anchor service '<inmemory>' with supported anchor chains ['inmemory:12345']
{ key: [AsyncFunction: key] }
{
  didResolutionMetadata: { contentType: 'application/did+json' },
  didDocument: {
    id: 'did:key:zQ3shokFTS3brHcDQrn82RUDfCZESWL1ZdCEJwekUDPQiYBme',
    verificationMethod: [ [Object] ],
    authentication: [
      'did:key:zQ3shokFTS3brHcDQrn82RUDfCZESWL1ZdCEJwekUDPQiYBme#zQ3shokFTS3brHcDQrn82RUDfCZESWL1ZdCEJwekUDPQiYBme'
    ],
    assertionMethod: [
      'did:key:zQ3shokFTS3brHcDQrn82RUDfCZESWL1ZdCEJwekUDPQiYBme#zQ3shokFTS3brHcDQrn82RUDfCZESWL1ZdCEJwekUDPQiYBme'
    ],
    capabilityDelegation: [
      'did:key:zQ3shokFTS3brHcDQrn82RUDfCZESWL1ZdCEJwekUDPQiYBme#zQ3shokFTS3brHcDQrn82RUDfCZESWL1ZdCEJwekUDPQiYBme'
    ],
    capabilityInvocation: [
      'did:key:zQ3shokFTS3brHcDQrn82RUDfCZESWL1ZdCEJwekUDPQiYBme#zQ3shokFTS3brHcDQrn82RUDfCZESWL1ZdCEJwekUDPQiYBme'
    ]
  },
  didDocumentMetadata: {}
}
[
  {
    id: 'did:key:zQ3shokFTS3brHcDQrn82RUDfCZESWL1ZdCEJwekUDPQiYBme#zQ3shokFTS3brHcDQrn82RUDfCZESWL1ZdCEJwekUDPQiYBme',
    type: 'Secp256k1VerificationKey2018',
    controller: 'did:key:zQ3shokFTS3brHcDQrn82RUDfCZESWL1ZdCEJwekUDPQiYBme',
    publicKeyBase58: '23o6Sau8NxxzXcgSc3PLcNxrzrZpbLeBn1izfv3jbKhuv'
  }
]

```

The code for other curves is similar. Changing the did:key string is sufficient.

#### code snippet for ed25519
```
const doc = await didResolver.resolve('did:key:z6MktvqCyLxTsXUH1tUZncNdVeEZ7hNh7npPRbUU27GTrYb8')
```

#### code snippet for P-256 
```
const doc = await didResolver.resolve('did:key:zDnaeUKTWUXc1HDpGfKbEK31nKLN19yX5aunFd7VK1CUMeyJu')
```

#### code snippet for P-384 
```
const doc = await didResolver.resolve('did:key:z82LkvCwHNreneWpsgPEbV3gu1C6NFJEBg4srfJ5gdxEsMGRJUz2sG9FE42shbn2xkZJh54')
```

#### code snippet for P-521 
```
const doc = await didResolver.resolve('did:key:z2J9gcGhudjgwsDLv4qJVM6DysnsjWRS6ggtCsSYpV9TGxd9WGoE1EkPxdvPcqEs7eLsQA985AGXPuqttPP7WJ5Qdiz27U3t')
```
Note: All P-*** curves are compressed

The verification method results are slightly different. Here is a sampling:

#### did document verificationMethod for ed25519: 
```
[
  {
    id: 'did:key:z6MktvqCyLxTsXUH1tUZncNdVeEZ7hNh7npPRbUU27GTrYb8#z6MktvqCyLxTsXUH1tUZncNdVeEZ7hNh7npPRbUU27GTrYb8',
    type: 'Ed25519VerificationKey2018',
    controller: 'did:key:z6MktvqCyLxTsXUH1tUZncNdVeEZ7hNh7npPRbUU27GTrYb8',
    publicKeyBase58: 'FUaAP6i2XyyouPds73QneYgZJ86qhua2jaZYBqJSwKok'
  }
]
```

#### did document verificationMethod for P-256: 
```
[
  {
    id: 'did:key:zDnaeUKTWUXc1HDpGfKbEK31nKLN19yX5aunFd7VK1CUMeyJu#zDnaeUKTWUXc1HDpGfKbEK31nKLN19yX5aunFd7VK1CUMeyJu',
    type: 'JsonWebKey2020',
    controller: 'did:key:zDnaeUKTWUXc1HDpGfKbEK31nKLN19yX5aunFd7VK1CUMeyJu',
    publicKeyJwk: {
      kty: 'EC',
      crv: 'P-256',
      x: 'OcPddBMXKURtwbPaZ9SfwEb8vwcvzFufpRwFuXQwf5Y',
      y: 'nEA7FjXwRJ8CvUInUeMxIaRDTxUvKysqP2dSGcXZJfY'
    }
  }
]
```

#### did document verificationMethod for P-384:
```
[
  {
    id: 'did:key:z82LkvCwHNreneWpsgPEbV3gu1C6NFJEBg4srfJ5gdxEsMGRJUz2sG9FE42shbn2xkZJh54#z82LkvCwHNreneWpsgPEbV3gu1C6NFJEBg4srfJ5gdxEsMGRJUz2sG9FE42shbn2xkZJh54',
    type: 'JsonWebKey2020',
    controller: 'did:key:z82LkvCwHNreneWpsgPEbV3gu1C6NFJEBg4srfJ5gdxEsMGRJUz2sG9FE42shbn2xkZJh54',
    publicKeyJwk: {
      kty: 'EC',
      crv: 'P-384',
      x: 'CA-iNoHDg1lL8pvX3d1uvExzVfCz7Rn6tW781Ub8K5MrDf2IMPyL0RTDiaLHC1JT',
      y: 'Kpnrn8DkXUD3ge4mFxi-DKr0DYO2KuJdwNBrhzLRtfMa3WFMZBiPKUPfJj8dYNl_'
    }
  }
]
```

#### did document verificationMethod for P-521:
```
[
  {
    id: 'did:key:z2J9gcGhudjgwsDLv4qJVM6DysnsjWRS6ggtCsSYpV9TGxd9WGoE1EkPxdvPcqEs7eLsQA985AGXPuqttPP7WJ5Qdiz27U3t#z2J9gcGhudjgwsDLv4qJVM6DysnsjWRS6ggtCsSYpV9TGxd9WGoE1EkPxdvPcqEs7eLsQA985AGXPuqttPP7WJ5Qdiz27U3t',
    type: 'JsonWebKey2020',
    controller: 'did:key:z2J9gcGhudjgwsDLv4qJVM6DysnsjWRS6ggtCsSYpV9TGxd9WGoE1EkPxdvPcqEs7eLsQA985AGXPuqttPP7WJ5Qdiz27U3t',
    publicKeyJwk: {
      kty: 'EC',
      crv: 'P-521',
      x: 'ATkofCC8_KAAJ3XSRayyPk8WqF9qahhoQVjbHtzbe5MSaaFiMKBZr-CurF9IcpJD-YYEukPmarSKFpXLtwAdiONT',
      y: 'AWuYkJ7iaFhfz_dzFemaBnuq1WFnoZeIha7KpE9benPTX9FQhAoyHY-2qO4IyqGe1XGGtx8eJXvp57xMtUXm2rAH'
    }
 }
]
```

### Testing
Due to problems with parsing JSON with BigInt, tests need to be run with Jest in Serial mode. Use **_npm run test -- --runInBand_** .

### References

[Standards for Efficient Cryptography
SEC 2: Recommended Elliptic Curve Domain Parameters
Certicom Research
Contact: Daniel R. L. Brown (dbrown@certicom.com)
January 27, 2010
Version 2.0 ], http://www.secg.org/sec2-v2.pdf 


[FIPS PUB 186-4 ,FEDERAL INFORMATION PROCESSING STANDARDS
PUBLICATION, Digital Signature Standard (DSS)], https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.186-4.pdf

[Compact representation of an elliptic curve point, Network Working Group, A.J. Jivsov, March 15, 2014],
https://tools.ietf.org/id/draft-jivsov-ecc-compact-05.html

## Additional Usage Notes

See the [ceramic developer site](https://developers.ceramic.network/) for more details about how to use this package.

## Contributing
We are happy to accept small and large contributions. Make sure to check out the [Ceramic specifications](https://github.com/ceramicnetwork/specs) for details of how the protocol works.

## License
