# Development
> Getting started with development on js-ceramic

## Project setup
First clone the repo:
```
$ git clone git@github.com:ceramicnetwork/js-ceramic.git
$ cd js-ceramic
```
This project uses npm and lerna to manage packages and dependencies. To install dependencies for all packages in this repo:
```
$ npm install
```
Then build all packages:
```
$ npm run build
```

## Run tests
You can run all tests at the top level,
```
$ npm test
```
If you only want to test a specific package just `cd` into the specific package folder and run the same command as above.

## Debugging and Local Development

See [DEVELOPMENT_LOCAL.md](docs-dev/DEVELOPMENT_LOCAL.md)


## Repo structure

This repository contains many different JavaScript packages. The main reason for this is to keep things modular so that developers only need to pull in exactly the packages that they need.

| Package | Current Version | Description |
| -- | -- | -- |
| [@ceramicnetwork/3id-did-resolver](https://github.com/ceramicnetwork/js-ceramic/tree/develop/packages/3id-did-resolver) | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/3id-did-resolver)](https://www.npmjs.com/package/@ceramicnetwork/3id-did-resolver) | DID resolver for 3ID DID method |
| [@ceramicnetwork/blockchain-utils-linking](https://github.com/ceramicnetwork/js-ceramic/tree/develop/packages/blockchain-utils-linking) | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/blockchain-utils-linking)](https://www.npmjs.com/package/@ceramicnetwork/blockchain-utils-linking) | Signature utilities for blockchain wallets  |
| [@ceramicnetwork/blockchain-utils-validation](https://github.com/ceramicnetwork/js-ceramic/tree/develop/packages/blockchain-utils-validation) | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/blockchain-utils-validation)](https://www.npmjs.com/package/@ceramicnetwork/blockchain-utils-validation) | Signature verification utilities for blockchain wallets  |
| [@ceramicnetwork/cli](https://github.com/ceramicnetwork/js-ceramic/tree/develop/packages/cli) | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/cli)](https://www.npmjs.com/package/@ceramicnetwork/cli) | Ceramic CLI and http daemon |
| [@ceramicnetwork/common](https://github.com/ceramicnetwork/js-ceramic/tree/develop/packages/common) | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/common)](https://www.npmjs.com/package/@ceramicnetwork/common) | Ceramic types and utilities |
| [@ceramicnetwork/core](https://github.com/ceramicnetwork/js-ceramic/tree/develop/packages/core) | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/core)](https://www.npmjs.com/package/@ceramicnetwork/core) | Ceramic protocol implementation |
| [@ceramicnetwork/docid](https://github.com/ceramicnetwork/js-ceramic/tree/develop/packages/docid) | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/docid)](https://www.npmjs.com/package/@ceramicnetwork/docid) | Encoding and decoding document identifiers |
| [@ceramicnetwork/doctype-caip10-link](https://github.com/ceramicnetwork/js-ceramic/tree/develop/packages/doctype-caip10-link) | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/doctype-caip10-link)](https://www.npmjs.com/package/@ceramicnetwork/doctype-caip10-link) | Interface for CAIP-10 link doctype |
| [@ceramicnetwork/doctype-caip10-link-handler](https://github.com/ceramicnetwork/js-ceramic/tree/develop/packages/doctype-caip10-link-handler) | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/doctype-caip10-link-handler)](https://www.npmjs.com/package/@ceramicnetwork/doctype-caip10-link-handler) | Handler for CAIP-10 link doctype |
| [@ceramicnetwork/doctype-tile](https://github.com/ceramicnetwork/js-ceramic/tree/develop/packages/doctype-tile) | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/doctype-tile)](https://www.npmjs.com/package/@ceramicnetwork/doctype-tile) | Interface for tile doctype |
| [@ceramicnetwork/doctype-tile-handler](https://github.com/ceramicnetwork/js-ceramic/tree/develop/packages/doctype-tile-handler) | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/doctype-tile-handler)](https://www.npmjs.com/package/@ceramicnetwork/doctype-tile-handler) | Handler for tile doctype |
| [@ceramicnetwork/http-client](https://github.com/ceramicnetwork/js-ceramic/tree/develop/packages/http-client) | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/http-client)](https://www.npmjs.com/package/@ceramicnetwork/http-client) | HTTP client that can interact with a remote Ceramic daemon |
| [@ceramicnetwork/pinning-aggregation](https://github.com/ceramicnetwork/js-ceramic/tree/develop/packages/pinning-aggregation) | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/pinning-aggregation)](https://www.npmjs.com/package/@ceramicnetwork/pinning-aggregation) | Module that enables document pinning with multiple pinning backends |
| [@ceramicnetwork/pinning-ipfs-backend](https://github.com/ceramicnetwork/js-ceramic/tree/develop/packages/pinning-ipfs-backend) | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/pinning-ipfs-backend)](https://www.npmjs.com/package/@ceramicnetwork/pinning-ipfs-backend) | Pinning backend for external ipfs node |
| [@ceramicnetwork/pinning-powergate-backend](https://github.com/ceramicnetwork/js-ceramic/tree/develop/packages/pinning-powergate-backend) | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/pinning-powergate-backend)](https://www.npmjs.com/package/@ceramicnetwork/pinning-powergate-backend) | Pinning backend for filecoin |


## Creating a release
This repo uses lerna to make releases of all packages which have been changed. There are two types of releases that can be made, release candidates and regular releases. Before creating any releases, make sure you have an npm account (you can sign up at https://www.npmjs.com/), have signed into that account on the command line with `npm adduser`, and that the account has been added to the @ceramicnetwork org on npm.

### Validating the release build
After merging the changes you want to release into the relevant branch (main or release-candidate), you should build and verify the docker image before triggering the release to make sure nothing is broken.

First, install Dagger:
`curl -L https://dl.dagger.io/dagger/install.sh`

Then, in `js-ceramic` root:
```
dagger project init
dagger project update
dagger project update github.com/3box/pipeline-tools@v0.2.0
dagger do verify --log-format=plain -p cue.mod/pkg/github.com/3box/pipeline-tools/ci/plans/ceramic.cue
dagger do testJs --log-format=plain -p cue.mod/pkg/github.com/3box/pipeline-tools/ci/plans/ceramic.cue
dagger do testGo --log-format=plain -p cue.mod/pkg/github.com/3box/pipeline-tools/ci/plans/ceramic.cue
```

### Release candidate
```
export GH_TOKEN=<your github token>       # You need a valid github api token set to create the release on github
$ git checkout release-candidate
$ git merge origin develop                # merge in recent changes from develop branch
$ npm install && npm run build            # Make sure to build Ceramic and install current dependencies before releasing
$ npm adduser                             # login to npm account
$ npm run publish:release-candidate       # create and publish the release
$ git checkout develop
$ git merge origin release-candidate      # Merge the new release commit back into the develop branch
$ git push origin develop
```
The main step here is `npm run publish:release-candidate`, which creates a _pre-release_ on NPM by bumping the minor version (e.g. `2.1.9` => `2.2.0-rc.0`). It also creates a git commit with updated package versions as well as their corresponding git tags on github. Make sure to set the [GH_TOKEN](https://github.com/lerna/lerna/tree/master/commands/version#--create-release-type) environment variable and log into npm before you run this command.

Afterwards, don't forget to make a post in the #releases channel of the Ceramic discord to notify the community about the new release candidate!

### Full release
```
export GH_TOKEN=<your github token>       # You need a valid github api token set to create the release on github
$ git checkout master
$ git merge origin release-candidate      # merge in most recent release candidate
$ npm install && npm run build            # Make sure to build Ceramic and install current dependencies before releasing
$ npm adduser                             # login to npm account
$ npm run publish:release                  # create and publish the release
$ git checkout release-candidate
$ git merge origin master                 # Merge the new release commit back into the release-candidate branch
$ git push origin release-candidate
$ git checkout develop
$ git merge origin master                 # Merge the new release commit back into the develop branch
$ git push origin develop
```
The main step here is `npm run publish:release`, which creates a full release on NPM by graduating the minor version (e.g. `2.2.0-rc.0` => `2.2.0`). It also creates a git commit with updated package versions as well as their corresponding git tags on github. Make sure to set the [GH_TOKEN](https://github.com/lerna/lerna/tree/master/commands/version#--create-release-type) environment variable and log into npm before you run this command.

Afterwards, don't forget to make a post in the #releases channel of the Ceramic discord to notify the community about the new release!

### Hotfix release
This option is necessary only when an urgent fix needs to be released to the community before we're ready to do a full release or RC. Note that whatever branch it's run against will be released as a full release, so it should generally be done from a recent fork of `main`. This branch MUST NOT be merged back into the `main` branch.
```
export GH_TOKEN=<your github token>       # You need a valid github api token set to create the release on github
$ git checkout <hotfix branch>
$ npm install && npm run build            # Make sure to build Ceramic and install current dependencies before releasing
$ npm adduser                             # login to npm account
$ npm run publish:hotfix                  # create and publish the release
```
The main step here is `npm run publish:hotfix`, which creates a full release on NPM by bumping the patch version (e.g. `2.1.9` => `2.1.10`). It also creates a git commit with updated package versions as well as their corresponding git tags on github. Make sure to set the [GH_TOKEN](https://github.com/lerna/lerna/tree/master/commands/version#--create-release-type) environment variable and log into npm before you run this command.

After the release, don't forget to make a post in the #releases channel of the Ceramic discord to notify the community about the new release!
