import {ServiceMetrics as Metrics} from '@ceramicnetwork/observability'

export function instrumentRequests(req, res, next) {

  const token = req.header("authorization")
  const agent = req.header("user-agent")

  const HTTP_REQUEST = 'http_request'

  Metrics.count(HTTP_REQUEST, 1,
       {'method': req.method, 'endpoint':req.url, 'agent':agent, 'package':'cli.daemon'})
  next()
}
