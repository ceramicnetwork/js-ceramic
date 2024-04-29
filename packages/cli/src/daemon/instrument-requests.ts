import { ServiceMetrics as Metrics } from '@ceramicnetwork/observability'

export function instrumentRequests(req, res, next) {
  // When we move to API tokens, we will need to gather and map this token
  // to identify the partner
  // const token = req.header("authorization")

  const agent = req.header('user-agent')

  const HTTP_REQUEST = 'http_request'

  const clean_endpoint_re = /(\/streams\/)[^/?]+(\?.+)?/

  const endpoint = req.url.replace(clean_endpoint_re, '$1...$2')

  Metrics.count(HTTP_REQUEST, 1, {
    method: req.method,
    endpoint: endpoint,
    agent: agent,
    package: 'cli.daemon',
  })
  if (req.method === 'POST' && req.url.includes('api/v0/streams')) {
    Metrics.count('http_request_create_stream', 1)
  }
  next()
}
