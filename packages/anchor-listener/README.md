# Ceramic Anchor listener

![ceramicnetwork](https://circleci.com/gh/ceramicnetwork/js-ceramic.svg?style=shield)
[![MIT license](https://img.shields.io/badge/License-MIT-blue.svg)](https://lbesson.mit-license.org/)
[![](https://img.shields.io/badge/Chat%20on-Discord-orange.svg?style=flat)](https://discord.gg/6VRZpGP)
[![Twitter](https://img.shields.io/twitter/follow/ceramicnetwork?label=Follow&style=social)](https://twitter.com/ceramicnetwork)

## Getting started

### Installation

```
$ npm install @ceramicnetwork/anchor-listener
```

### Usage

```ts
import {
  createBlockProofsListener,
  createBlocksProofsLoader,
  createAncestorBlocksProofsLoader,
} from '@ceramicnetwork/anchor-listener'
import { take, timeout } from 'rxjs'

// Listen to new block events on the provider and load anchor proofs
const subsription = createBlockProofsListener({ chainId: 'eip155:1', confirmations: 20, provider: ... }).subscribe({
  next(event) {
    // event contains the `block` and `proofs`
  }
})
// Unsubscribe to stop listening
subscription.unsubscribe()

// Load proofs for a range of blocks
createBlocksProofsLoader({ chainId: 'eip155:1', fromBlock: 100, toBlock: 120, provider: ...  }).subscribe({
  next(event) {
    // event contains the `block` and `proofs`
  }
})

// Load proofs for blocks, walking up the parents until the expected ancestor hash is found
createAncestorBlocksProofsLoader({ chainId: 'eip155:1', initialBlock: 'latest', targetAncestorHash: '...', provider: ...  }).pipe(
  // Operators can be used to add stopping conditions
  take(50), // attempt to load maximum 50 blocks
  timeout(300_000), // timeout after 5 minutes
).subscribe({
  next(event) {
    // event contains the `block` and `proofs`
    // unless interrupted, `block.parentHash` will be `targetAncestorHash` in the last event
  }
})
```

## Development

Run tests:

```shell
npm test
```

Run linter:

```shell
npm run lint
```

## Contributing

We are happy to accept small and large contributions. Make sure to check out the
[Ceramic specifications](https://github.com/ceramicnetwork/ceramic/blob/main/SPECIFICATION.md)
for details of how the protocol works.

## License

MIT or Apache-2.0
