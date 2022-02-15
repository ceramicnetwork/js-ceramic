import { LoggerModes, JetLogger as Logger } from 'jet-logger'
import logfmt from 'logfmt'
import * as util from 'util'
import flatten from 'flat'
import {
  ServiceLoggerBase,
  DiagnosticsLoggerBase,
  LogStyle,
  LogLevel,
  ServiceLog,
  WriteableStream,
} from './logger-base.js'

/**
 * Logs to the console based on log level
 */
export class DiagnosticsLogger extends DiagnosticsLoggerBase {
  constructor(logLevel: LogLevel, logToFiles: boolean, fileLogger?: WriteableStream) {
    super(logLevel, logToFiles, fileLogger)
    const removeTimestamp = true
    this.logger = Logger(LoggerModes.Console, '', removeTimestamp)
  }

  public log(style: LogStyle, content: string | Record<string, unknown> | Error): void {
    this.logger[style](content, this.includeStackTrace)
    if (this.logToFiles) {
      const now = new Date()
      const message = `[${now.toUTCString()}] ${content}\n`
      this.fileLogger.write(message)
    }
  }
}

/**
 * Logs content from app services to files
 */
export class ServiceLogger extends ServiceLoggerBase {
  /**
   * Writes the log message to the file stream and/or the console based on the config.
   * @param message Content to log
   */
  public write(message: string): void {
    super.write(message)

    if (this.logToFiles) {
      const now = new Date()
      // RFC1123 timestamp
      message = `[${now.toUTCString()}] service=${this.service} ${util
        .format(message, '\n')
        .replace(/\n\s*\n$/, '\n')}`
      this.stream.write(message)
    }
  }

  /**
   * Converts `serviceLog` key/value object to logfmt
   * @param serviceLog Service log object
   */
  public format(serviceLog: ServiceLog): string {
    return logfmt.stringify(flatten(serviceLog))
  }
}
