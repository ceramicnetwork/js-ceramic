
import { MeterProvider } from '@opentelemetry/sdk-metrics-base'
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'
import { Resource } from '@opentelemetry/resources'

// Metric names
// the parameters will be used to distinguish the endpoint, type of call etc
// be flexible about what we record, as the dependency in the grafana does not see this code

export const METRIC_NAMES = {
    HTTP_REQUEST     : 'http_request',
    HTTP_RESPONSE    : 'http_response',
    PUBSUB_RECEIVED  : 'pubsub_received',
    PUBSUB_PUBLISHED : 'pubsub_published',
    STREAM_PINNED    : 'stream_pinned',
}

const exporterConfig = PrometheusExporter.DEFAULT_OPTIONS

class _Metrics {
    protected readonly config
    protected readonly counters
    protected readonly histograms
    protected meterProvider: MeterProvider
    protected metricExporter: PrometheusExporter
    protected meter
    constructor() {
        this.config = exporterConfig
        this.counters = {}
        this.histograms = {}
    }

    /* Set up the exporter at run time, after we have read the configuration */
    start(metrics_config: any = exporterConfig) {  // do not import type so as to be usable as a package anywhere

        this.config['preventServerStart'] = ! metrics_config.enableMetrics
        this.config['port'] = metrics_config.metricsPort

        this.metricExporter = new PrometheusExporter(this.config)

        this.meterProvider = new MeterProvider({
            resource: new Resource({
               [SemanticResourceAttributes.SERVICE_NAME]: 'js-ceramic',
            }),
        });

        // Creates MeterProvider and installs the exporter as a MetricReader
        this.meterProvider.addMetricReader(this.metricExporter);

       // Meter for js-ceramic
       this.meter = this.meterProvider.getMeter('js-ceramic')
    }

    // could have subclasses or specific functions with set params, but we want to
    // easily and quickly change what is recorded, there are no code dependencies on it

    count(name:string, value:number, params?:any) {
        if ( ! (name in METRIC_NAMES) ) {
            throw(`Error: ${name} must be defined in METRIC_NAMES`)
        }
        if ( ! (name in this.counters)) {
            this.counters[name] = this.meter.createCounter(name)
        }
        this.counters[name].add(value, params)
    }
    record(name:string, value:number, params?:any) {
        if (! (name in METRIC_NAMES)) {
            throw(`Error: ${name} must be defined in METRIC_NAMES`)
        }
        if (! (name in this.histograms)) {
            this.histograms[name] = this.meter.createHistogram(name)
        }
        this.histograms[name].record(value, params)
    }
}

export const Metrics = new _Metrics()
