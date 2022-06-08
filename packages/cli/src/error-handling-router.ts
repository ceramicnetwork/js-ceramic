import { Router, RouterWithAsync } from '@awaitjs/express'
import type { DiagnosticsLogger } from '@ceramicnetwork/common'
import { errorHandler } from './daemon/error-handler.js'

/**
 * Router that could log errors.
 */
export function ErrorHandlingRouter(diagnosticsLogger: DiagnosticsLogger): RouterWithAsync {
  const router = Router()
  router.use(errorHandler(diagnosticsLogger))
  return router
}
