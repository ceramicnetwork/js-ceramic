import {
  BasicTracerProvider,
  ConsoleSpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base'
import { MeterProvider } from '@opentelemetry/sdk-metrics-base'
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus'
import {trace} from '@opentelemetry/api'

const { endpoint, port } = PrometheusExporter.DEFAULT_OPTIONS;

const exporter = new PrometheusExporter({}, () => {
  console.log(
    `prometheus scrape endpoint: http://localhost:${port}${endpoint}`,
  );
});

// Creates MeterProvider and installs the exporter as a MetricReader
const meterProvider = new MeterProvider();
meterProvider.addMetricReader(exporter);

// Creates a global tracer provider that will automatically export traces
const provider = new BasicTracerProvider();
// Configure span processor to send spans to the exporter
provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
provider.register();

// Meter for js-ceramic
const meter = meterProvider.getMeter('js-ceramic');

// Tracer for js-ceramic
const tracer = trace.getTracer(
  'js-ceramic'
)

export const enum MetricType {
  COUNTER,
  GAUGE,
  HISTOGRAM
}

// see https://opentelemetry.io/docs/reference/specification/metrics/semantic_conventions/#general-metric-semantic-conventions

// probably this should be a class with inheritance instead
export function MetricMaker(name:string, metric_type:MetricType, params: any) {
  const caller = MetricMaker.caller
  let metric = null
  let metric_name = `${caller}.${name}`
  switch (metric_type) {
    case MetricType.COUNTER: {
      metric_name = `${metric_name}.counter`
      metric = meter.createCounter(metric_name, params)
      break
    }
    case MetricType.GAUGE: {
      metric_name = `${metric_name}.gauge`
      metric = meter.createObservableGauge(metric_name, params)
      break
    }

  }

//  ctr = meter.createUpDownCounter('test')
}

export function SpanMaker(params: any) {
  const caller = SpanMaker.caller

//  ctr = meter.createUpDownCounter('test')
}

