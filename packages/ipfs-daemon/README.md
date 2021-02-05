# Ceramic IPFS Daemon

> Wraps js-ipfs instance with dag-jose codec enabled.

## Getting started

### Installation
```
$ npm install @ceramicnetwork/ipfs-daemon
```

### Usage

```typescript
import {IpfsDaemon} from "@ceramicnetwork/ipfs-daemon";

// All the parameters are optional here
// If not set, they are given defaults or got read from process environment variables
const ipfsDaemon = await IpfsDaemon.create({
    ipfsDhtServerMode: IPFS_DHT_SERVER_MODE, // DHT Server
    ipfsEnableApi: true, // Enable IPFS API
    ipfsEnableGateway: true, // Enable IPFS Gateway
    useCentralizedPeerDiscovery: true, // Connect to bootstrap nodes
    ceramicNetwork: 'testnet-clay' // Bootstrap nodes are selected per network
})
await ipfsDaemon.start()
const ipfs = ipfsDaemon.ipfs
await ipfsDaemon.stop()
```

## Contributing
We are happy to accept small and large contributions. Make sure to check out the [Ceramic specifications](https://github.com/ceramicnetwork/specs) for details of how the protocol works.

## License

Apache-2.0 or MIT