import { CeramicApi, DiagnosticsLogger, LoggerProvider } from '@ceramicnetwork/common'
import { DIDAnchorServiceAuth } from '../anchor/auth/did-anchor-service-auth.js'

export function createDidAnchorServiceAuth(
  anchorServiceUrl: string,
  ceramic: CeramicApi,
  logger?: any
): { auth: DIDAnchorServiceAuth; logger: DiagnosticsLogger } {
  logger = logger ?? new LoggerProvider().getDiagnosticsLogger()
  const auth = new DIDAnchorServiceAuth(anchorServiceUrl, logger)
  auth.ceramic = ceramic
  return { auth, logger }
}
