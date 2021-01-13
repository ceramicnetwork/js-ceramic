![js-ceramic](https://uploads-ssl.webflow.com/5e4b58d7f08158ece0209bbd/5fa2c8f21ad1fe0422b1dd60_js-ceramic-small.png)

# js-ceramic
![ceramicnetwork](https://circleci.com/gh/ceramicnetwork/js-ceramic.svg?style=shield)
[![MIT license](https://img.shields.io/badge/License-MIT-blue.svg)](https://lbesson.mit-license.org/)
[![](https://img.shields.io/badge/Chat%20on-Discord-orange.svg?style=flat)](https://discord.gg/6VRZpGP)
[![Twitter](https://img.shields.io/twitter/follow/ceramicnetwork?label=Follow&style=social)](https://twitter.com/ceramicnetwork)

**js-ceramic** is a monorepo containing the TypeScript implementation of the Ceramic protocol. If you are unfamiliar with Ceramic, see the [website](https://ceramic.network) or [overview](https://github.com/ceramicnetwork/ceramic) for more information.

> **Project status**: **`Clay` testnet is now live. 🚀** </br>Clay is a decentralized public network ready for experimental application development and testing. It anchors documents on the Ethereum Ropsten and Rinkeby testnets. It is the last major milestone before `Fire` mainnet, which is under development and will launch in late Q1 2021. Documents published on Clay will *not* be portable to Fire.

## Clients

`js-ceramic` provides three JavaScript clients that offer different ways to interact with the Ceramic network.

| Client | Package | Description | Current Version |
| -- | -- | -- | -- |
| Core | @ceramicnetwork/core | Full JavaScript protocol implementation | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/core)](https://www.npmjs.com/package/@ceramicnetwork/core) |
| CLI | @ceramicnetwork/cli | CLI and HTTP daemon | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/cli)](https://www.npmjs.com/package/@ceramicnetwork/cli) |
| HTTP | @ceramicnetwork/http-client | HTTP client that can interact with a remote Ceramic daemon | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/http-client)](https://www.npmjs.com/package/@ceramicnetwork/http-client) |

> For performance reasons it is recommended that you use the HTTP client if you are building an application.

## Quick start

Learn the basics by setting up and interacting with the Ceramic CLI. [Quick start guide →](https://developers.ceramic.network/build/quick-start/)

## Installation and usage

Full documentation on installation and usage can be found on the [Ceramic documentation site →](https://developers.ceramic.network/build/installation/).

## Troubleshooting

- For questions, support, and discussions: [Join the Ceramic Discord](https://chat.idx.xyz)
- For bugs and feature requests: [Create an issue on Github](https://github.com/ceramicnetwork/js-ceramic/issues)

## Contributing
We are happy to accept small and large contributions, feel free to submit a pull request.

---

## Advanced

### Repo structure

This repository contains many different JavaScript packages.

| Package | Current Version | Description |
| -- | -- | -- |
| @ceramicnetwork/3id-did-resolver | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/3id-did-resolver)](https://www.npmjs.com/package/@ceramicnetwork/3id-did-resolver) | DID resolver for 3ID DID method |
| @ceramicnetwork/blockchain-utils-linking | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/blockchain-utils-linking)](https://www.npmjs.com/package/@ceramicnetwork/blockchain-utils-linking) | Signature utilities for blockchain wallets  |
| @ceramicnetwork/blockchain-utils-validation | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/blockchain-utils-validation)](https://www.npmjs.com/package/@ceramicnetwork/blockchain-utils-validation) | Signature verification utilities for blockchain wallets  |
| @ceramicnetwork/cli | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/cli)](https://www.npmjs.com/package/@ceramicnetwork/cli) | Ceramic CLI and http daemon |
| @ceramicnetwork/common | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/common)](https://www.npmjs.com/package/@ceramicnetwork/common) | Ceramic types and utilities |
| @ceramicnetwork/core | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/core)](https://www.npmjs.com/package/@ceramicnetwork/core) | Ceramic protocol implementation |
| @ceramicnetwork/docid | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/docid)](https://www.npmjs.com/package/@ceramicnetwork/docid) | Encoding and decoding document identifiers |
| @ceramicnetwork/doctype-caip10-link | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/doctype-caip10-link)](https://www.npmjs.com/package/@ceramicnetwork/doctype-caip10-link) | Interface for CAIP-10 link doctype |
| @ceramicnetwork/doctype-caip10-link-handler | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/doctype-caip10-link-handler)](https://www.npmjs.com/package/@ceramicnetwork/doctype-caip10-link-handler) | Handler for CAIP-10 link doctype |
| @ceramicnetwork/doctype-tile | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/doctype-tile)](https://www.npmjs.com/package/@ceramicnetwork/doctype-tile) | Interface for tile doctype |
| @ceramicnetwork/doctype-tile-handler | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/doctype-tile-handler)](https://www.npmjs.com/package/@ceramicnetwork/doctype-tile-handler) | Handler for tile doctype |
| @ceramicnetwork/http-client | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/http-client)](https://www.npmjs.com/package/@ceramicnetwork/http-client) | HTTP client that can interact with a remote Ceramic daemon |
| @ceramicnetwork/pinning-aggregation | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/pinning-aggregation)](https://www.npmjs.com/package/@ceramicnetwork/pinning-aggregation) |  |
| @ceramicnetwork/pinning-ipfs-backend | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/pinning-ipfs-backend)](https://www.npmjs.com/package/@ceramicnetwork/pinning-ipfs-backend) |  |
| @ceramicnetwork/pinning-powergate-backend | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/pinning-powergate-backend)](https://www.npmjs.com/package/@ceramicnetwork/pinning-powergate-backend) |  |
| key-did-resolver | [![npm](https://img.shields.io/npm/v/key-did-resolver)](https://www.npmjs.com/package/key-did-resolver) | DID resolver for did:key method |


### Development

#### Project setup
This project uses npm and lerna to manage packages and dependencies. To install dependencies for all packages in this repo:
```
$ npm run bootstrap
```
Then build all packages:
```
$ npm run build
```

#### Run tests

```
$ npm test
```

#### Creating a release
There are two types of releases that can be made, prereleases and regular releases. Before creating any releases, make sure you have an npm account (you can sign up at https://www.npmjs.com/), have signed into that account on the command line with `npm adduser`, and that the account has been added to the @ceramicnetwork org on npm.

##### Prerelease
```
$ npm run publish:next
```
In any branch you can run the command above, this will create a prerelease with the version `vx.x.x-alpha.n`. It will also create a local commit for this release. This commit doesn't have to be committed.


##### Release
```
$ npm run publish:latest
```
This command can only be run on the master branch, it will create a release commit and push it to master. It will also tag this commit and create a release on github. Make sure to set the [GH_TOKEN](https://github.com/lerna/lerna/tree/master/commands/version#--create-release-type) environment variable before you run this command.

---

## Maintainers

- Spencer ([@stbrody](https://github.com/stbrody))

## License

Fully open source and dual-licensed under MIT and Apache 2.
