# 3ID DID Resolver

> TODO: description

## Usage

```
import { getResolver } from '@ceramicnetwork/3id-did-resolver'
import { Resolver } from 'did-resolver'

// You need an instance of Ceramic to call getResolver.
// This can be either ceramic-core or ceramic-http-client.
// You can also set an address for your own ethr-did-registry contract
const ceramic = // ...

// getResolver will return an object with a key/value pair of { '3': resolver }
// where resolver is a function used by the generic did resolver.
const threeIdResolver = getResolver(ceramic)
const didResolver = Resolver(threeIdResolver)

const doc = await didResolver.resolve('did:ethr:0xf3beac30c498d9e26865f34fcaa57dbb935b0d74')
console.log(doc)
```
