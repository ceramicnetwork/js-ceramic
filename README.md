![js-ceramic](https://uploads-ssl.webflow.com/5e4b58d7f08158ece0209bbd/5fa2c8f21ad1fe0422b1dd60_js-ceramic-small.png)

# js-ceramic

![ceramicnetwork](https://circleci.com/gh/ceramicnetwork/js-ceramic.svg?style=shield)
[![MIT license](https://img.shields.io/badge/License-MIT-blue.svg)](https://lbesson.mit-license.org/)
[![](https://img.shields.io/badge/Chat%20on-Discord-orange.svg?style=flat)](https://discord.gg/6VRZpGP)
[![Twitter](https://img.shields.io/twitter/follow/ceramicnetwork?label=Follow&style=social)](https://twitter.com/ceramicnetwork)

**js-ceramic** is a monorepo containing the TypeScript implementation of the Ceramic protocol. If you are unfamiliar with Ceramic, see the [website](https://ceramic.network) or [overview](https://developers.ceramic.network/learn/welcome/) for more information.

> **Project status**: **Access  the Ceramic mainnet. 🚀** <br/>
> With the launch of [ComposeDB Beta](https://blog.ceramic.network/composedb-is-live-on-ceramic-mainnet/), it is now much easier to access Ceramic mainnet for building applications.
> Developers can now onboard their node to Ceramic mainnet in under 5 minutes without needing to contact any community members. Check out [this guide](https://developers.ceramic.network/docs/composedb/guides/composedb-server/access-mainnet)
> to learn more.


## Clients

`js-ceramic` provides three JavaScript clients that offer different ways to interact with the Ceramic network.

| Client | Package                     | Description                                                | Current Version                                                                                                               |
| ------ | --------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Core   | @ceramicnetwork/core        | Full JavaScript protocol implementation                    | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/core)](https://www.npmjs.com/package/@ceramicnetwork/core)               |
| CLI    | @ceramicnetwork/cli         | CLI and HTTP daemon                                        | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/cli)](https://www.npmjs.com/package/@ceramicnetwork/cli)                 |
| HTTP   | @ceramicnetwork/http-client | HTTP client that can interact with a remote Ceramic daemon | [![npm](https://img.shields.io/npm/v/@ceramicnetwork/http-client)](https://www.npmjs.com/package/@ceramicnetwork/http-client) |

> For performance reasons it is recommended that you use the HTTP client if you are building an application.


## Installation and usage

Full protocol documentation can be found on the [Ceramic documentation site →](https://developers.ceramic.network/protocol/overview/).

[Quickstart to run a ceramic node](docs-dev/QUICKSTART.md)

### Upgrading

[Upgrade a ceramic node to latest version](docs-dev/UPGRADING.md)

## Troubleshooting

- For technical questions and support: [Join the Ceramic Forum](https://forum.ceramic.network/)
- For bugs and feature requests: [Create an issue on Github](https://github.com/ceramicnetwork/js-ceramic/issues)

## Contributing

We are happy to accept small and large contributions, feel free to make a suggestion or submit a pull request.

Check out the [Development](./DEVELOPMENT.md) section to learn how to navigate the code in this repo.

## Maintainers

- Spencer ([@stbrody](https://github.com/stbrody))

## License

Fully open source and dual-licensed under MIT and Apache 2.

<img referrerpolicy="no-referrer-when-downgrade" src="https://static.scarf.sh/a.png?x-pxid=268ff62e-d125-4cb9-9b28-d6e18ac93cea" />
