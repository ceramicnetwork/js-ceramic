
import { MeterProvider } from '@opentelemetry/sdk-metrics-base'
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'
import { Resource } from '@opentelemetry/resources'

const exporterConfig = PrometheusExporter.DEFAULT_OPTIONS

if (! process.env.METRICS_ENABLED || process.env.NODE_ENV == 'test') {
  exporterConfig['preventServerStart'] = true
}
if (process.env.METRICS_EXPORTER_PORT) {
  exporterConfig['port'] = Number(process.env.METRICS_EXPORTER_PORT)
}

const metricExporter = new PrometheusExporter(exporterConfig)

const meterProvider = new MeterProvider({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'js-ceramic',
  }),
});

// Creates MeterProvider and installs the exporter as a MetricReader
meterProvider.addMetricReader(metricExporter);

// Meter for js-ceramic
const meter = meterProvider.getMeter('js-ceramic');

// Metric names
// the parameters will be used to distinguish the endpoint, type of call etc
// be flexible about what we record, as the dependency in the grafana does not see this code

export const REQUEST_METRIC = 'request'
export const RESPONSE_METRIC = 'response'  // unused for now
export const RECEIVED_METRIC = 'received'
export const PUBLISHED_METRIC = 'published'
export const PINNED_METRIC = 'pinned'

const VALID_METRIC_NAMES = [REQUEST_METRIC, RESPONSE_METRIC, RECEIVED_METRIC, PUBLISHED_METRIC, PINNED_METRIC]

// could have subclasses or specific functions with set params, but we want to
// easily and quickly change what is recorded, there are no code dependencies on it

export function Count(name:string, value:number, params?:any) {
  if (! VALID_METRIC_NAMES.includes(name)) {
    throw("Error: metric names must be defined in VALID_METRIC_NAMES")
  }
  meter.createCounter(name, params).add(value)
}

export function Record(name:string, value:number, params?:any) {
  if (! VALID_METRIC_NAMES.includes(name)) {
    throw("Error: metric names must be defined in VALID_METRIC_NAMES")
  }
  meter.createHistogram(name, params).record(value)
}
