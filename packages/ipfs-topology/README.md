# Ceramic topology
![ceramicnetwork](https://circleci.com/gh/ceramicnetwork/js-ceramic.svg?style=shield)
[![MIT license](https://img.shields.io/badge/License-MIT-blue.svg)](https://lbesson.mit-license.org/)
[![](https://img.shields.io/badge/Chat%20on-Discord-orange.svg?style=flat)](https://discord.gg/6VRZpGP)
[![Twitter](https://img.shields.io/twitter/follow/ceramicnetwork?label=Follow&style=social)](https://twitter.com/ceramicnetwork)

> Bootstrap IPFS topology for Ceramic network

## Getting started

### Installation
```
$ npm install @ceramicnetwork/ipfs-topology
```

### Usage

See the [ceramic developer site](https://developers.ceramic.network/) for more details about how to use this package.

```
import {IpfsTopology} from "@ceramicnetwork/ipfs-topology";

const topology = new IpfsTopology(ipfs, networkName)
// Sets up topology right away, and set it periodically
await topology.start()
```

## Contributing
We are happy to accept small and large contributions. Make sure to check out the [Ceramic specifications](https://github.com/ceramicnetwork/specs) for details of how the protocol works.

## License

Apache-2.0 or MIT
