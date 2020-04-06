![js-ceramic](https://uploads-ssl.webflow.com/5e4b58d7f08158ece0209bbd/5e6e45bfe64d7ddaabd58a1f_ceramicjsskinny.png)
[![MIT license](https://img.shields.io/badge/License-MIT-blue.svg)](https://lbesson.mit-license.org/)
[![](https://img.shields.io/badge/Chat%20on-Discord-orange.svg?style=flat)](https://discord.gg/6VRZpGP)
[![Twitter](https://img.shields.io/twitter/follow/ceramicnetwork?label=Follow&style=social)](https://twitter.com/ceramicnetwork)

# js-ceramic
Monorepo containing the Typescript implementation of the Ceramic protocol.

## Project Status - `Proof of Concept`

This implementation of the Ceramic protocol is only partial and is missing multiple critical components. As development moves forward this readme will be updated with the latest project status.

**Missing components:**
* Anchor records - currently anchor records are mocked

## Project Structure

This repo is made up of several different packages.

| Package | Current Version | Description |
| -- | -- | -- |
| @ceramicnetwork/ceramic-core | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/ceramic-core)](https://www.npmjs.com/package/@ceramicnetwork/ceramic-core) | Ceramic protocol implementation |
| @ceramicnetwork/ceramic-cli | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/ceramic-cli)](https://www.npmjs.com/package/@ceramicnetwork/ceramic-cli) | Ceramic CLI and http daemon |
| @ceramicnetwork/ceramic-http-client | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/ceramic-http-client)](https://www.npmjs.com/package/@ceramicnetwork/ceramic-http-client) | Ceramic http client that can interact with a remote Ceramic node |
| @ceramicnetwork/3id-did-resolver | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/3id-did-resolver)](https://www.npmjs.com/package/@ceramicnetwork/3id-did-resolver) | DID resolver for 3IDs |

## Development

### Project setup
This project uses npm and lerna to manage packages and dependencies. To install dependencies for all packages in this repo:
```
$ npm run bootstrap
```
Then build all packages:
```
$ npm run build
```

### Run tests

```
$ npm test
```

## Contributing
We are happy to accept small and large contributions. Make sure to check out the [Ceramic specifications](https://github.com/ceramicnetwork/specs) for details of how the protocol works.

## License
