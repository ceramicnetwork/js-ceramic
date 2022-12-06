import { jest } from '@jest/globals'

import { instrumentRequests } from '../daemon/instrument-requests.js'
import { ServiceMetrics as Metrics } from '@ceramicnetwork/observability'

describe('simple test of instrumentation', () => {
  it('should clean endpoint', () => {

    const spy = jest.spyOn(Metrics, 'count').mockImplementation(()=>null)
    const req: any = {
      url: '/api/v0/streams/kjzl6cwe1jw146nqbfvg908n0px1m7su0pziwvy0x29199qsbwr4rz3cpjj7nk5?sync=0&pin=true',
      header: jest.fn(),
      method: ''
    }
    instrumentRequests( req, {}, jest.fn())
    expect(Metrics.count).toHaveBeenCalledWith('http_request', 1,
        {'method':'', 'endpoint':'/api/v0/streams/...?sync=0&pin=true',
         'agent': undefined, 'package':'cli.daemon'})

    spy.mockRestore()
  })
})

