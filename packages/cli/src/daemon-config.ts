import 'reflect-metadata'
import { jsonObject, jsonMember, jsonArrayMember, TypedJSON, toJson } from 'typedjson'
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
   */
  @jsonArrayMember(String)
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
   */
  @jsonMember
  localDirectory?: string

  /**
   * If mode is 's3', this is the S3 bucket name where the state store is written.
   */
  @jsonMember
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
   */
  @jsonArrayMember(RegExp, { deserializer: (arr) => arr.map((value) => new RegExp(value)) })
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
   */
  @jsonMember
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
   */
  @jsonMember
  anchorServiceUrl?: string

  /**
   * Ethereum RPC URL that can be used to create or query ethereum transactions.
   */
  @jsonMember
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
   */
  @jsonMember
  syncOverride?: SyncOptions // todo make string, lookup from table later

  /**
   * If set to false, disables stream validation. Most users should never set this.
   */
  @jsonMember
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
   */
  @jsonMember
  logDirectory?: string

  /**
   * Log level. Defaults to 0. Higher numbers are more verbose.
   */
  @jsonMember
  logLevel?: number

  /**
   * Controls whether logs get persisted to the file system.
   */
  @jsonMember
  logToFiles?: boolean
}

/**
 * Daemon create options
 */
@jsonObject
@toJson // todo is this necessary?
export class DaemonConfig {
  /**
   * Options related to anchoring
   */
  @jsonMember
  anchor: DaemonAnchorConfig

  /**
   * Options related to the HTTP API server.
   */
  @jsonMember
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
   */
  @jsonMember
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

  // todo remove this if it isn't necessary
  stringify(): string {
    // TODO ensure this converts field names back to config file format
    // TODO ensure this outputs corsAllowedOrigins RegExps correctly
    return JSON.stringify(this, null, 2)
  }
}
