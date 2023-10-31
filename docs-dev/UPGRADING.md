# Upgrade a Ceramic Node

This document is a quick reference for minor version upgrades only, of a running ceramic node running in daemon mode with the package installed globally. 

1) ssh into the server running the ceramic daemon

2) upgrade the ceramic packages

`npm install -g @ceramicnetwork/cli`

If a specific version is desired, specify the normal way

`npm install -g @ceramicnetwork/cli@2.43.0`

Note that although this references the CLI package, the dependencies will cause the core and other server packages to update.

3) restart the ceramic daemon

Depending on how you have configured your server, this may involve a command such as

`systemctl stop ceramic && systemctl start ceramic`

Note this presumes that you have used systemctl startup scripts


