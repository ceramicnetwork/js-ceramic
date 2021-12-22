import { DiagnosticsLogger, ServiceLogger } from './loggers-browser.js'
import { LoggerProviderBase } from './logger-base.js'

/**
 * Global Logger factory
 */
export class LoggerProvider extends LoggerProviderBase {
  protected _makeDiagnosticLogger(): DiagnosticsLogger {
    return new DiagnosticsLogger(this.config.logLevel)
  }

  public makeServiceLogger(serviceName: string): ServiceLogger {
    return new ServiceLogger(serviceName, this.config.logLevel)
  }
}
