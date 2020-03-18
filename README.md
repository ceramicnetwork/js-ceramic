![js-ceramic](https://uploads-ssl.webflow.com/5e4b58d7f08158ece0209bbd/5e6e45bfe64d7ddaabd58a1f_ceramicjsskinny.png)
[![MIT license](https://img.shields.io/badge/License-MIT-blue.svg)](https://lbesson.mit-license.org/)
[![](https://img.shields.io/badge/Chat%20on-Discord-orange.svg?style=flat)](https://discord.gg/6VRZpGP)
[![Twitter](https://img.shields.io/twitter/follow/ceramicnetwork?label=Follow&style=social)](https://twitter.com/ceramicnetwork) 

# js-ceramic
Monorepo containing the Typescript implementation of the Ceramic protocol.

## Project Status - `Proof of Concept`

This implementation of the Ceramic protocol is only partial and is missing multiple critical components. As development moves forward this readme will be updated with the latest project status.

**Missing components:**
* Signature records - currently signatures are not implemented
* Anchor records - currently anchor records are mocked

## Project Structure

This repo is made up of several different packages.

* `/packages/ceramic-core` - Implementation of the core protocol
* `/packages/ceramic-cli` - An implementation of the cli and http daemon

