# Ceramic Core

> This package contains the implementation of the core Ceramic protocol. It's exposed using a simple JavaScript API.

## Getting started

### Installation
```
$ npm install @ceramicnetwork/core
```

### Usage
```
import Ceramic from '@ceramicnetwork/core'
import TileDocument from '@ceramicnetwork/stream-tile'

import IPFS from 'ipfs-core'
import dagJose from 'dag-jose'
import { convert } from 'blockcodec-to-ipld-format'

const format = convert(dagJose)

const ipfs = Ipfs.create({
    ipld: { formats: [format] },
})

const config: CeramicConfig = {}
const ceramic = await Ceramic.create(ipfs, config)

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
