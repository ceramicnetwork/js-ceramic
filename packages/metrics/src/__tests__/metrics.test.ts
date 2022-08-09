import { Metrics, METRIC_NAMES } from '../metrics-setup.js'

describe('simple test of metrics', () => {
  beforeAll(async () => {
    Metrics.start()
  })
  test('create metric', async () => {
    Metrics.count(METRIC_NAMES.HTTP_REQUEST, 1, {
      anyparam: null,
      otherparam: 'atring',
      intparam: 2,
    })
    Metrics.record(METRIC_NAMES.HTTP_REQUEST, 1, {
      anyparam: null,
      otherparam: 'atring',
      intparam: 2,
    })
  })
  test('create metric and add values', async () => {
    Metrics.count(METRIC_NAMES.HTTP_REQUEST, 1, {
      anyparam: null,
      otherparam: 'atring',
      intparam: 2,
    })
    Metrics.count(METRIC_NAMES.HTTP_REQUEST, 3, {
      anyparam: null,
      otherparam: 'atring',
      intparam: 2,
    })
    Metrics.count(METRIC_NAMES.HTTP_REQUEST, 5, { newparam: 8 })
    Metrics.record(METRIC_NAMES.HTTP_REQUEST, 1, {
      anyparam: null,
      otherparam: 'atring',
      intparam: 2,
    })
    Metrics.record(METRIC_NAMES.HTTP_REQUEST, 3, {
      anyparam: null,
      otherparam: 'atring',
      intparam: 2,
    })
    Metrics.record(METRIC_NAMES.HTTP_REQUEST, 5, { newparam: 9 })
  })
})
