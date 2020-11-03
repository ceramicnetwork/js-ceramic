# 3ID DID Resolver

> 3ID is a DID method that uses the Ceramic network to resolve DID documents.

## Getting started

### Installation
```
$ npm install @ceramicnetwork/3id-did-resolver
```

### Usage

```
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'
import { Resolver } from 'did-resolver'

// You need an instance of Ceramic to call getResolver.
// This can be either @ceramicnetwork/core or @ceramicnetwork/http-client.
// You can also set an address for your own ethr-did-registry contract
const ceramic = // ...

// getResolver will return an object with a key/value pair of { '3': resolver }
// where resolver is a function used by the generic did resolver.
const threeIdResolver = ThreeIdResolver.getResolver(ceramic)
const didResolver = Resolver(threeIdResolver)

const doc = await didResolver.resolve('did:ethr:0xf3beac30c498d9e26865f34fcaa57dbb935b0d74')
console.log(doc)
```

## Development
Run tests:
```
$ npm test
```

Run linter:
```
npm run lint
```


## Contributing
We are happy to accept small and large contributions. Make sure to check out the [Ceramic specifications](https://github.com/ceramicnetwork/specs) for details of how the protocol works.


## License
