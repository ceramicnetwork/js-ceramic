import { SyncOptions } from '@ceramicnetwork/common'

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
export interface DaemonIpfsConfig {
  /**
   * Whether the daemon should start its own bundled in-process ipfs node, or if it should connect
   * over HTTP to an existing remote IPFS node.
   */
  mode?: IpfsMode

  /**
   * If mode is 'remote', this controls what URL Ceramic uses to connect to the external IPFS node.
   */
  host?: string

  /**
   * Endpoints for pinning IPFS data.
   */
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
export interface DaemonStateStoreConfig {
  /**
   * Controls whether the state store stores data in the local filesystem or in Amazon S3
   */
  mode?: StateStoreMode

  /**
   * If mode is 'fs', this controls where on the local file system to put the state store data.
   */
  localDirectory?: string

  /**
   * If mode is 's3', this is the S3 bucket name where the state store is written.
   */
  s3Bucket?: string
}

/**
 * Ceramic Daemon options for configuring behavior related to the HTTP API.
 */
export interface DaemonHTTPApiConfig {
  /**
   * Hostname to bind to and listen on.
   */
  hostname?: string

  /**
   * Port to listen on.
   */
  port?: number

  /**
   * Origins to restrict access to the HTTP api to, using CORS. Leaving this unset means the api
   * is open to all origins.
   */
  corsAllowedOrigins?: string | RegExp[]
}

/**
 * Ceramic Daemon options for configuring behavior related to the Ceramic network to connect to.
 */
export interface DaemonCeramicNetworkConfig {
  /**
   * Name of the ceramic network to connect to. For example 'testnet-clay' or 'mainnet'.
   */
  name?: string

  /**
   * Name of the ipfs pubsub topic to use for protocol messages. Most users should never have to
   * set this.
   */
  pubsubTopic?: string
}

/**
 * Ceramic Daemon options for configuring behavior related to performing or validating anchors.
 */
export interface DaemonAnchorConfig {
  /**
   * URL of the Ceramic Anchor Service to send anchor requests to.
   */
  anchorServiceUrl?: string

  /**
   * Ethereum RPC URL that can be used to create or query ethereum transactions.
   */
  ethereumRpcUrl?: string
}

/**
 * Ceramic Daemon options for configuring miscellaneous behaviors of the underlying Ceramic node.
 */
export interface DaemonCeramicNodeConfig {
  /**
   * Whether to run the Ceramic node in read-only gateway mode.
   */
  gateway?: boolean

  /**
   * If set, overrides the 'sync' flag for all stream load operations.  Most users should never have
   * to set this.
   */
  syncOverride?: SyncOptions

  /**
   * If set to false, disables stream validation. Most users should never set this.
   */
  validateStreams?: boolean
}

/**
 * Ceramic Daemon options for configuring behavior related to logging.
 */
export interface DaemonLoggerConfig {
  /**
   * If 'logToFiles' is true, this contains the path on the local filesystem where log files will
   * be written.
   */
  logDirectory?: string

  /**
   * Log level. Defaults to 0. Higher numbers are more verbose.
   */
  logLevel?: number

  /**
   * Controls whether logs get persisted to the file system.
   */
  logToFiles?: boolean
}

/**
 * Daemon create options
 */
export interface DaemonConfig {
  /**
   * Options related to anchoring
   */
  anchor?: DaemonAnchorConfig

  /**
   * Options related to the HTTP API server.
   */
  httpApi?: DaemonHTTPApiConfig

  /**
   * Options related to IPFS.
   */
  ipfs?: DaemonIpfsConfig

  /**
   * Options related to logging.
   */
  logger?: DaemonLoggerConfig

  /**
   * Options related to the Ceramic network to connect to.
   */
  network?: DaemonCeramicNetworkConfig

  /**
   * Miscellaneous options for behaviors of the underlying Ceramic node.
   */
  node?: DaemonCeramicNodeConfig

  /**
   * Options related to the state store.
   */
  stateStore?: DaemonStateStoreConfig
}
