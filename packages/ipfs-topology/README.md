# Ceramic topology

> Bootstrap IPFS topology for Ceramic network

## Getting started

### Installation
```
$ npm install @ceramicnetwork/ipfs-topology
```

### Usage

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