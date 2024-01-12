# Advanced Configuration Options

For general information and recommendations about configuring a ceramic node please see [Server Configurations](https://developers.ceramic.network/docs/composedb/guides/composedb-server/server-configurations)

Note you do NOT need to set all options manually, the default installation provides the minimal requirements.  

Do NOT copy the following code it is for reference only.

## Complete list of configuration options
```
{
    "anchor": {
        "anchor-service-url": STRING // the URL of the Ceramic Anchor Service
        "auth-method": STRING        // the auth method used to access the Ceramic Anchor Service
        "ethereum-rpc-url": STRING   // the RPC URL to query ethereum transactions
    },
    "http-api": {
        "admin-dids": ARRAY               // array of string DIDs with access to Admin API
        "cors-allowed-origins": [ ".*" ]  // allow all origins
        "hostname": STRING                // hostname to bind and listen on
        "port": INTEGER                   // port to listen on
    },
    "indexing": {
        "allow-queries-before-historical-sync": false  // set to true to allow queries without sync
        "db": STRING                                   // URL to the indexing database.  
                                                       // only sqlite and postgres are supported
        "disable-composedb": false                     // set to true to run ceramic node without composedb
        "enable-historical-sync": false                // set to tru to enable historical data sync
    },
    "ipfs": {
        "host": STRING                   // complete URI of the IPFS node; used with 'remote'
        "mode": STRING "remote|bundled"  // mode to run IPFS node in
        "pinning-endpoints": ARRAY       // array of string endpoints for pinning IPFS data
        "disable-peer-data-sync": false  // CAUTION- setting to true isolates the node
    },
    "logger": {
        "log-directory": STRING          // path on local filesystem when log-to-files is set
        "log-level": NUMBER              // Log level. 0 is most verbose
        "log-to-files": true             // Log to files, default is true
    },
    "metrics": {
         "collector-host": STRING               // hostname of OTLP collector when push exporter enabled
         "metrics-exporter-enabled": BOOLEAN    // whether push exporting is enabled, default false
         "prometheus-exporter-enabled": BOOLEAN // whether prometheus-compatible endpoint enalbed, default false
         "prometheus-exporter-port": NUMBER     // port for scraping prometheus metrics if enabled
    },
    "network": {
        "name": STRING         // Network to connect to: mainnet, testnet-clay, or dev-unstable
        "pubsub-topic": STRING // CAUTION- setting this will disconnect you from the main ceramic network
    },
    "node": {
        "disable-composedb": BOOLEAN  // CAUTION if true, turns off composedb indexing
        "private-seed-url": STRING    // the private seed for this node, or will be randomly generated
        "readOnly": false             // run the node in read-only mode
        "stream-cache-limit": INTEGER // Max number of streams to keep in memory
        "sync-override": STRING       // CAUTION overrides internal sync setting for stream loads
    },
    "state-store": { 
				"local-directory": STRING // Defaults to $HOME/.ceramic/statestore
        "mode": "fs|s3",          // volume storage option shared here, fs=>filesystem, s3=>s3 bucket
        "s3-bucket": STRING       // Name of S3 bucket
        "s3-endpoint": STRING     // URL of S3 endpoint
    }
}
```

## Using Environment Variables

In some deployment environments, it is desirable to control the configuration of a node from environment variables that can be set on deployment. 
The following ceramic daemon configuration variables may be overridden in the environment:

| Environment Variable | Config Section | Config Variable |
|-----------------|-----------------|-----------------|
| CERAMIC_DISABLE_IPFS_PEER_DATA_SYNC  | ipfs  | disable-peer-data-sync |
| CERAMIC_INDEXING_DB_URI    | indexing    | db    |
| CERAMIC_METRICS_EXPORTER_ENABLED  |  metrics   |  metrics-exporter-enabled   |
| CERAMIC_NODE_PRIVATE_SEED_URL   | node    |  private-seed-url   |
| CERAMIC_PROMETHEUS_EXPORTER_ENABLED | metrics  | prometheus-exporter-enabled |
| CERAMIC_PROMETHEUS_EXPORTER_PORT   | metrics    | prometheus-exporter-port    |
| COLLECTOR_HOSTNAME  | metrics    | collector-host    |


