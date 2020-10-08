# Ceramic CLI

> A command line interface that allows you to interact with the Ceramic protocol.

## Getting started

### Installation
To install the ceramic cli globally you can run:
```
$ npm install -g @ceramicnetwork/ceramic-cli
```

### Usage
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
