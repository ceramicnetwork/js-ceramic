# 3ID DID Resolver
![ceramicnetwork](https://circleci.com/gh/ceramicnetwork/js-ceramic.svg?style=shield)
[![MIT license](https://img.shields.io/badge/License-MIT-blue.svg)](https://lbesson.mit-license.org/)
[![](https://img.shields.io/badge/Chat%20on-Discord-orange.svg?style=flat)](https://discord.gg/6VRZpGP)
[![Twitter](https://img.shields.io/twitter/follow/ceramicnetwork?label=Follow&style=social)](https://twitter.com/ceramicnetwork)

> 3ID is a DID method that uses the Ceramic network to resolve DID documents.

## Getting started

### Installation
```
$ npm install @ceramicnetwork/3id-did-resolver
```

### Usage

See the [Ceramic developer site](https://developers.ceramic.network/) for more details about how to use this package.

```
import { getResolver } from '@ceramicnetwork/3id-did-resolver'
import { Resolver } from 'did-resolver'

// You need an instance of Ceramic to call getResolver.
// This can be either @ceramicnetwork/core or @ceramicnetwork/http-client.
const ceramic = // ...

// getResolver will return an object with a key/value pair of { '3': resolver }
// where resolver is a function used by the generic did resolver.
const threeIdResolver = getResolver(ceramic)
const didResolver = new Resolver(threeIdResolver)

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
We are happy to accept small and large contributions. Make sure to check out the [Ceramic specifications](https://github.com/ceramicnetwork/ceramic/blob/main/SPECIFICATION.md) for details of how the protocol works.


## License
