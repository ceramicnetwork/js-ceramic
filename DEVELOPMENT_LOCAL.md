# Local Development and Debug Environments

This document is a collection of resources that may be helpful to new ceramic developers.

## IDE configuration

### WebStorm

Open the js-ceramic project.  Set the Run/Debug configuration (under Run..Edit Configuration) as follows:

![](https://i.imgur.com/pZomhx0.png)

Note this uses the dev-unstable network, it is also possible to configure for clay testnet.  The Application parameters used in this example are

```
daemon --port 7007 --hostname 0.0.0.0 --network dev-unstable --anchor-service-api https://cas-dev.3boxlabs.com --debug true --ethereum-rpc https://rinkeby.infura.io/v3/b6685df41e1647c4be0046dfa62a020b
```
This configuration will allow running the ceramic daemon from the debugger and setting breakpoints in the daemon.

## Postman queries

Import this [Postman Queries](postman_queries.json) collection to see a sample of API calls that can be used to exercise and explore common endpoints.
