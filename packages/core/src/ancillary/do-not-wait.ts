import type { DiagnosticsLogger } from '@ceramicnetwork/common'

/**
 * Mark that we are not interested in `promise` result. If `promise` rejects, we swallow the error.
 */
export function doNotWait(promise: Promise<any>, logger: DiagnosticsLogger): void {
  promise.catch((error) => {
    logger.err(error)
  })
}
