import 'reflect-metadata'
import { jsonObject, jsonMember, jsonArrayMember, TypedJSON, toJson, AnyT } from 'typedjson'
import { StreamID } from '@ceramicnetwork/streamid'
import { readFile } from 'node:fs/promises'
import { homedir } from 'os'

/**
 * Replace `~/` with `<homedir>/` absolute path, and `~+/` with `<cwd>/`.
 * @param input Relative path.
 */
function expandHomedir(input: string): string {
  return input.replace(/^~\+(?=$|\/|\\)/, process.cwd()).replace(/^~(?=$|\/|\\)/, homedir())
}

/**
 * If +input+ path is relative to +configFilepath+, return absolute filepath.
 *
 * Includes expansion of `~/` to home directory, and of `~+/` to current working dir. See [[expandHomedir]].
 * @param input Relative path to resolve.
 * @param configFilepath Base folder used for path resolution.
 */
function expandSinglePath(input: string, configFilepath: URL): string {
  return new URL(expandHomedir(input), configFilepath).pathname
}

/**
 * Resolve relative files used in DaemonConfig using +expandSinglePath+ function.
 *
 * Modifies +config+.
 */
function expandPaths(config: DaemonConfig, configFilepath: URL): void {
  if (config.logger?.logDirectory) {
    config.logger.logDirectory = expandSinglePath(config.logger.logDirectory, configFilepath)
  }
  if (config.stateStore?.localDirectory) {
    config.stateStore.localDirectory = expandSinglePath(
      config.stateStore.localDirectory,
      configFilepath
    )
  }
}

/**
 * Whether the daemon should start its own bundled in-process ipfs node, or if it should connect
 * over HTTP to an existing remote IPFS node.
 */
export enum IpfsMode {
  BUNDLED = 'bundled',
  REMOTE = 'remote',
}

/**
 * Ceramic Daemon options for configuring behavior related to IPFS.
 */
@jsonObject
@toJson
export class DaemonIpfsConfig {
  /**
   * Whether the daemon should start its own bundled in-process ipfs node, or if it should connect
   * over HTTP to an existing remote IPFS node.
   */
  @jsonMember(String)
  mode?: IpfsMode

  /**
   * If mode is 'remote', this controls what URL Ceramic uses to connect to the external IPFS node.
   */
  @jsonMember(String)
  host?: string

  /**
   * Endpoints for pinning IPFS data.
   * When specifying in a config file, use the name 'pinning-endpoints'.
   */
  @jsonArrayMember(String, { name: 'pinning-endpoints' })
  pinningEndpoints?: string[]
}

/**
 * Whether the Ceramic state store should store its data on the local filesystem or in Amazon S3.
 */
export enum StateStoreMode {
  S3 = 's3',
  FS = 'fs',
}

/**
 * Ceramic Daemon options for configuring behavior related to the state store.
 */
@jsonObject
@toJson
export class DaemonStateStoreConfig {
  /**
   * Controls whether the state store stores data in the local filesystem or in Amazon S3
   */
  @jsonMember(String)
  mode?: StateStoreMode

  /**
   * If mode is 'fs', this controls where on the local file system to put the state store data.
   * When specifying in a config file, use the name 'local-directory'.
   */
  @jsonMember(String, { name: 'local-directory' })
  localDirectory?: string

  /**
   * If mode is 's3', this is the S3 bucket name where the state store is written.
   * When specifying in a config file, use the name 's3-bucket'.
   */
  @jsonMember(String, { name: 's3-bucket' })
  s3Bucket?: string
}

/**
 * Ceramic Daemon options for configuring behavior related to the HTTP API.
 */
@jsonObject
@toJson
export class DaemonHTTPApiConfig {
  /**
   * Hostname to bind to and listen on.
   */
  @jsonMember(String)
  hostname?: string

  /**
   * Port to listen on.
   * jsonMember type needs to be AnyT vs Number to allow for non-number instantiation of the config
   * before type coercion and value validation is triggered via the subsequent validatePort() helper
   * function in ceramic-daemon.ts during the daemon startup.
   */
  @jsonMember(AnyT)
  port?: number

  /**
   * Origins to restrict access to the HTTP api to, using CORS. Leaving this unset means the api
   * is open to all origins.
   * When specifying in a config file, use the name 'cors-allowed-origins'.
   */
  @jsonArrayMember(RegExp, {
    name: 'cors-allowed-origins',
    deserializer: (arr) => {
      if (!arr) {
        return arr
      }
      return arr.map((value: string) => new RegExp(value))
    },
    serializer: (arr) => {
      if (!arr) {
        return arr
      }
      return arr.map((value: RegExp) => value.source)
    },
  })
  corsAllowedOrigins?: RegExp[]

  /**
   * An array of DIDs with access to Admin API (represented as strings)
   */
  @jsonArrayMember(String, { name: 'admin-dids' })
  adminDids?: Array<string>
}

/**
 * Ceramic Daemon options for configuring behavior related to the Ceramic network to connect to.
 */
@jsonObject
@toJson
export class DaemonCeramicNetworkConfig {
  /**
   * Name of the ceramic network to connect to. For example 'testnet-clay' or 'mainnet'.
   */
  @jsonMember(String)
  name?: string

  /**
   * Name of the ipfs pubsub topic to use for protocol messages. Most users should never have to
   * set this.
   * When specifying in a config file, use the name 'pubsub-topic'.
   */
  @jsonMember(String, { name: 'pubsub-topic' })
  pubsubTopic?: string
}

/**
 * Ceramic Daemon options for configuring behavior related to performing or validating anchors.
 */
@jsonObject
@toJson
export class DaemonAnchorConfig {
  /**
   * URL of the Ceramic Anchor Service to send anchor requests to.
   * When specifying in a config file, use the name 'anchor-service-url'.
   */
  @jsonMember(String, { name: 'anchor-service-url' })
  anchorServiceUrl?: string

  /**
   * Ethereum RPC URL that can be used to create or query ethereum transactions.
   * When specifying in a config file, use the name 'ethereum-rpc-url'.
   */
  @jsonMember(String, { name: 'ethereum-rpc-url' })
  ethereumRpcUrl?: string
}

/**
 * Configuration options related to Index API.
 */
@jsonObject
@toJson
export class IndexingConfig {
  /**
   * Connection string to a database. Only sqlite and postgres are supported.
   * Examples:
   *  - `sqlite:///path/to/database.sqlite`,
   *  - `postgres:///user:password@host:5432/database`
   */
  @jsonMember(String)
  db: string

  /**
   * Allow serving indexing queries if historical indexing is not done yet.
   */
  @jsonMember(Boolean, {
    name: 'allow-queries-before-historical-sync',
  })
  allowQueriesBeforeHistoricalSync = false
}

@jsonObject
@toJson
export class DaemonDidResolversConfig {
  /**
   * Configuration for nft-did-resolver. Its README contains appropriate documentation.
   *
   * When specifying in a config file, use the name 'nft-did-resolver'.
   */
  @jsonMember(AnyT, { name: 'nft-did-resolver' })
  nftDidResolver?: any

  /**
   * Configuration for safe-did-resolver. Its README contains appropriate documentation.
   *
   * When specifying in a config file, use the name 'safe-did-resolver'.
   */
  @jsonMember(AnyT, { name: 'safe-did-resolver' })
  safeDidResolver?: any

  /**
   * Configuration for ethr-did-resolver. Its README contains appropriate documentation.
   *
   * When specifying in a config file, use the name 'ethr-did-resolver'.
   */
  @jsonMember(AnyT, { name: 'ethr-did-resolver' })
  ethrDidResolver?: any
}

/**
 * Ceramic Daemon options for configuring miscellaneous behaviors of the underlying Ceramic node.
 */
@jsonObject
@toJson
export class DaemonCeramicNodeConfig {
  /**
   * Whether to run the Ceramic node in read-only gateway mode.
   */
  @jsonMember(Boolean)
  gateway?: boolean

  /**
   * If set, overrides the 'sync' flag for all stream load operations.  Most users should never have
   * to set this.
   * When specifying in a config file, use the name 'sync-override'.
   */
  @jsonMember(String, { name: 'sync-override' })
  syncOverride?: string

  /**
   * Max number of streams to keep in the node's in-memory cache.
   * When specifying in a config file, use the name 'stream-cache-limit'.
   */
  @jsonMember(Number, { name: 'stream-cache-limit' })
  streamCacheLimit?: number
}

/**
 * Ceramic Daemon options for configuring behavior related to logging.
 */
@jsonObject
@toJson
export class DaemonLoggerConfig {
  /**
   * If 'logToFiles' is true, this contains the path on the local filesystem where log files will
   * be written.
   * When specifying in a config file, use the name 'log-directory'.
   */
  @jsonMember(String, { name: 'log-directory' })
  logDirectory?: string

  /**
   * Log level. Defaults to 2. Lower numbers are more verbose.
   * When specifying in a config file, use the name 'log-level'.
   */
  @jsonMember(Number, { name: 'log-level' })
  logLevel?: number

  /**
   * Controls whether logs get persisted to the file system.
   * When specifying in a config file, use the name 'log-to-files'.
   */
  @jsonMember(Boolean, { name: 'log-to-files' })
  logToFiles?: boolean
}

/**
 * Metrics exporter config indicating whether the metrics exporter should start and where is the collector
 */
@jsonObject
@toJson
export class DaemonMetricsConfig {
  /**
   * Controls whether the metrics exporter is started
   */
  @jsonMember(Boolean, { name: 'metrics-exporter-enabled' })
  metricsExporterEnabled?: boolean

  /**
   * If 'enabled' is true, this contains the port on which the metrics exporter will listen
   */
  @jsonMember(String, { name: 'collector-host' })
  collectorHost?: string
}

/**
 * Daemon create options
 */
@jsonObject
@toJson
export class DaemonConfig {
  /**
   * Options related to anchoring
   */
  @jsonMember(DaemonAnchorConfig)
  anchor: DaemonAnchorConfig

  /**
   * Options related to the HTTP API server.
   * When specifying in a config file, use the name 'http-api'.
   */
  @jsonMember(DaemonHTTPApiConfig, { name: 'http-api' })
  httpApi: DaemonHTTPApiConfig

  /**
   * Options related to IPFS.
   */
  @jsonMember(DaemonIpfsConfig)
  ipfs: DaemonIpfsConfig

  /**
   * Options related to logging.
   */
  @jsonMember(DaemonLoggerConfig)
  logger: DaemonLoggerConfig

  /**
   * Options related to metrics export.
   */
  @jsonMember(DaemonMetricsConfig)
  metrics: DaemonMetricsConfig

  /**
   * Options related to the Ceramic network to connect to.
   */
  @jsonMember(DaemonCeramicNetworkConfig)
  network: DaemonCeramicNetworkConfig

  /**
   * Miscellaneous options for behaviors of the underlying Ceramic node.
   */
  @jsonMember(DaemonCeramicNodeConfig)
  node: DaemonCeramicNodeConfig

  /**
   * Options related to the state store.
   * When specifying in a config file, use the name 'state-store'.
   */
  @jsonMember(DaemonStateStoreConfig, { name: 'state-store' })
  stateStore: DaemonStateStoreConfig

  /**
   * Options related to DID-resolvers.
   */
  @jsonMember(DaemonDidResolversConfig, { name: 'did-resolvers' })
  didResolvers?: DaemonDidResolversConfig

  /**
   * Options related to indexing
   */
  @jsonMember(IndexingConfig)
  indexing?: IndexingConfig

  /**
   * Parses the given json string containing the contents of the config file and returns
   * a parsed DaemonConfig object.  Throws on any parsing error.
   * @param jsonString
   */
  static fromString(jsonString: string): DaemonConfig {
    const jsonObject = JSON.parse(jsonString)

    return this.fromObject(jsonObject)
  }

  static async fromFile(filepath: URL): Promise<DaemonConfig> {
    const content = await readFile(filepath, { encoding: 'utf8' })
    const config = DaemonConfig.fromString(content)
    expandPaths(config, filepath)
    return config
  }

  static fromObject(json: Record<string, any>): DaemonConfig {
    const serializer = new TypedJSON(DaemonConfig, {
      errorHandler: (err) => {
        throw err
      },
    })

    return serializer.parse(json)
  }
}
