# Ceramic http client

> An http client for the Ceramic protocol

## Getting started

### Installation
```
$ npm install @ceramicnetwork/http-client
```

### Usage

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
We are happy to accept small and large contributions. Make sure to check out the [Ceramic specifications](https://github.com/ceramicnetwork/specs) for details of how the protocol works.

## License
