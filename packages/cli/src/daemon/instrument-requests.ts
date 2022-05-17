import {Counter, Span} from '@ceramicnetwork/common'

export function instrumentRequests(req, res, next) {

  const token = req.header("authorization")
  const agent = req.header("user-agent")
  // do some metrics
  const counter = new Counter('request', {'method': 'GET'})
  counter.add(1)
  next()
}

