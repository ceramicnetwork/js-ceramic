import type { CeramicApi } from './ceramic-api.js'
import type { DID } from 'dids'
import type { IpfsApi, LoggerProvider } from './index.js'

/**
 * Encapsulates Ceramic context
 */
export interface Context {
  did?: DID
  ipfs?: IpfsApi // an ipfs instance
  loggerProvider?: LoggerProvider

  api: CeramicApi // the self reference to the Ceramic API
}
