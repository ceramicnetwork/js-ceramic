import {Count, REQUEST_METRIC} from '../../../common'
import { StreamState } from '../stream'

const updates: StreamState[] = []

describe('simple test of metrics', () => {
  afterEach(() => {
    delete process.env.OTEL_EXPORTER_PROMETHEUS_HOST;
    delete process.env.OTEL_EXPORTER_PROMETHEUS_PORT;
  });
  test('create valid metric', async () => {
    Count(REQUEST_METRIC, 1, {'anyparam': null, 'otherparam':'atring', 'intparam':2})
  })
  test('create_invalid_metric', async () => {
    expect(function() {Count("Invalid metric", 2)}).toThrow(/Error: metric names must be defined in VALID_METRIC_NAMES/)
  })

})

