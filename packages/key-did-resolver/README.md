# did:key method resolver 

> This package contains did:key method resolver implementation

### Installation
```
$ npm install key-did-resolver
```
### Usage
This code includes support for Ed25519 and Secp256k1 did:keys described in https://github.com/w3c-ccg/did-method-key .

Example code for creating a did:key for Ed25519 is here:
https://github.com/ceramicnetwork/key-did-provider-ed25519

Example code for creating a did:key for Secp256k1 is here:
https://github.com/ceramicnetwork/key-did-provider-secp256k1

This code supports compressed forms of P-256, P-384, and P-521 did:keys in concordance with https://github.com/w3c-ccg/did-method-key test-vectors.

The did:key id is the multicodec name + the compressed public key expressed as a Uint8Array (byte array) then encoded with base58btc and expressed as a string.
The syntax of a did:key is did:key:id.

Compressed keys are the X coordinate of the public key with a prefix that depends on the sign of the Y curve coordinate. The prefix is '02' if even and '03' if odd.

Example code for creating a did:key for P-256, P-384, and P-521 is here:
https://github.com/bshambaugh/did-key-creator 

### Code
Using [@ceramicnetwork/core](https://developers.ceramic.network/reference/typescript/modules/_ceramicnetwork_core.html) with secp256k1 did-key:
```
import KeyDIDResolver from 'key-did-resolver'
import {Resolver} from 'did-resolver'
import {Ceramic} from '@ceramicnetwork/core'
import * as IPFS from 'ipfs-core'
import dagJose from 'dag-jose'
import {convert} from 'blockcodec-to-ipld-format'

const format = convert(dagJose)

const ipfs = await IPFS.create({
    ipld: { formats: [format] },
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

```
// Usage from cloned GitHub Repository:
// import * as keyDIDResolver from '../js-ceramic/packages/key-did-resolver/lib/index.js';

import keyDIDResolver from 'key-did-resolver'

const resolverRegistry = keyDIDResolver.getResolver();

const resolve = resolverRegistry.key;

let parsedDided25519 = {
      id: "z6MktvqCyLxTsXUH1tUZncNdVeEZ7hNh7npPRbUU27GTrYb8",
      did: 'did:key:z6MktvqCyLxTsXUH1tUZncNdVeEZ7hNh7npPRbUU27GTrYb8',
      method: "key",
      didUrl: 'did:key:z6MktvqCyLxTsXUH1tUZncNdVeEZ7hNh7npPRbUU27GTrYb8/some/path',
      path: '/some/path'
}

let doced25519 = await resolve('did:key:z6MktvqCyLxTsXUH1tUZncNdVeEZ7hNh7npPRbUU27GTrYb8', parsedDided25519, {}, { accept: 'application/did+ld+json' })

console.log();
console.log('did document for ed25519:');
console.log(doced25519);
console.log();

console.log('did document metatdata:');
console.log(doced25519.didDocument.verificationMethod);

let parsedDid256k1 = {
      id: "zQ3shbgnTGcgBpXPdBjDur3ATMDWhS7aPs6FRFkWR19Lb9Zwz",
      did: 'did:key:zQ3shbgnTGcgBpXPdBjDur3ATMDWhS7aPs6FRFkWR19Lb9Zwz',
      method: "key",
      didUrl: 'did:key:zQ3shbgnTGcgBpXPdBjDur3ATMDWhS7aPs6FRFkWR19Lb9Zwz/some/path',
      path: '/some/path'
}

let doc256k1 = await resolve('did:key:zQ3shbgnTGcgBpXPdBjDur3ATMDWhS7aPs6FRFkWR19Lb9Zwz', parsedDid256k1, {}, { accept: 'application/did+ld+json' })

console.log();
console.log('did document for secp256k1:');
console.log(doc256k1);
console.log();

console.log('did document metatdata:');
console.log(doc256k1.didDocument.verificationMethod);

let parsedDid256 = {
      id: "zDnaeUKTWUXc1HDpGfKbEK31nKLN19yX5aunFd7VK1CUMeyJu",
      did: 'did:key:zDnaeUKTWUXc1HDpGfKbEK31nKLN19yX5aunFd7VK1CUMeyJu',
      method: "key",
      didUrl: 'did:key:zDnaeUKTWUXc1HDpGfKbEK31nKLN19yX5aunFd7VK1CUMeyJu/some/path',
      path: '/some/path'
}

let doc256 = await resolve('did:key:zDnaeUKTWUXc1HDpGfKbEK31nKLN19yX5aunFd7VK1CUMeyJu', parsedDid256, {}, { accept: 'application/did+ld+json' })

console.log();
console.log('did document for P-256:');
console.log(doc256);
console.log();

console.log('did document metatdata:');
console.log(doc256.didDocument.verificationMethod);

let parsedDid384 = {
      id: "z82LkvCwHNreneWpsgPEbV3gu1C6NFJEBg4srfJ5gdxEsMGRJUz2sG9FE42shbn2xkZJh54",
      did: 'did:key:z82LkvCwHNreneWpsgPEbV3gu1C6NFJEBg4srfJ5gdxEsMGRJUz2sG9FE42shbn2xkZJh54',
      method: "key",
      didUrl: 'did:key:z82LkvCwHNreneWpsgPEbV3gu1C6NFJEBg4srfJ5gdxEsMGRJUz2sG9FE42shbn2xkZJh54/some/path',
      path: '/some/path'
}

let doc384 = await resolve('did:key:z82LkvCwHNreneWpsgPEbV3gu1C6NFJEBg4srfJ5gdxEsMGRJUz2sG9FE42shbn2xkZJh54', parsedDid384, {}, { accept: 'application/did+ld+json' })

console.log();
console.log('did document for P-384:');
console.log(doc384);
console.log();

console.log('did document metatdata:');
console.log(doc384.didDocument.verificationMethod);

let parsedDid521 = {
      id: "z2J9gcGhudjgwsDLv4qJVM6DysnsjWRS6ggtCsSYpV9TGxd9WGoE1EkPxdvPcqEs7eLsQA985AGXPuqttPP7WJ5Qdiz27U3t",
      did: 'did:key:z2J9gcGhudjgwsDLv4qJVM6DysnsjWRS6ggtCsSYpV9TGxd9WGoE1EkPxdvPcqEs7eLsQA985AGXPuqttPP7WJ5Qdiz27U3t',
      method: "key",
      didUrl: 'did:key:z2J9gcGhudjgwsDLv4qJVM6DysnsjWRS6ggtCsSYpV9TGxd9WGoE1EkPxdvPcqEs7eLsQA985AGXPuqttPP7WJ5Qdiz27U3t/some/path',
      path: '/some/path'
}

let doc521 = await resolve('did:key:z2J9gcGhudjgwsDLv4qJVM6DysnsjWRS6ggtCsSYpV9TGxd9WGoE1EkPxdvPcqEs7eLsQA985AGXPuqttPP7WJ5Qdiz27U3t', parsedDid521, {}, { accept: 'application/did+ld+json' })

console.log();
console.log('did document for P-521:');
console.log(doc521)
console.log();

console.log('did document metadata:');
console.log(doc521.didDocument.verificationMethod);

```

### Output
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

```

did document for ed25519:
{
  didResolutionMetadata: { contentType: 'application/did+ld+json' },
  didDocument: {
    id: 'did:key:z6MktvqCyLxTsXUH1tUZncNdVeEZ7hNh7npPRbUU27GTrYb8',
    verificationMethod: [ [Object] ],
    authentication: [
      'did:key:z6MktvqCyLxTsXUH1tUZncNdVeEZ7hNh7npPRbUU27GTrYb8#z6MktvqCyLxTsXUH1tUZncNdVeEZ7hNh7npPRbUU27GTrYb8'
    ],
    assertionMethod: [
      'did:key:z6MktvqCyLxTsXUH1tUZncNdVeEZ7hNh7npPRbUU27GTrYb8#z6MktvqCyLxTsXUH1tUZncNdVeEZ7hNh7npPRbUU27GTrYb8'
    ],
    capabilityDelegation: [
      'did:key:z6MktvqCyLxTsXUH1tUZncNdVeEZ7hNh7npPRbUU27GTrYb8#z6MktvqCyLxTsXUH1tUZncNdVeEZ7hNh7npPRbUU27GTrYb8'
    ],
    capabilityInvocation: [
      'did:key:z6MktvqCyLxTsXUH1tUZncNdVeEZ7hNh7npPRbUU27GTrYb8#z6MktvqCyLxTsXUH1tUZncNdVeEZ7hNh7npPRbUU27GTrYb8'
    ],
    keyAgreement: [ [Object] ],
    '@context': 'https://w3id.org/did/v1'
  },
  didDocumentMetadata: {}
}

did document for secp256k1:
{
  didResolutionMetadata: { contentType: 'application/did+ld+json' },
  didDocument: {
    id: 'did:key:zQ3shbgnTGcgBpXPdBjDur3ATMDWhS7aPs6FRFkWR19Lb9Zwz',
    verificationMethod: [ [Object] ],
    authentication: [
      'did:key:zQ3shbgnTGcgBpXPdBjDur3ATMDWhS7aPs6FRFkWR19Lb9Zwz#zQ3shbgnTGcgBpXPdBjDur3ATMDWhS7aPs6FRFkWR19Lb9Zwz'
    ],
    assertionMethod: [
      'did:key:zQ3shbgnTGcgBpXPdBjDur3ATMDWhS7aPs6FRFkWR19Lb9Zwz#zQ3shbgnTGcgBpXPdBjDur3ATMDWhS7aPs6FRFkWR19Lb9Zwz'
    ],
    capabilityDelegation: [
      'did:key:zQ3shbgnTGcgBpXPdBjDur3ATMDWhS7aPs6FRFkWR19Lb9Zwz#zQ3shbgnTGcgBpXPdBjDur3ATMDWhS7aPs6FRFkWR19Lb9Zwz'
    ],
    capabilityInvocation: [
      'did:key:zQ3shbgnTGcgBpXPdBjDur3ATMDWhS7aPs6FRFkWR19Lb9Zwz#zQ3shbgnTGcgBpXPdBjDur3ATMDWhS7aPs6FRFkWR19Lb9Zwz'
    ],
    '@context': 'https://w3id.org/did/v1'
  },
  didDocumentMetadata: {}
}

did document metatdata:
[
  {
    id: 'did:key:zQ3shbgnTGcgBpXPdBjDur3ATMDWhS7aPs6FRFkWR19Lb9Zwz#zQ3shbgnTGcgBpXPdBjDur3ATMDWhS7aPs6FRFkWR19Lb9Zwz',
    type: 'Secp256k1VerificationKey2018',
    controller: 'did:key:zQ3shbgnTGcgBpXPdBjDur3ATMDWhS7aPs6FRFkWR19Lb9Zwz',
    publicKeyBase58: 'qjdSRUCiVtAjwdYVTxHQXd9FnMPRaYCtKpkchofTw66G'
  }
]

did document for P-256:
{
  didResolutionMetadata: { contentType: 'application/did+ld+json' },
  didDocument: {
    id: 'did:key:zDnaeUKTWUXc1HDpGfKbEK31nKLN19yX5aunFd7VK1CUMeyJu',
    verificationMethod: [ [Object] ],
    authentication: [
      'did:key:zDnaeUKTWUXc1HDpGfKbEK31nKLN19yX5aunFd7VK1CUMeyJu#zDnaeUKTWUXc1HDpGfKbEK31nKLN19yX5aunFd7VK1CUMeyJu'
    ],
    assertionMethod: [
      'did:key:zDnaeUKTWUXc1HDpGfKbEK31nKLN19yX5aunFd7VK1CUMeyJu#zDnaeUKTWUXc1HDpGfKbEK31nKLN19yX5aunFd7VK1CUMeyJu'
    ],
    capabilityDelegation: [
      'did:key:zDnaeUKTWUXc1HDpGfKbEK31nKLN19yX5aunFd7VK1CUMeyJu#zDnaeUKTWUXc1HDpGfKbEK31nKLN19yX5aunFd7VK1CUMeyJu'
    ],
    capabilityInvocation: [
      'did:key:zDnaeUKTWUXc1HDpGfKbEK31nKLN19yX5aunFd7VK1CUMeyJu#zDnaeUKTWUXc1HDpGfKbEK31nKLN19yX5aunFd7VK1CUMeyJu'
    ],
    '@context': 'https://w3id.org/did/v1'
  },
  didDocumentMetadata: {}
}

did document metadata: 
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

did document for P-384:
{
  didResolutionMetadata: { contentType: 'application/did+ld+json' },
  didDocument: {
    id: 'did:key:z82LkvCwHNreneWpsgPEbV3gu1C6NFJEBg4srfJ5gdxEsMGRJUz2sG9FE42shbn2xkZJh54',
    verificationMethod: [ [Object] ],
    authentication: [
      'did:key:z82LkvCwHNreneWpsgPEbV3gu1C6NFJEBg4srfJ5gdxEsMGRJUz2sG9FE42shbn2xkZJh54#z82LkvCwHNreneWpsgPEbV3gu1C6NFJEBg4srfJ5gdxEsMGRJUz2sG9FE42shbn2xkZJh54'
    ],
    assertionMethod: [
      'did:key:z82LkvCwHNreneWpsgPEbV3gu1C6NFJEBg4srfJ5gdxEsMGRJUz2sG9FE42shbn2xkZJh54#z82LkvCwHNreneWpsgPEbV3gu1C6NFJEBg4srfJ5gdxEsMGRJUz2sG9FE42shbn2xkZJh54'
    ],
    capabilityDelegation: [
      'did:key:z82LkvCwHNreneWpsgPEbV3gu1C6NFJEBg4srfJ5gdxEsMGRJUz2sG9FE42shbn2xkZJh54#z82LkvCwHNreneWpsgPEbV3gu1C6NFJEBg4srfJ5gdxEsMGRJUz2sG9FE42shbn2xkZJh54'
    ],
    capabilityInvocation: [
      'did:key:z82LkvCwHNreneWpsgPEbV3gu1C6NFJEBg4srfJ5gdxEsMGRJUz2sG9FE42shbn2xkZJh54#z82LkvCwHNreneWpsgPEbV3gu1C6NFJEBg4srfJ5gdxEsMGRJUz2sG9FE42shbn2xkZJh54'
    ],
    '@context': 'https://w3id.org/did/v1'
  },
  didDocumentMetadata: {}
}

did document metadata: 
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

did document for P-521:
{
  didResolutionMetadata: { contentType: 'application/did+ld+json' },
  didDocument: {
    id: 'did:key:z2J9gcGhudjgwsDLv4qJVM6DysnsjWRS6ggtCsSYpV9TGxd9WGoE1EkPxdvPcqEs7eLsQA985AGXPuqttPP7WJ5Qdiz27U3t',
    verificationMethod: [ [Object] ],
    authentication: [
      'did:key:z2J9gcGhudjgwsDLv4qJVM6DysnsjWRS6ggtCsSYpV9TGxd9WGoE1EkPxdvPcqEs7eLsQA985AGXPuqttPP7WJ5Qdiz27U3t#z2J9gcGhudjgwsDLv4qJVM6DysnsjWRS6ggtCsSYpV9TGxd9WGoE1EkPxdvPcqEs7eLsQA985AGXPuqttPP7WJ5Qdiz27U3t'
    ],
    assertionMethod: [
      'did:key:z2J9gcGhudjgwsDLv4qJVM6DysnsjWRS6ggtCsSYpV9TGxd9WGoE1EkPxdvPcqEs7eLsQA985AGXPuqttPP7WJ5Qdiz27U3t#z2J9gcGhudjgwsDLv4qJVM6DysnsjWRS6ggtCsSYpV9TGxd9WGoE1EkPxdvPcqEs7eLsQA985AGXPuqttPP7WJ5Qdiz27U3t'
    ],
    capabilityDelegation: [
      'did:key:z2J9gcGhudjgwsDLv4qJVM6DysnsjWRS6ggtCsSYpV9TGxd9WGoE1EkPxdvPcqEs7eLsQA985AGXPuqttPP7WJ5Qdiz27U3t#z2J9gcGhudjgwsDLv4qJVM6DysnsjWRS6ggtCsSYpV9TGxd9WGoE1EkPxdvPcqEs7eLsQA985AGXPuqttPP7WJ5Qdiz27U3t'
    ],
    capabilityInvocation: [
      'did:key:z2J9gcGhudjgwsDLv4qJVM6DysnsjWRS6ggtCsSYpV9TGxd9WGoE1EkPxdvPcqEs7eLsQA985AGXPuqttPP7WJ5Qdiz27U3t#z2J9gcGhudjgwsDLv4qJVM6DysnsjWRS6ggtCsSYpV9TGxd9WGoE1EkPxdvPcqEs7eLsQA985AGXPuqttPP7WJ5Qdiz27U3t'
    ],
    '@context': 'https://w3id.org/did/v1'
  },
  didDocumentMetadata: {}
}

did document metadata: 
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
## Testing
Due to problems with parsing JSON with BigInt, tests need to be run with Jest in Serial mode. Use **_npm run test -- --runInBand_** .

## Comments
During development there was not yet consensus on using all compressed keys. Support for uncompressed keys with the '04' prefix and
raw keys (just the x,y bytes with no prefix) was kept for the P-256 and P-384 curves.

## References

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

## Contributing
We are happy to accept small and large contributions. Make sure to check out the [Ceramic specifications](https://github.com/ceramicnetwork/specs) for details of how the protocol works.

## License
