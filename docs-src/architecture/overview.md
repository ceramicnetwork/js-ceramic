# Overview

This document provides a basic overview of how js-ceramic is implemented. It goes through some of the high-level apis of Ceramic and how it communicates with some external components. This is by no means comprehensive and will be expanded over time.

## Ceramic Api

CeramicApi is an interface that both CeramicCore and CeramicHttpClient implements. It provides all the methods needed by a developer to build on top of Ceramic. An instance of CeramicApi allows only one user to be set at a time, using the [DID](https://github.com/ceramicnetwork/js-did) interface. The main methods that this interface provides are `createDocument`, and `loadDocument` which both return *Stream* instances.

![CeramicApi](media://ceramic-api.png)

**CeramicCore** is the implementation of the core protocol and can be run both in nodejs as well as in browser environments. It verifies every document that it loads locally and does all network communication over libp2p.

**CeramicHttpClient** provides a way to interact with the Ceramic protocol without having to actually run the entire protocol locally. It delegates document validation to a remote *CeramicCore* node, however users can author updates to documents from the http client, just as in *CeramicCore*.

## DID Provider

The DID provider ([EIP2844](https://eips.ethereum.org/EIPS/eip-2844)) is the interface used to communicate between the *CeramicApi* and wallets. This interface can be implemented by any DID method and provides an agnostic way to sign and decrypt data based on DIDs. Each CeramicApi instance can have one DID provider associated with it at any given time (see [section below](#http-client-and-daemon) for how to have multiple users associated with one ceramic node). This abstraction allows for separation between the wallet and the application that uses ceramic since the DID provider is a json-rpc interface that can be used over a wide variety of transports.

![did-provider](media://wallets.png)

For example, in the figure above there is a wallet instance that is being run within 3ID connect, which is an iframe. A web application can communicate with the 3ID Connect iframe using the *postMessage* api which is used to pass json-rpc messages between the wallet and the application. CeramicApi and IdentityWallet can of course also be used together within the same process.

## Http Client and Daemon

As mentioned above both CeramicCore and CeramicHttpClient implements the CeramicApi abstraction. In practice the CeramicHttpClient needs to talk to a CeramicCore node to actually read and write to the network. In order to facilitate this the CeramicDaemon implements an http api which the client can consume. The daemon is wrapped together with CeramicCore in the CeramicCli package, which provides a basic command line interface for interacting with Ceramic.

![http-clients](media://http-clients.png)

As can be observed in the figure above multiple http clients can interact with the same daemon. This allows for multiple users on different machines to rely on the same http daemon while only authorizing their own DID to have write access. The daemon doesn't really have to care about which users are authenticated since it only reads from, and passes signed updates along to the CeramicCore instance.
