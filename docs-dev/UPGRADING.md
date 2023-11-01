# Upgrade a Ceramic Node - Example

In general, upgrading a ceramic node involves installing a newer `@ceramicnetwork/cli` package.  The exact steps to follow will depend on how you have configured your ceramic server.  

For example, if you are using systemd and have installed the package globally, you would follow these steps:

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


