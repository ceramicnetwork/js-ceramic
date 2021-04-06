import { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import { DiagnosticsLogger } from '@ceramicnetwork/common';

/**
 * Generic error handling middleware for the daemon.
 */
export function errorHandler(logger: DiagnosticsLogger): ErrorRequestHandler {
  return (err: Error, req: Request, res: Response, next: NextFunction) => {
    (req as any).error = err // Allow other middlewares access the error
    logger.err(err);
    if (res.headersSent) {
      return next(err);
    }
    if (res.statusCode < 300) {
      // 2xx indicates error has not yet been handled
      res.status(500);
    }
    res.send({ error: err.message });
  };
}
