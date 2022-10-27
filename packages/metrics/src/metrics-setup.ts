import { MeterProvider } from '@opentelemetry/sdk-metrics'
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'
import { Resource } from '@opentelemetry/resources'

// Metric names
// the parameters will be used to distinguish the endpoint, type of call etc
// be flexible about what we record, as the dependency in the grafana does not see this code

export enum METRIC_NAMES {
  COMMITS_STORED = 'commits_stored',
  ERROR_LOADING_STREAM = 'error_loading_stream',
  ERROR_STORING_COMMIT = 'error_storing_commit',
  HTTP_REQUEST = 'http_request',
  HTTP_RESPONSE = 'http_response',
  IPFS_TIMEOUT = 'ipfs_timeout',
  PUBSUB_RECEIVED = 'pubsub_received',
  PUBSUB_PUBLISHED = 'pubsub_published',
  STREAM_PINNED = 'stream_pinned',
  STREAM_UNPINNED = 'stream_unpinned',
}

export const UNKNOWN_CALLER = 'Unknown'

const exporterConfig = PrometheusExporter.DEFAULT_OPTIONS

/* eslint-disable  no-unused-vars */
class _NullLogger {
  debug(msg){}
  info(msg){}
  imp(msg){}
  warn(msg){}
  err(msg){}
}
/* eslint-enable no-unused-vars */

class _Metrics {
  protected caller
  protected readonly config
  protected readonly counters
  protected readonly histograms
  protected meter
  protected logger
  constructor() {
    this.caller = ''
    this.config = exporterConfig
    this.counters = {}
    this.histograms = {}
    this.meter = null
    this.logger = null
  }

  /* Set up the exporter at run time, after we have read the configuration */
  start(metrics_config: any = exporterConfig,
        caller: string = UNKNOWN_CALLER,
        logger: any = null) {

    this.config['serverStart'] = metrics_config.metricsExporterEnabled
    this.config['port'] = metrics_config.metricsPort

    this.caller = caller

    // accept a logger from the caller
    this.logger = logger || new _NullLogger()

    if (! metrics_config.metricsExporterEnabled) {
      this.logger.info("Metrics are disabled")
      // just leave meter set to null, all functions will be no-op
      return
    }

    try {
      const metricExporter = new PrometheusExporter(this.config)

      const meterProvider = new MeterProvider({
        resource: new Resource({
          [SemanticResourceAttributes.SERVICE_NAME]: caller,
        }),
      })
      // Creates MeterProvider and installs the exporter as a MetricReader
      meterProvider.addMetricReader(metricExporter)

      // Meter for calling application
      this.meter = meterProvider.getMeter(caller)
    } catch (error) {
      this.logger.warn(`Error starting metrics: {error}`)
      this.meter = null
      return 
    }

  }

  // could have subclasses or specific functions with set params, but we want to
  // easily and quickly change what is recorded, there are no code dependencies on it

  count(name: string, value: number, params?: any) {
    // If not initialized, just return

    if (!this.meter) {
      return
    }
    // Create this counter if we have not already
    if (!(name in this.counters)) {
      this.counters[name] = this.meter.createCounter(`${this.caller}:${name}`)
    }
    // Add to the count
    this.counters[name].add(value, params)
  }

  record(name: string, value: number, params?: any) {
    // If not initialized, just return
    if (!this.meter) {
      return
    }
    // Create this Histogram if we have not already
    if (!(name in this.histograms)) {
      this.histograms[name] = this.meter.createHistogram(`${this.caller}:${name}`)
    }
    // Record the observed value
    this.histograms[name].record(value, params)
  }
}

export const Metrics = new _Metrics()
