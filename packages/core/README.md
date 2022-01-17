# Ceramic Core
![ceramicnetwork](https://circleci.com/gh/ceramicnetwork/js-ceramic.svg?style=shield)
[![MIT license](https://img.shields.io/badge/License-MIT-blue.svg)](https://lbesson.mit-license.org/)
[![](https://img.shields.io/badge/Chat%20on-Discord-orange.svg?style=flat)](https://discord.gg/6VRZpGP)
[![Twitter](https://img.shields.io/twitter/follow/ceramicnetwork?label=Follow&style=social)](https://twitter.com/ceramicnetwork)

> This package contains the implementation of the core Ceramic protocol. It's exposed using a simple JavaScript API.

## Getting started

### Installation
```
$ npm install @ceramicnetwork/core
```

### Usage

See the [Ceramic developer site](https://developers.ceramic.network/) for more details about how to use this package.

```
import Ceramic from '@ceramicnetwork/core'
import TileDocument from '@ceramicnetwork/stream-tile'

import { create as createIPFS } from 'ipfs-core'
import * as dagJose from 'dag-jose'

const ipfs = createIPFS({
    ipld: { codecs: [dagJose] },
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
