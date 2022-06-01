import {Metrics, REQUEST_METRIC} from '../../../core'
import { StreamState } from '../stream'

const updates: StreamState[] = []

describe('simple test of metrics', () => {
  test('create valid metric', async () => {
    Metrics.count(REQUEST_METRIC, 1, {'anyparam': null, 'otherparam':'atring', 'intparam':2})
    Metrics.record(REQUEST_METRIC, 1, {'anyparam': null, 'otherparam':'atring', 'intparam':2})
  })
  test('create valid metric and add values', async () => {
    Metrics.count(REQUEST_METRIC, 1, {'anyparam': null, 'otherparam':'atring', 'intparam':2})
    Metrics.count(REQUEST_METRIC, 1, {'anyparam': null, 'otherparam':'atring', 'intparam':2})
    Metrics.count(REQUEST_METRIC, 1, {'newparam': 8})
    Metrics.record(REQUEST_METRIC, 1, {'anyparam': null, 'otherparam':'atring', 'intparam':2})
    Metrics.record(REQUEST_METRIC, 1, {'anyparam': null, 'otherparam':'atring', 'intparam':2})
    Metrics.record(REQUEST_METRIC, 1, {'newparam':9})
  })
  test('create_invalid_metric', async () => {
    expect(function() {Metrics.count("Invalid metric", 2)}).toThrow(/Error: metric names must be defined in VALID_METRIC_NAMES/)
    expect(function() {Metrics.record("Invalid metric", 2)}).toThrow(/Error: metric names must be defined in VALID_METRIC_NAMES/)
  })

})

