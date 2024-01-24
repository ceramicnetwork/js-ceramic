import type { CeramicSigner, DiagnosticsLogger } from '@ceramicnetwork/common'
import { DIDAnchorServiceAuth } from '../anchor/auth/did-anchor-service-auth.js'
import type { fetchJson } from '@ceramicnetwork/common'

export function createDidAnchorServiceAuth(
  anchorServiceUrl: string,
  signer: CeramicSigner,
  logger: DiagnosticsLogger,
  fetchFn: typeof fetchJson
): DIDAnchorServiceAuth {
  return new DIDAnchorServiceAuth(anchorServiceUrl, logger, signer, fetchFn)
}
