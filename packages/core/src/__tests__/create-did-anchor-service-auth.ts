import { CeramicApi, DiagnosticsLogger, fetchJson, LoggerProvider } from '@ceramicnetwork/common'
import { DIDAnchorServiceAuth } from '../anchor/auth/did-anchor-service-auth.js'

export function createDidAnchorServiceAuth(
  anchorServiceUrl: string,
  ceramic: CeramicApi,
  logger: DiagnosticsLogger = new LoggerProvider().getDiagnosticsLogger(),
  _fetchJson: typeof fetchJson = fetchJson
): { auth: DIDAnchorServiceAuth; logger: DiagnosticsLogger } {
  const auth = new DIDAnchorServiceAuth(anchorServiceUrl, logger, _fetchJson)
  auth.ceramic = ceramic
  return { auth, logger }
}
