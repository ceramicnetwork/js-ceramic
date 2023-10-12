import type { CeramicApi, DiagnosticsLogger } from '@ceramicnetwork/common'
import { DIDAnchorServiceAuth } from '../anchor/auth/did-anchor-service-auth.js'
import type { fetchJson } from '@ceramicnetwork/common'

export function createDidAnchorServiceAuth(
  anchorServiceUrl: string,
  ceramic: CeramicApi,
  logger: DiagnosticsLogger,
  fetchFn: typeof fetchJson
): DIDAnchorServiceAuth {
  const auth = new DIDAnchorServiceAuth(anchorServiceUrl, logger, fetchFn)
  auth.ceramic = ceramic
  return auth
}
