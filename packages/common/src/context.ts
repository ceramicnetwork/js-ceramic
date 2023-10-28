import type { CeramicApi } from './ceramic-api.js'
import type { ThreadedDid, DIDVerifier } from 'dids-threads'
import type { IpfsApi, LoggerProvider } from './index.js'

/**
 * Encapsulates Ceramic context
 */
export interface Context {
  did?: ThreadedDid
  didVerifier?: DIDVerifier
  ipfs?: IpfsApi // an ipfs instance
  loggerProvider?: LoggerProvider

  api: CeramicApi // the self reference to the Ceramic API
}
