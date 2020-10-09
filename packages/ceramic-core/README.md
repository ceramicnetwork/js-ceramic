# Ceramic Core

> This package contains the implementation of the core Ceramic protocol. It's exposed using a simple JavaScript API.

## Getting started

### Installation
```
$ npm install @ceramicnetwork/ceramic-core
```

### Usage
```
import Ceramic from '@ceramicnetwork/ceramic-core'

import Ipfs from 'ipfs'
import dagJose from 'dag-jose'
import basicsImport from 'multiformats/cjs/src/basics-import.js'
import legacy from 'multiformats/cjs/src/legacy.js'

basicsImport.multicodec.add(dagJose)
const format = legacy(basicsImport, dagJose.name)

const ipfs = Ipfs.create({
    ipld: { formats: [format] },
})

const config: CeramicConfig = {}
const ceramic = await Ceramic.create(ipfs, config)

// create document example
const doctype1 = await ceramic.createDocument('tile', { content: { test: 123 } }, { applyOnly: true }) 
```

### Ceramic API

Complete Ceramic core API is available on [Ceramic API](https://github.com/ceramicnetwork/js-ceramic/blob/master/packages/ceramic-common/src/ceramic-api.ts).

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
