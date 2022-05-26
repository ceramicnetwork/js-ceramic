# Local Development and Debug Environments

This document is a collection of resources that may be helpful to new ceramic developers.

## IDE configuration

### WebStorm

Open the js-ceramic project.  Set the Run/Debug configuration template (under Run..Edit Configuration..Edit Configuration Templates) as follows:

![edit configuration templates](https://user-images.githubusercontent.com/798887/169563176-f6e15e71-8bf3-4f7f-a5d4-ce90732067e1.png)


Note this uses the dev-unstable network, it is also possible to configure for clay testnet.  The Application parameters used in this example are

```
daemon --port 7007 --hostname 0.0.0.0 --network dev-unstable --anchor-service-api https://cas-dev.3boxlabs.com --debug true --ethereum-rpc https://rinkeby.infura.io/v3/b6685df41e1647c4be0046dfa62a020b
```
This configuration will allow running the ceramic daemon from the debugger and setting breakpoints in the daemon.


## Local Development

*macOS pre-requisits (11.x+):*

* Install XCode & Command Line tools: `xcode-select --install`

* Install Brew: https://brew.sh

`brew install pyenv`

Add pyenv to your PATH so that you can reference python (not python3):

`$ echo "export PATH=\"\${HOME}/.pyenv/shims:\${PATH}\"" >> ~/.zshrc`

`reset` - OR - restart Terminal window


CLI helpers commands on how to start up environment and debug local code base.  

*Compile full library:*

`npm run clean && npm install && npm run build`

*How to run locally compiled ceramic code:*

`cd ~/js-ceramic/packages/cli/bin`

`node ceramic.js daemon`

*Run docker with local code base:*

`docker build -t js-ceramic-debug::latest -f Dockerfile.daemon .`

*Clayground (full environment containerized - https://github.com/ceramicnetwork/clayground)*

`docker run --rm --name ceramic -p 7007:7007 ceramicnetwork/js-ceramic:dev daemon --port "7007" --hostname 0.0.0.0 --network dev-unstable --anchor-service-api https://cas-dev.3boxlabs.com --debug true --ethereum-rpc https://rinkeby.infura.io/v3/b6685df41e1647c4be0046dfa62a020b`


## Postman Collection

Import this [Postman Collection](postman_collection.json) of queries to see a sample of API calls that can be used to exercise and explore common endpoints.


## Packages Overview

`3id-did-resolver` - 3Box ID
`key-did-resolver` - blockchain public keys

`blockchain-utils-*`

* `linking` - client side app devs (that would like to auth ceramic using specific blockchains / cosmos, eth, etc.)

* `validation` - contract part - eth accounts, against blockchain

responsible for creation and validation. Once we link an account you have to request the signature from your blockchain.
Responsible

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

`ipfs-topology` - Bootstrap Mechanism

`pinning-*` - all for pinning

* `powergate` - 3BoxLabs integration with 3rd party SPI for $FILECOIN support (worked at some point but not sure anymore)

* `crust` - crust.network - alternative to filecoin

* `aggregation` -> use your own IPFS node


`pkh-did-resolver` - we do accept blockchain signatures (just a fancy name)

`stream-caip10-link` & `*-stream-tile` - immutable ipfs record / creation

`stream-tile` - JSON descriptor

`stream-tile-handler` - verifies public commits (runs on backend)

`streamid` -  pure reference to host stream

`commitid` - references particular state / IPFS record in the stream evolution
