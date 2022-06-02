import {Metrics, REQUEST_METRIC} from '@ceramicnetwork/metrics'

export function instrumentRequest(req, res, next) {

  const token = req.header("authorization")
  const agent = req.header("user-agent")
  // do some metrics
  // maybe endpoint = req.url or req.originalUrl ?
  Metrics.count(REQUEST_METRIC, 1, {'method': req.method, 'endpoint':req.url, 'agent':agent})
  next()
}


