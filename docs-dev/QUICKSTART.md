# Launch a Ceramic Node

This document is a quick start for launching a Ceramic node.  It is recommended that node operators read the full documentation at [developers.ceramic.network](https://developers.ceramic.network/)

## PRE-REQUISITES

* Node `v20`
* npm `v10`

## Install Ceramic

`npm install -g @ceramicnetwork/cli`

## Launch a Ceramic node

This command will start a local JS Ceramic node connected to the Clay Testnet at https://localhost:7007

`ceramic daemon`

## Configuration

The default configuration file is located at 

`$HOME/.ceramic/daemon.config.json`

For more information about the configuration options see [Server Configurations](https://composedb.js.org/docs/0.5.x/guides/composedb-server/server-configurations)

For an example how to run in the cloud using Digital Ocean and Kubernetes see [Running in the Cloud](https://composedb.js.org/docs/0.5.x/guides/composedb-server/running-in-the-cloud) or refer to the [SimpleDeploy](SimpleDeploy) example ansible scripts.

## Develop on Ceramic using ComposeDB

See [ComposeDB on Ceramic](https://composedb.js.org/) for a guide on how to build interoperable applications on Ceramic using ComposeDB.
