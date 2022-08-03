# Ceramic http client
![ceramicnetwork](https://circleci.com/gh/ceramicnetwork/js-ceramic.svg?style=shield)
[![MIT license](https://img.shields.io/badge/License-MIT-blue.svg)](https://lbesson.mit-license.org/)
[![](https://img.shields.io/badge/Chat%20on-Discord-orange.svg?style=flat)](https://discord.gg/6VRZpGP)
[![Twitter](https://img.shields.io/twitter/follow/ceramicnetwork?label=Follow&style=social)](https://twitter.com/ceramicnetwork)

> An http client for the Ceramic protocol

## Getting started

### Installation
```
$ npm install @ceramicnetwork/http-client
```

### Usage

See the [Ceramic developer site](https://developers.ceramic.network/) for more details about how to use this package.

```
import CeramicClient from '@ceramicnetwork/http-client'
import TileDocument from '@ceramicnetwork/stream-tile'
import IdentityWallet from 'identity-wallet'

const API_URL = "http://localhost:7007"

const client = new CeramicClient(API_URL)

// create document example
const tileDocument = await TileDocument.create(ceramic, { test: 123 })

```

### Ceramic API

Complete Ceramic core API is available on [Ceramic API](https://github.com/ceramicnetwork/js-ceramic/blob/master/packages/common/src/ceramic-api.ts).

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
