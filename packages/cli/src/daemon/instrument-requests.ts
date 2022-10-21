import {Metrics, METRIC_NAMES} from '@ceramicnetwork/metrics'

export function instrumentRequests(req, res, next) {

  const token = req.header("authorization")
  const agent = req.header("user-agent")

  Metrics.count(METRIC_NAMES.HTTP_REQUEST, 1,
       {'method': req.method, 'endpoint':req.url, 'agent':agent, 'package':'cli.daemon'})
  next()
}
