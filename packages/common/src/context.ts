import type { CeramicApi } from './ceramic-api.js'
import type { DID } from 'dids'
import type { AnchorService } from './anchor-service.js'
import type { IpfsApi, LoggerProvider } from './index.js'

/**
 * Encapsulates Ceramic context
 * TODO: Get this out of the ceramic-http-client and make fields required.
 */
export interface Context {
  did?: DID
  ipfs?: IpfsApi // an ipfs instance
  shutdownSignal?: AbortSignal
  anchorService?: AnchorService
  loggerProvider?: LoggerProvider

  api?: CeramicApi // the self reference to the Ceramic API
}
