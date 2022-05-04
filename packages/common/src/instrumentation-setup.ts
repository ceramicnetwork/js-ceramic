import {
  BasicTracerProvider,
  ConsoleSpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base'

import {trace} from '@opentelemetry/api'

const provider = new BasicTracerProvider();

// Configure span processor to send spans to the exporter
provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
provider.register();

// This is what we'll access in all instrumentation code
export const tracer = trace.getTracer(
  'simple-console-tracer-node'
  // TODO automate the naming convention of the metrics based on the caller
  // see loggers.ts for this ^^
);
