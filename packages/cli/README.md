# Ceramic CLI
![ceramicnetwork](https://circleci.com/gh/ceramicnetwork/js-ceramic.svg?style=shield)
[![MIT license](https://img.shields.io/badge/License-MIT-blue.svg)](https://lbesson.mit-license.org/)
[![](https://img.shields.io/badge/Chat%20on-Discord-orange.svg?style=flat)](https://discord.gg/6VRZpGP)
[![Twitter](https://img.shields.io/twitter/follow/ceramicnetwork?label=Follow&style=social)](https://twitter.com/ceramicnetwork)

> A command line interface that allows you to interact with the Ceramic protocol.

## Getting started

### Installation
To install the ceramic cli globally you can run:
```
$ npm install -g @ceramicnetwork/cli
```

### Usage

See the [Ceramic developer site](https://developers.ceramic.network/) for more details about how to use this package.

To get an overview of the available commands run:
```
$ ceramic -h
```

To start an instance of the Ceramic daemon, make sure you have ipfs running locally and execute:
```
$ ceramic daemon
```

## Development


### Not yet implemented commands


#### `ceramic user did`
Show the DID of the user.

#### `ceramic user sign <payload>`
Ask the user to sign a given payload.

#### `ceramic user encrypt <payload>`
Ask the user to encrypt a given payload.

#### `ceramic user decrypt <JWE | CWE>`
Ask the user to decrypt a given JWE or CWE.


## Contributing
We are happy to accept small and large contributions. Make sure to check out the [Ceramic specifications](https://github.com/ceramicnetwork/specs) for details of how the protocol works.

## License
