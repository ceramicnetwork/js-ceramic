import { LoggerConfig, SyncOptions } from '@ceramicnetwork/common'

export interface DaemonIpfsConfig {
  host?: string
  pinningEndpoints?: string[]
}

export enum StateStoreMode {
  S3 = 's3',
  FS = 'fs',
}

export interface DaemonStateStoreConfig {
  mode?: StateStoreMode
  localDirectory?: string
  s3Bucket?: string
}

export interface DaemonHTTPApiConfig {
  hostname?: string
  port?: number
  corsAllowedOrigins?: string | RegExp[]
}

export interface DaemonCeramicNetworkConfig {
  name?: string
  pubsubTopic?: string
}

export interface DaemonAnchorConfig {
  anchorServiceUrl?: string
  ethereumRpcUrl?: string
}

export interface DaemonCeramicNodeConfig {
  gateway?: boolean
  syncOverride?: SyncOptions
  validateStreams?: boolean
}

/**
 * Daemon create options
 */
export interface DaemonConfig {
  anchor?: DaemonAnchorConfig
  httpApi?: DaemonHTTPApiConfig
  ipfs?: DaemonIpfsConfig
  logger?: LoggerConfig
  network?: DaemonCeramicNetworkConfig
  node?: DaemonCeramicNodeConfig
  stateStore?: DaemonStateStoreConfig
}
