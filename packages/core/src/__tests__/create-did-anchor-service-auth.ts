import type { CeramicApi, DiagnosticsLogger } from '@ceramicnetwork/common'
import { DIDAnchorServiceAuth } from '../anchor/auth/did-anchor-service-auth.js'

export function createDidAnchorServiceAuth(
  anchorServiceUrl: string,
  ceramic: CeramicApi,
  logger: DiagnosticsLogger
): DIDAnchorServiceAuth {
  const auth = new DIDAnchorServiceAuth(anchorServiceUrl, logger)
  auth.ceramic = ceramic
  return auth
}
