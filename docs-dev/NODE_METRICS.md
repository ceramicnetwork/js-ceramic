# Node Metrics

By default, Ceramic Nodes publish some limited metrics about their state to a model on the Ceramic Network.

## Metric Data Published

The data published is defined in the [@ceramicnetwork/node-metrics](https://www.npmjs.com/package/@ceramicnetwork/node-metrics) package.

Currently, this includes the following about the Ceramic node:

  - DID used to log into the Ceramic Anchor Service
  - IP address, if known
  - Peer ID
  - Ceramic Version
  - IPFS Version

As well as the following dynamic metrics published periodically (by default once per minute):

  - total Pinned streams
  - total Indexed models
  - current pending requests to CAS
  - mean Anchor request age
  - max Anchor request age
  - number of created requests in the last window
  - number of completed requests in the last window
  - number of errors in the last window
  - a sample of recent errors encountered

These metrics are very helpful for measuring the health of the network and addressing problems early.

## Disabling Node Metrics

However, if you would like to *disable* metrics from your node, you can easily do so!

Edit your ceramic daemon config file and set

` "metrics-publisher-enabled": false `

in the `metrics` section.  For more information about editing the ceramic daemon config see [ADVANCED_CONFIG](./ADVANCED_CONFIG.md)

  
