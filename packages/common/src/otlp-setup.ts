import {
  BasicTracerProvider,
  ConsoleSpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base'
import { MeterProvider, InstrumentType } from '@opentelemetry/sdk-metrics-base'
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


// see https://opentelemetry.io/docs/reference/specification/metrics/semantic_conventions/#general-metric-semantic-conventions
class MetricBase {
  private readonly name: string
  private readonly params: any
  public metric_type: string
  public metric: any
  public span: any

 // public readonly metricName: string
  // put stuff here to configure where the exporters go - to the agent, or to the console
  //public readonly config: MetricConfig
  constructor(name:string, params: any ) {
    this.name = name
    this.params = params
  }
  public metricName() {
    //const caller=metricName.caller.caller
    return `${this.name}.${this.metric_type}`
  }
}

export class Counter extends MetricBase {

  constructor(name:string, params: any ) {
     super(name, params)
     this.metric_type = InstrumentType.COUNTER
     this.metric = meter.createCounter(this.metricName()) // todo add params
  }
  public add(value:number) {
    this.metric.add(value)
  }
}

export class Histogram extends MetricBase {

  constructor(name:string, params: any ) {
    super(name, params)
    this.metric_type = InstrumentType.HISTOGRAM
    this.metric = meter.createHistogram(this.metricName()) // todo add params
  }
  public record(value:number) {
    this.metric.record(value)
  }
}

export class Span extends MetricBase {
  constructor(name:string, params: any ) {
    super(name, params)
    this.metric_type = 'span'
    this.span = tracer.startSpan(this.metricName()) // todo add params
  }
  public end() {
    this.span.end()
  }
//  ctr = meter.createUpDownCounter('test')
}

