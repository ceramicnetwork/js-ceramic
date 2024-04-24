import { LoggerProvider } from '@ceramicnetwork/common'
import { Request, Response } from 'express'
import morgan from 'morgan'

const EXPECTED_RESPONSE_TIME_MS = 2000
const MAX_DAILY_SLOW_REQUESTS_TO_LOG = 10

const ACCESS_LOG_FMT =
  'ip=:remote-addr ts=:date[iso] method=:method original_url=:original-url base_url=:base-url path=:path:params :body http_version=:http-version req_header:req[header] status=:status content_length=:res[content-length] content_type=":res[content-type]" ref=:referrer user_agent=":user-agent" elapsed_ms=:total-time[3] error_message=":error-message" error_code=:error-code'

export function logRequests(loggerProvider: LoggerProvider): any[] {

  // these trackers and middleware enable us to log just a sample of slow requests each day or app restart
  let slowRequestCount = 0;
  let lastLoggedDate = new Date().toISOString().slice(0, 10);

  // Middleware to calculate response time and handle daily reset of the counter
  const responseTimeMiddleware = (req: Request, res: Response, next: Function) => {
    const start = Date.now();
    const currentDate = new Date().toISOString().slice(0, 10);

    if (lastLoggedDate !== currentDate) {
      slowRequestCount = 0;  // Reset counter if it's a new day
      lastLoggedDate = currentDate;  // Update the last logged date
    }

    res.on('finish', () => {
      const responseTime = Date.now() - start;
      if (responseTime > EXPECTED_RESPONSE_TIME_MS && slowRequestCount < MAX_DAILY_SLOW_REQUESTS_TO_LOG) {
        slowRequestCount++;
        res.locals.logSlowRequest = true; // Flag to log this request
      }
    });
    next();
  };

  morgan.token<Request, Response>('error-message', (req, res: Response) => {
    return res.locals.error?.message
  })
  morgan.token<Request, Response>('error-code', (req, res: Response) => {
    return res.locals.error?.code
  })
  morgan.token<Request, Response>('original-url', (req) => {
    return req.originalUrl
  })
  morgan.token<Request, Response>('base-url', (req) => {
    return req.baseUrl
  })
  morgan.token<Request, Response>('path', (req) => {
    return req.path
  })
  morgan.token<Request, Response>('params', (req) => {
    if (req.params) {
      const keys = Object.keys(req.params)
      if (keys.length > 0) {
        const params = keys.reduce((prev, curr) => {
          return prev + ` params.${curr}=${req.params[curr]}`
        }, '')
        return params
      }
    }
    return ' params=-'
  })
  morgan.token<Request, Response>('body', (req, res: Response) => {
    if (req.body && res.locals.logSlowRequest) {
      const keys = Object.keys(req.body)
      if (keys.length > 0) {
        const body = keys.reduce((prev, curr) => {
          const value = req.body[curr]
          const valKeys = Object.keys(value)
          if (valKeys.length > 0) {
            // value is an object
            return prev + ` body.${curr}=${JSON.stringify(value)}`
          } else {
            // value is a scalar
            return prev + ` body.${curr}=${value}`
          }
        }, '')
        return body
      }
    }
    return ' body=-'
  })

  const logger = loggerProvider.makeServiceLogger('http-access')

  return morgan(ACCESS_LOG_FMT, { stream: logger })
}
