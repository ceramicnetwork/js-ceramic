import 'reflect-metadata'
import { jsonObject, jsonMember, jsonArrayMember, TypedJSON, toJson, AnyT } from 'typedjson'
import { readFile } from 'node:fs/promises'
import { homedir } from 'os'
import { AnchorServiceAuthMethods } from '@ceramicnetwork/common'
import { StartupError } from './daemon/error-handler.js'

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

  /**
   * When true, effectively makes the node local-only.  This node will be unable to load any data
   * from other nodes on the network. Use with caution!
   */
  @jsonMember(Boolean, { name: 'disable-peer-data-sync' })
  disablePeerDataSync?: boolean = false
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

  /**
   * If mode is 's3', this is the optional custom S3 endpoint used to find the bucket.
   * When specifying in a config file, use the name 's3-endpoint'.
   * If not passed, 'https://s3.console.aws.amazon.com/s3/buckets/' will be used
   */
  @jsonMember(String, { name: 's3-endpoint' })
  s3Endpoint?: string
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
   * An array of DIDs with access to Admin API (represented as strings).
   * This contains the DID strings describing DIDs that be used to send requests to the Ceramic server
   * to perform admin operations.  This should not be confused with the node DID set via the
   * "node.private-seed-url" config.
   * When specifying in a config file, use the name 'admin-dids'.
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
   * Controls the authentication method Ceramic uses to make requests to the Ceramic Anchor Service.
   * When specifying in a config file, use the name 'auth-method'.
   */
  @jsonMember(String, { name: 'auth-method' })
  authMethod?: string

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

  /**
   * Allow Ceramic node to run in stand-along mode without Compose DB enabled
   */
  @jsonMember(Boolean, {
    name: 'disable-composedb',
  })
  disableComposedb = false

  /**
   * Enable Historical data sync worker for Compose DB indexing
   */
  @jsonMember(Boolean, {
    name: 'enable-historical-sync',
  })
  enableHistoricalSync = false

  /**
   * Setting this will adjust the max connection pool size for postgres, default is 10.
   * Values lower than 1 will be set to 1
   */
  @jsonMember(Boolean, {
    name: 'max-connection-pool-size',
  })
  maxConnectionPoolSize?: number
}

/**
 * Ceramic Daemon options for configuring miscellaneous behaviors of the underlying Ceramic node.
 */
@jsonObject
@toJson
export class DaemonCeramicNodeConfig {
  private _privateSeedUrl: string

  /**
   * Disallows public access to private-seed-url because it is a sensitive field.
   */
  @jsonMember(String, { name: 'private-seed-url' })
  public get privateSeedUrl(): string {
    return undefined
  }

  /**
   * Setter for seed used to generate the node's DID. This DID is used to identify the node on the
   * network, and is used to sign requests to the Ceramic Anchor Service (CAS).
   * A seed is randomly generated if a config file is not found.
   * When specifying in a config file, use the name 'private-seed-url'.
   */
  public set privateSeedUrl(value: string) {
    this._privateSeedUrl = value
  }

  public sensitive_privateSeedUrl(): string {
    return this._privateSeedUrl
  }

  /**
   * Whether to run the Ceramic node in read-only mode.
   */
  @jsonMember(Boolean)
  readOnly?: boolean

  /**
   * If set, overrides the 'sync' flag for all stream load operations.  Most users should never have
   * to set this.
   * When specifying in a config file, use the name 'sync-override'.
   */
  @jsonMember(String, { name: 'sync-override' })
  syncOverride?: string

  /**
   * Whether to run the Ceramic node with CDB indexing enabled
   */
  @jsonMember(Boolean, { name: 'disable-composedb' })
  disableComposedb?: boolean

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
   * Controls whether the Prometheus metrics exporter is started
   */
  @jsonMember(Boolean, { name: 'prometheus-exporter-enabled' })
  prometheusExporterEnabled?: boolean

  /**
   * Controls the port where Prometheus metrics will be exposed.
   */
  @jsonMember(Number, { name: 'prometheus-exporter-port' })
  prometheusExporterPort?: number

  /**
   * Controls whether the metrics exporter is started
   */
  @jsonMember(Boolean, { name: 'metrics-exporter-enabled' })
  metricsExporterEnabled?: boolean

  /**
   * If 'promethus-exporter-enabled' is true, this contains the port on which the metrics exporter will listen
   */
  @jsonMember(String, { name: 'collector-host' })
  collectorHost?: string

  /**
   * Controls whether we publish metrics periodically on the Ceramic Network
   */
  @jsonMember(Boolean, { name: 'metrics-publisher-enabled' })
  metricsPublisherEnabled?: boolean = false

  /**
   * If metrics publishing enabled, publish interval in milliseconds
   */
  @jsonMember(Number, { name: 'metrics-publish-interval-ms' })
  metricsPublishIntervalMS?: number

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

    // Set hidden fields before returning
    const config = serializer.parse(json)
    if (json.node) {
      if (json.node.privateSeedUrl) {
        config.node.privateSeedUrl = json.node.privateSeedUrl
      }
    }
    return config
  }
}

/**
 * Validate the config object has the expected settings.
 *
 */
export function validateConfig(config: DaemonConfig) {
  if (config.anchor) {
    if (config.anchor.authMethod == AnchorServiceAuthMethods.DID) {
      if (!config.node) throw new StartupError('Daemon config is missing node.private-seed-url')
      if (!config.node.sensitive_privateSeedUrl())
        throw new StartupError('Daemon config is missing node.private-seed-url')
    }
  }
}
