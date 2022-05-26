import {
  BasicTracerProvider,
  ConsoleSpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base'
import { MeterProvider, InstrumentType, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics-base'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'
import { Resource } from '@opentelemetry/resources'
import {trace} from '@opentelemetry/api'

const collectorOptions = {
//  url: '<opentelemetry-collector-url>', // url is optional and can be omitted - default is http://localhost:4318/v1/metrics
  url: 'http://localhost:53717/v1/metrics',
  headers: {}, // an optional object containing custom headers to be sent with each request
  concurrencyLimit: 1, // an optional limit on pending requests
};
const metricExporter = new OTLPMetricExporter(collectorOptions);

// register the exporter with a meter provider
// syntax is from https://www.npmjs.com/package/@opentelemetry/exporter-metrics-otlp-http but looks wrong
// asked in the otlp slack
// this is more likely correct: https://github.com/open-telemetry/opentelemetry-js/blob/main/examples/otlp-exporter-node/metrics.js
/*
const meter = new MeterProvider({
  exporter,  // this doesn't even make sense, but its in the docs
  interval: 60000,
}).getMeter('js-ceramic-meter');
*/

const meterProvider = new MeterProvider({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'js-ceramic',
  }),
});

meterProvider.addMetricReader(new PeriodicExportingMetricReader({
  exporter: metricExporter,
  exportIntervalMillis: 1000,
}));

const meter = meterProvider.getMeter('ceramic-exporter-collector');



// Creates a global tracer provider that will automatically export traces
const provider = new BasicTracerProvider();
// Configure span processor to send spans to the exporter
provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
provider.register();

// Tracer for js-ceramic
const tracer = trace.getTracer(
  'js-ceramic'
)

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


export class Span {
  public span: any
  constructor(name:string, params?: any ) {
    this.span = tracer.startSpan(name, params)
  }
  public end() {
    this.span.end()
  }
  // TODO make sure span.end() gets called on garbage collection
}

