import { ErrorRequestHandler, NextFunction, Request, Response } from 'express'
import { DiagnosticsLogger } from '@ceramicnetwork/common'
import { ModelMetrics } from '@ceramicnetwork/model-metrics'

export class StartupError extends Error {}

/**
 * Determine if an error is about a client aborting a request.
 */
export function isConnectionAborted(error: any): boolean {
  return 'code' in error && error.code === 'ECONNABORTED'
}

/**
 * Generic error handling middleware for the daemon.
 */
export function errorHandler(logger: DiagnosticsLogger): ErrorRequestHandler {
  return (err: Error, req: Request, res: Response, next: NextFunction) => {
    res.locals.error = err // Allow other middlewares access the error
    if (isConnectionAborted(err)) {
      logger.err(`An HTTP client abruptly closed a request: ${err.message}`)
    } else {
      logger.err(err)
    }
    if (res.headersSent) {
      return next(err)
    }
    if (res.statusCode < 300) {
      // 2xx indicates error has not yet been handled
      res.status(500)
    }
    ModelMetrics.recordError(err.message)
    res.send({ error: err.message })
  }
}
