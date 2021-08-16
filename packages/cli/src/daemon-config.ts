import 'reflect-metadata'
import { jsonObject, jsonMember, jsonArrayMember, TypedJSON, toJson } from 'typedjson'

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
  @jsonMember
  mode?: IpfsMode

  /**
   * If mode is 'remote', this controls what URL Ceramic uses to connect to the external IPFS node.
   */
  @jsonMember
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
  @jsonMember
  mode?: StateStoreMode

  /**
   * If mode is 'fs', this controls where on the local file system to put the state store data.
   * When specifying in a config file, use the name 'local-directory'.
   */
  @jsonMember({ name: 'local-directory' })
  localDirectory?: string

  /**
   * If mode is 's3', this is the S3 bucket name where the state store is written.
   * When specifying in a config file, use the name 's3-bucket'.
   */
  @jsonMember({ name: 's3-bucket' })
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
  @jsonMember
  hostname?: string

  /**
   * Port to listen on.
   */
  @jsonMember
  port?: number

  /**
   * Origins to restrict access to the HTTP api to, using CORS. Leaving this unset means the api
   * is open to all origins.
   * When specifying in a config file, use the name 'cors-allowed-origins'.
   */
  @jsonArrayMember(RegExp, {
    name: 'cors-allowed-origins',
    deserializer: (arr) => arr.map((value: string) => new RegExp(value)),
    serializer: (arr) => arr.map((value: RegExp) => value.source),
  })
  corsAllowedOrigins?: RegExp[]
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
  @jsonMember
  name?: string

  /**
   * Name of the ipfs pubsub topic to use for protocol messages. Most users should never have to
   * set this.
   * When specifying in a config file, use the name 'pubsub-topic'.
   */
  @jsonMember({ name: 'pubsub-topic' })
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
  @jsonMember({ name: 'anchor-service-url' })
  anchorServiceUrl?: string

  /**
   * Ethereum RPC URL that can be used to create or query ethereum transactions.
   * When specifying in a config file, use the name 'ethereum-rpc-url'.
   */
  @jsonMember({ name: 'ethereum-rpc-url' })
  ethereumRpcUrl?: string
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
  @jsonMember
  gateway?: boolean

  /**
   * If set, overrides the 'sync' flag for all stream load operations.  Most users should never have
   * to set this.
   * When specifying in a config file, use the name 'sync-override'.
   */
  @jsonMember({ name: 'sync-override' })
  syncOverride?: string

  /**
   * If set to false, disables stream validation. Most users should never set this.
   * When specifying in a config file, use the name 'validate-streams'.
   */
  @jsonMember({ name: 'validate-streams' })
  validateStreams?: boolean
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
  @jsonMember({ name: 'log-directory' })
  logDirectory?: string

  /**
   * Log level. Defaults to 2. Lower numbers are more verbose.
   * When specifying in a config file, use the name 'log-level'.
   */
  @jsonMember({ name: 'log-level' })
  logLevel?: number

  /**
   * Controls whether logs get persisted to the file system.
   * When specifying in a config file, use the name 'log-to-files'.
   */
  @jsonMember({ name: 'log-to-files' })
  logToFiles?: boolean
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
  @jsonMember
  anchor: DaemonAnchorConfig

  /**
   * Options related to the HTTP API server.
   * When specifying in a config file, use the name 'http-api'.
   */
  @jsonMember({ name: 'http-api' })
  httpApi: DaemonHTTPApiConfig

  /**
   * Options related to IPFS.
   */
  @jsonMember
  ipfs: DaemonIpfsConfig

  /**
   * Options related to logging.
   */
  @jsonMember
  logger: DaemonLoggerConfig

  /**
   * Options related to the Ceramic network to connect to.
   */
  @jsonMember
  network: DaemonCeramicNetworkConfig

  /**
   * Miscellaneous options for behaviors of the underlying Ceramic node.
   */
  @jsonMember
  node: DaemonCeramicNodeConfig

  /**
   * Options related to the state store.
   * When specifying in a config file, use the name 'state-store'.
   */
  @jsonMember({ name: 'state-store' })
  stateStore: DaemonStateStoreConfig

  /**
   * Parses the given json string containing the contents of the config file and returns
   * a parsed DaemonConfig object.  Throws on any parsing error.
   * @param jsonString
   */
  static parseConfigFromString(jsonString: string): DaemonConfig {
    const jsonObject = JSON.parse(jsonString)

    return this.parseConfigFromObject(jsonObject)
  }

  static parseConfigFromObject(json: Record<string, any>): DaemonConfig {
    const serializer = new TypedJSON(DaemonConfig, {
      errorHandler: (err) => {
        throw err
      },
    })

    return serializer.parse(json)
  }
}
