import {ServiceMetrics as Metrics} from '@ceramicnetwork/observability'

export function instrumentRequests(req, res, next) {

  const token = req.header("authorization")
  const agent = req.header("user-agent")

  const HTTP_REQUEST = 'http_request'

  const clean_endpoint_re = /(\/streams\/)[^\/\?]+(\?.+)?/

  const endpoint = req.url.replace(clean_endpoint_re, "$1...$2")

  Metrics.count(HTTP_REQUEST, 1,
       {'method': req.method, 'endpoint':endpoint, 'agent':agent, 'package':'cli.daemon'})
  next()
}
