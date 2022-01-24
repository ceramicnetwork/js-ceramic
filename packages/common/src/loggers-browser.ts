import {
  ServiceLoggerBase,
  DiagnosticsLoggerBase,
  LogStyle,
  LogLevel,
  ServiceLog,
} from './logger-base.js'
import flatten from 'flat'

const consoleLogger = {
  info: console.log,
  imp: console.log,
  warn: console.warn,
  err: console.error,
}

/**
 * Logs to the console based on log level
 */
export class DiagnosticsLogger extends DiagnosticsLoggerBase {
  constructor(logLevel: LogLevel) {
    super(logLevel, false)
    this.logger = consoleLogger
  }

  public log(style: LogStyle, content: string | Record<string, unknown> | Error): void {
    // simple, does not allow removeTimestamp and include stack trace option
    this.logger[style](content)
  }
}

/**
 * Logs content from app services to console
 */
export class ServiceLogger extends ServiceLoggerBase {
  constructor(service: string, logLevel: LogLevel) {
    super(service, logLevel, false)
  }
  public format(serviceLog: ServiceLog): string {
    return JSON.stringify(flatten(serviceLog))
  }
}
