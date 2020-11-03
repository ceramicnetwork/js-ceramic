![js-ceramic](https://uploads-ssl.webflow.com/5e4b58d7f08158ece0209bbd/5e6e45bfe64d7ddaabd58a1f_ceramicjsskinny.png)
![ceramicnetwork](https://circleci.com/gh/ceramicnetwork/js-ceramic.svg?style=shield)
[![MIT license](https://img.shields.io/badge/License-MIT-blue.svg)](https://lbesson.mit-license.org/)
[![](https://img.shields.io/badge/Chat%20on-Discord-orange.svg?style=flat)](https://discord.gg/6VRZpGP)
[![Twitter](https://img.shields.io/twitter/follow/ceramicnetwork?label=Follow&style=social)](https://twitter.com/ceramicnetwork)

# js-ceramic
Monorepo containing the Typescript implementation of the Ceramic protocol.

## Project Status - `Clay testnet`

This implementation is ready for testing, but there are still a few things left before the Fire livenet. See the [roadmap](https://github.com/ceramicnetwork/ceramic/issues/19).

## Project Structure

This repo is made up of several different packages.

| Package | Current Version | Description |
| -- | -- | -- |
| @ceramicnetwork/ceramic-core | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/ceramic-core)](https://www.npmjs.com/package/@ceramicnetwork/ceramic-core) | Ceramic protocol implementation |
| @ceramicnetwork/ceramic-cli | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/ceramic-cli)](https://www.npmjs.com/package/@ceramicnetwork/ceramic-cli) | Ceramic CLI and http daemon |
| @ceramicnetwork/ceramic-http-client | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/ceramic-http-client)](https://www.npmjs.com/package/@ceramicnetwork/ceramic-http-client) | Ceramic http client that can interact with a remote Ceramic node |
| @ceramicnetwork/ceramic-common | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/ceramic-common)](https://www.npmjs.com/package/@ceramicnetwork/ceramic-common) | Ceramic types and utilities |
| @ceramicnetwork/doctype-caip10-link | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/doctype-caip10-link)](https://www.npmjs.com/package/@ceramicnetwork/doctype-caip10-link) | Ceramic caip10 link doctype |
| @ceramicnetwork/doctype-tile | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/doctype-tile)](https://www.npmjs.com/package/@ceramicnetwork/doctype-tile) | Ceramic tile doctype |
| @ceramicnetwork/3id-did-resolver | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/3id-did-resolver)](https://www.npmjs.com/package/@ceramicnetwork/3id-did-resolver) | DID resolver for 3IDs |
| @ceramicnetwork/key-did-resolver | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/key-did-resolver)](https://www.npmjs.com/package/@ceramicnetwork/key-did-resolver) | did:key method resolver |

## APIs
[APIs documentation](https://ceramicnetwork.github.io/js-ceramic/api/)


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

### Creating a release
There are two types of releases that can be made, prereleases and regular releases.

#### Prerelease
```
$ npm run publish:next
```
In any branch you can run the command above, this will create a prerelease with the version `vx.x.x-alpha.n`. It will also create a local commit for this release. This commit doesn't have to be committed.


#### Release
```
$ npm run publish:latest
```
This command can only be run on the master branch, it will create a release commit and push it to master. It will also tag this commit and create a release on github. Make sure to set the [GH_TOKEN](https://github.com/lerna/lerna/tree/master/commands/version#--create-release-type) environment variable before you run this command.

## Contributing
We are happy to accept small and large contributions. Make sure to check out the [Ceramic specifications](https://github.com/ceramicnetwork/specs) for details of how the protocol works.


## Maintainers
[@simonovic86](https://github.com/simonovic86)

## License
