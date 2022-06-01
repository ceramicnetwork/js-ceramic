
import { MeterProvider } from '@opentelemetry/sdk-metrics-base'
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'
import { Resource } from '@opentelemetry/resources'

// Metric names
// the parameters will be used to distinguish the endpoint, type of call etc
// be flexible about what we record, as the dependency in the grafana does not see this code

export const REQUEST_METRIC = 'request'
export const RESPONSE_METRIC = 'response'  // unused for now
export const RECEIVED_METRIC = 'received'
export const PUBLISHED_METRIC = 'published'
export const PINNED_METRIC = 'pinned'

const VALID_METRIC_NAMES = [REQUEST_METRIC, RESPONSE_METRIC, RECEIVED_METRIC, PUBLISHED_METRIC, PINNED_METRIC]


const exporterConfig = PrometheusExporter.DEFAULT_OPTIONS

class _Metrics {
    constructor() {
        this.config = exporterConfig
        this.counters = {}
        this.histograms = {}
    }

    /* Set up the exporter at run time, after we have read the configuration */ 
    instantiate(enableExporter: boolean, port: Number) {
        this.config['preventServerStart'] = ! enableExporter
        this.config['port'] = this.config.metricsPort

        this.metricExporter = new PrometheusExporter(this.config)

        this.meterProvider = new MeterProvider({
            resource: new Resource({
               [SemanticResourceAttributes.SERVICE_NAME]: 'js-ceramic',
            }),
        });

        // Creates MeterProvider and installs the exporter as a MetricReader
        this.meterProvider.addMetricReader(metricExporter);

       // Meter for js-ceramic
       this.meter = meterProvider.getMeter('js-ceramic');
    }

    // could have subclasses or specific functions with set params, but we want to
    // easily and quickly change what is recorded, there are no code dependencies on it

    count(name:string, value:number, params?:any) {
        if (! VALID_METRIC_NAMES.includes(name)) {
            throw("Error: metric names must be defined in VALID_METRIC_NAMES")
        }
        if ( name not in this.counters) {
            this.counters[name] = meter.createCounter(name)
        }
        this.counters[name].add(value, params)
    }
    record(name:string, value:number, params?:any) {
        if (! VALID_METRIC_NAMES.includes(name)) {
            throw("Error: metric names must be defined in VALID_METRIC_NAMES")
        }
        if (name not in this.histograms) {
            this.histograms[name] = meter.createHistogram(name)
        }
        this.histograms[name].record(value, params)
    }
}

