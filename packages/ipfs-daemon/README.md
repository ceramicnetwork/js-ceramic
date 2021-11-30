# Ceramic IPFS Daemon

> Wraps js-ipfs instance with dag-jose codec enabled.

## Getting started

The daemon can be run with Node.js or Docker.

### Using Node.js
You can install this package globally and run the binary from your shell
```shell
npm install -g @ceramicnetwork/ipfs-daemon
export CERAMIC_NETWORK=testnet-clay # or another Ceramic network
ipfs-daemon
```

or use it in a Node.js application
```shell
npm install @ceramicnetwork/ipfs-daemon
```
```typescript
import {IpfsDaemon} from "@ceramicnetwork/ipfs-daemon";

// All the parameters are optional here
// If not set, they are given defaults or got read from process environment variables
const ipfsDaemon = await IpfsDaemon.create({
    ipfsDhtServerMode: IPFS_DHT_SERVER_MODE, // DHT Server
    ipfsEnableApi: true, // Enable IPFS API
    ipfsEnableGateway: true, // Enable IPFS Gateway
    useCentralizedPeerDiscovery: IPFS_USE_CENTRALIZED_PEER_DISCOVERY, // Connect to bootstrap nodes
    ceramicNetwork: 'testnet-clay' // Bootstrap nodes are selected per network
})
await ipfsDaemon.start()
const ipfs = ipfsDaemon.ipfs
await ipfsDaemon.stop()
```

### Using Docker
Public builds of the image [Dockerfile.ipfs-daemon](../../Dockerfile.ipfs-daemon) are hosted here: [ceramicnetwork/ipfs-daemon on Docker Hub](https://hub.docker.com/r/ceramicnetwork/ipfs-daemon)
```
docker pull ceramicnetwork/ipfs-daemon
docker run -p 5011:5011 -e CERAMIC_NETWORK=testnet-clay ceramicnetwork/ipfs-daemon
```

## Contributing
We are happy to accept small and large contributions. Make sure to check out the [Ceramic specifications](https://github.com/ceramicnetwork/specs) for details of how the protocol works.

## License

Apache-2.0 or MIT
