import vary from 'vary'
import type { IncomingHttpHeaders } from 'http'
import { ServerResponse } from 'http'

type StaticOrigin = boolean | string | RegExp | (boolean | string | RegExp)[]

type CustomOrigin = (
  requestOrigin: string | undefined,
  callback: (err: Error | null, origin?: StaticOrigin) => void
) => void

type CorsOrigin = StaticOrigin | CustomOrigin

interface CorsOptions {
  /**
   * @default '*''
   */
  origin?: CorsOrigin
  /**
   * @default 'GET,HEAD,PUT,PATCH,POST,DELETE'
   */
  methods: string | string[]
  allowedHeaders?: string | string[]
  headers?: string | string[] // Alias for allowedHeaders
  exposedHeaders?: string | string[]
  credentials?: boolean
  maxAge?: number
  /**
   * @default false
   */
  preflightContinue?: boolean
  /**
   * @default 204
   */
  optionsSuccessStatus: number
}

type CorsOptionsDelegate<T extends CorsRequest = CorsRequest> = (
  req: T,
  callback: (err: Error | null, options?: Partial<CorsOptions>) => void
) => void

interface CorsRequest {
  method?: string | undefined
  headers: IncomingHttpHeaders
}

type HeaderInstance = {
  key: string
  value: string | string[]
}

const defaults = {
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204,
}

function isString(s: any): s is string {
  return typeof s === 'string' || s instanceof String
}

function isRegExp(input: any): input is RegExp {
  if (input instanceof RegExp) return true
  return (
    typeof input.flags === 'string' &&
    typeof input.ignoreCase === 'boolean' &&
    typeof input.multiline === 'boolean' &&
    typeof input.global === 'boolean'
  )
}

function isOriginAllowed(origin: string, allowedOrigin: CorsOrigin): boolean {
  if (Array.isArray(allowedOrigin)) {
    for (let i = 0; i < allowedOrigin.length; ++i) {
      if (isOriginAllowed(origin, allowedOrigin[i])) {
        return true
      }
    }
    return false
  } else if (isString(allowedOrigin)) {
    return origin === allowedOrigin
  } else if (isRegExp(allowedOrigin)) {
    return allowedOrigin.test(origin)
  } else {
    return Boolean(allowedOrigin)
  }
}

function configureOrigin<T extends CorsRequest = CorsRequest>(
  options: CorsOptions,
  req: T
): Array<Array<HeaderInstance>> {
  const requestOrigin = req.headers.origin || ''
  const headers: Array<Array<HeaderInstance>> = []

  if (!options.origin || options.origin === '*') {
    // allow any origin
    headers.push([
      {
        key: 'Access-Control-Allow-Origin',
        value: '*',
      },
    ])
  } else if (isString(options.origin)) {
    // fixed origin
    headers.push([
      {
        key: 'Access-Control-Allow-Origin',
        value: options.origin,
      },
    ])
    headers.push([
      {
        key: 'Vary',
        value: 'Origin',
      },
    ])
  } else {
    const isAllowed = isOriginAllowed(requestOrigin, options.origin)
    if (isAllowed) {
      // reflect origin
      headers.push([
        {
          key: 'Access-Control-Allow-Origin',
          value: requestOrigin,
        },
      ])
    }
    headers.push([
      {
        key: 'Vary',
        value: 'Origin',
      },
    ])
  }

  return headers
}

function configureMethods(options: CorsOptions): HeaderInstance {
  let methods = options.methods
  if (methods && Array.isArray(methods)) {
    methods = methods.join(',') // .methods is an array, so turn it into a string
  }
  return {
    key: 'Access-Control-Allow-Methods',
    value: methods,
  }
}

function configureCredentials(options: CorsOptions): HeaderInstance | null {
  if (options.credentials === true) {
    return {
      key: 'Access-Control-Allow-Credentials',
      value: 'true',
    }
  }
  return null
}

function configureAllowedHeaders<T extends CorsRequest = CorsRequest>(
  options: CorsOptions,
  req: T
): Array<Array<HeaderInstance>> {
  let allowedHeaders = options.allowedHeaders || options.headers
  const headers: Array<Array<HeaderInstance>> = []

  if (!allowedHeaders) {
    allowedHeaders = req.headers['access-control-request-headers'] // .headers wasn't specified, so reflect the request headers
    headers.push([
      {
        key: 'Vary',
        value: 'Access-Control-Request-Headers',
      },
    ])
  } else if (Array.isArray(allowedHeaders)) {
    allowedHeaders = allowedHeaders.join(',') // .headers is an array, so turn it into a string
  }

  if (allowedHeaders && allowedHeaders.length) {
    headers.push([
      {
        key: 'Access-Control-Allow-Headers',
        value: allowedHeaders,
      },
    ])
  }

  return headers
}

function configureExposedHeaders(options: CorsOptions): HeaderInstance | null {
  let headers = options.exposedHeaders
  if (!headers) {
    return null
  }
  if (Array.isArray(headers)) {
    headers = headers.join(',') // .headers is an array, so turn it into a string
  }
  if (headers && headers.length) {
    return {
      key: 'Access-Control-Expose-Headers',
      value: headers,
    }
  }
  return null
}

function configureMaxAge(options: CorsOptions): HeaderInstance | null {
  const maxAge = (typeof options.maxAge === 'number' || options.maxAge) && options.maxAge.toString()
  if (maxAge && maxAge.length) {
    return {
      key: 'Access-Control-Max-Age',
      value: maxAge,
    }
  }
  return null
}

function applyHeaders(
  headers: Array<HeaderInstance> | Array<Array<HeaderInstance>>,
  res: ServerResponse
): void {
  for (let i = 0, n = headers.length; i < n; i++) {
    const header = headers[i]
    if (header) {
      if (Array.isArray(header)) {
        applyHeaders(header, res)
      } else if (header.key === 'Vary' && header.value) {
        vary(res, header.value)
      } else if (header.value) {
        res.setHeader(header.key, header.value)
      }
    }
  }
}

function corsProcessing<T extends CorsRequest = CorsRequest>(
  options: CorsOptions,
  req: T,
  res: ServerResponse,
  next: () => void
) {
  const headers: Array<any> = [],
    method = req.method && req.method.toUpperCase && req.method.toUpperCase()

  if (method === 'OPTIONS') {
    // preflight
    headers.push(configureOrigin(options, req))
    headers.push(configureCredentials(options))
    headers.push(configureMethods(options))
    headers.push(configureAllowedHeaders(options, req))
    headers.push(configureMaxAge(options))
    headers.push(configureExposedHeaders(options))
    applyHeaders(headers, res)

    if (options.preflightContinue) {
      next()
    } else {
      // Safari (and potentially other browsers) need content-length 0,
      //   for 204 or they just hang waiting for a body
      res.statusCode = options.optionsSuccessStatus
      res.setHeader('Content-Length', '0')
      res.end()
    }
  } else {
    // actual response
    headers.push(configureOrigin(options, req))
    headers.push(configureCredentials(options))
    headers.push(configureExposedHeaders(options))
    applyHeaders(headers, res)
    next()
  }
}

function middlewareWrapper<T extends CorsRequest = CorsRequest>(
  o: Partial<CorsOptions> | CorsOptionsDelegate<T>
) {
  // if options are static (either via defaults or custom options passed in), wrap in a function
  let optionsCallback: CorsOptionsDelegate<T>
  if (typeof o === 'function') {
    optionsCallback = o
  } else {
    optionsCallback = function (req, cb) {
      cb(null, o)
    }
  }

  return function corsMiddleware(req: T, res: ServerResponse, next: (err?: Error | null) => void) {
    optionsCallback(req, function (err, options) {
      if (err) {
        next(err)
      } else {
        const corsOptions: CorsOptions = Object.assign({}, defaults, options)
        let originCallback: CustomOrigin | undefined = undefined

        if (corsOptions.origin) {
          if (typeof corsOptions.origin === 'function') {
            originCallback = corsOptions.origin
          } else {
            originCallback = function (origin, cb) {
              cb(null, corsOptions.origin as StaticOrigin | undefined)
            }
          }
        }

        if (originCallback) {
          originCallback(req.headers.origin, function (err2, origin) {
            if (err2 || !origin) {
              next(err2)
            } else {
              corsOptions.origin = origin
              corsProcessing(corsOptions, req, res, next)
            }
          })
        } else {
          next()
        }
      }
    })
  }
}

export const cors = middlewareWrapper
