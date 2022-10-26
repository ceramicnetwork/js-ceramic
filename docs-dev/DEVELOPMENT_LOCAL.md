# Local Development and Debug Environments

This document is a collection of resources that may be helpful to new ceramic developers.  To get you up and running quickly, the following steps should address all major "gotchas" to get a vanilla dev machine up and running as quickly as possible.


## IDE configuration

### WebStorm

Open the js-ceramic project.  Set the Run/Debug configuration template (under Run..Edit Configuration..Edit Configuration Templates) as follows:

![edit configuration templates](https://user-images.githubusercontent.com/798887/169563176-f6e15e71-8bf3-4f7f-a5d4-ce90732067e1.png)


The Application parameters used in this example are:

```
daemon --port 7007 --hostname 0.0.0.0 --network dev-unstable --anchor-service-api https://cas-dev.3boxlabs.com --debug true --ethereum-rpc https://rinkeby.infura.io/v3/b6685df41e1647c4be0046dfa62a020b
```
This configuration will allow running the ceramic daemon from the debugger and setting breakpoints in the daemon.

__*Note*__ that using `--network dev-unstable` will cause your node connecting to unstable development ceramic network. You can also make it connect to clay testnet with `--network clay-testnet` or, if you want your node to be completely isolated from any network, without the need to run a local CAS service, you can also use `--network inmemory`.


## PRE-REQUISITES

* Node `v16`
* npm `v8`

### macOS specific (11.x+)

* Install XCode & Command Line tools: `xcode-select --install`

* Install [Brew](https://brew.sh)

`brew install npm`

INFO: For switching between node versions one could use [n](https://github.com/tj/n), [fnm](https://github.com/Schniz/fnm) or [nvm](https://github.com/nvm-sh/nvm)



## BUILDING & DEBUGGING

### Running the Daemon

CLI helpers commands on how to start up environment and debug [local code base](https://github.com/ceramicnetwork/js-ceramic).  

Compile all packages/full library:  `npm run clean && npm install && npm run build`

Run locally compiled ceramic code: `cd ~/js-ceramic/packages/cli/bin; node ceramic.js daemon`

*__*INFO*__: this will invoke the daemon with the default configuration values found in `~/.ceramic/daemon.config.json`* 

Run docker with local code base: `docker build -t js-ceramic-debug::latest -f Dockerfile.daemon .`

Run on [Clayground](https://github.com/ceramicnetwork/clayground) (full environment containerized): `docker run --rm --name ceramic -p 7007:7007 ceramicnetwork/js-ceramic:dev daemon --port "7007" --hostname 0.0.0.0 --network dev-unstable --anchor-service-api https://cas-dev.3boxlabs.com --debug true --ethereum-rpc https://rinkeby.infura.io/v3/b6685df41e1647c4be0046dfa62a020b`

### Postman Collection

Import this [Postman Collection](postman_collection.json) of queries to see a sample of API calls that can be used to exercise and explore common endpoints.

By default the collection connects to the public dev network, but you can easily overwrite the local variables to point to your locally running daemon by updating `ceramic_hostname` to `http://localhost:7007`.


## PACKAGES OVERVIEW

`3id-did-resolver` - 3Box ID

`blockchain-utils-*`

* `linking` - client side app devs (that would like to auth ceramic using specific blockchains / cosmos, eth, etc.)

* `validation` - contract part - eth accounts, against blockchain

Responsible for creation and validation. Once we link an account you have to request the signature from your blockchain.

etherum.ts/createLink(did) -> sign

`canary-integration` - standalone test (capability, tile & tile update)

`cli` - package for the ceramic cli (mostly daemon) -> see examples at the beginning how to start it up
`common` - helper functions

`core` - code for ceramic node (invoked via ceramic daemon) // internal http and core API
* `store` - pinning and level state store; snapshot of a stream state
* `state-management` - stream is mutable; check on state progression. Some streams are better kept in memory vs. some street could be offloaded to storage
* `pubsub` - node to node communication - push based messaging; Mostly implemented as Observable
* `anchor` - anchoring or validating it inside the ceramic node (

`http-client` - with any remote node - http endpoint -> connect to a node

`ipfs-daemon` - DEPRECATED

`ipfs-topology` - mechanism to safely bootstrap connections to other ceramic nodes on the network

`pinning-*` - all for pinning

* `powergate` - 3BoxLabs integration with 3rd party SPI for $FILECOIN support (worked at some point but not sure anymore)

* `crust` - crust.network - alternative to filecoin

* `aggregation` -> allows one to pin data to multiple backends (IPFS, Arweave, Crust, Filecoin, etc.) simultaneously

`stream-caip10-link` & `*-stream-tile` - immutable ipfs record / creation

`stream-tile` - [Tile Stream Type](https://developers.ceramic.network/docs/advanced/standards/stream-programs/tile-document/) stores a mutable JSON document with schema validation, providing similar functionality as a NoSQL document

`stream-tile-handler` - verifies public commits (runs on backend)

`streamid` -  pure reference to host stream

`commitid` - references particular state / IPFS record in the stream evolution



## TROUBLESHOOTING

### Python not found

`Error: Can't find Python executable "python", you can set the PYTHON env variable.` when installing [JS HTTP CLIENT](https://developers.ceramic.network/build/javascript/http/)

*By default macOS does not ship with an alias for `python` which breaks the standard ceramic npm
package install. Install `pyenv` and add it to your local `PATH` prior to installation. You can skip this step if you are only working with the local codebase.*

`$ brew install pyenv`

To ensure that both `python` & `python3` commands work properly, add `pyenv` to your PATH:

**ZSHR (MacOS Default):** `$ echo "export PATH=\"\${HOME}/.pyenv/shims:\${PATH}\"" >> ~/.zshrc`

**BASH:** `$ echo "export PATH=\"\${HOME}/.pyenv/shims:\${PATH}\"" >> ~/.bashrc`

`$ reset` - OR - restart Terminal window

## MISCELLANY

*optionally add additional useful aliases for grepping in the project directory:*
```
alias ggrep='grep -r --exclude-dir node_modules --exclude package.json --exclude package-lock.json'
alias tgrep='grep -r --exclude-dir node_modules --include=\*.ts --exclude package.json --exclude package-lock.json'
```
