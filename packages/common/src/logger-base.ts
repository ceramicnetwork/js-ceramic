export enum LogStyle {
  verbose = 'info',
  info = 'info',
  imp = 'imp',
  warn = 'warn',
  err = 'err',
}

export enum LogLevel {
  verbose,
  debug,
  important,
  warn,
}

export interface WriteableStream {
  write: (message: string) => void
}

/**
 * Logs to the console based on log level
 */
export class DiagnosticsLoggerBase {
  public readonly logLevel: LogLevel
  protected logger: any
  protected readonly fileLogger: WriteableStream
  protected readonly includeStackTrace: boolean
  protected readonly logToFiles

  constructor(logLevel: LogLevel, logToFiles: boolean, fileLogger?: WriteableStream) {
    this.logLevel = logLevel
    this.includeStackTrace = this.logLevel <= LogLevel.debug ? true : false
    this.logToFiles = logToFiles
    this.fileLogger = fileLogger
  }

  /**
   * Calls `this.debug`. Used for stream interfaces.
   * @param content Content to log
   */
  public write(content: string | Record<string, unknown> | Error): void {
    this.debug(content)
  }

  public verbose(content: string | Record<string, unknown> | Error): void {
    if (this.logLevel > LogLevel.verbose) {
      return
    }
    this.log(LogStyle.verbose, content)
  }

  public debug(content: string | Record<string, unknown> | Error): void {
    if (this.logLevel > LogLevel.debug) {
      return
    }
    this.log(LogStyle.info, content)
  }

  public imp(content: string | Record<string, unknown> | Error): void {
    if (this.logLevel > LogLevel.important) {
      return
    }
    this.log(LogStyle.imp, content)
  }

  public warn(content: string | Record<string, unknown> | Error): void {
    this.log(LogStyle.warn, content)
  }

  public err(content: string | Record<string, unknown> | Error): void {
    this.log(LogStyle.err, content)
  }

  public log(style: LogStyle, content: string | Record<string, unknown> | Error): void {
    throw new Error('Not implmented in base class')
  }
}

export interface ServiceLog {
  [key: string]: any
}

/**
 * Logs content from app services to files and/or console
 */
export class ServiceLoggerBase {
  public readonly service: string
  public readonly logToFiles: boolean
  public readonly logToConsole: boolean
  public readonly logLevel: LogLevel

  protected readonly stream: WriteableStream

  constructor(service: string, logLevel: LogLevel, logToFiles: boolean, stream?: WriteableStream) {
    this.service = service
    this.logLevel = logLevel
    this.logToFiles = logToFiles
    this.stream = stream

    this.logToConsole = this.logLevel <= LogLevel.debug
  }

  /**
   * Converts the service log to logfmt and writes it to `this.filePath`
   * @param serviceLog Service log object
   */
  public log(serviceLog: ServiceLog): void {
    this.write(this.format(serviceLog))
  }

  /**
   * Writes the log message to the file stream and/or the console based on the config.
   * @param message Content to log
   */
  public write(message: string): void {
    const now = new Date()
    // RFC1123 timestamp
    message = `[${now.toUTCString()}] service=${this.service} ${message}`

    if (this.logToConsole) {
      console.log(message)
    }
  }

  /**
   * Converts `serviceLog` key/value object to logfmt
   * @param serviceLog Service log object
   */
  public format(serviceLog: ServiceLog): string {
    throw new Error('Not implmented in base class')
  }
}

export interface FileLoggerFactory {
  (logPath: string): WriteableStream
}

export interface LoggerConfig {
  logDirectory?: string
  logLevel?: LogLevel
  logToFiles?: boolean
}

// Can't have a default log directory as that would require using the `path` module before we know
// for sure if it's safe to do so. If `logToFiles` is false we must avoid using any node-specific
// functionality as we might be running in-browser
const DEFAULT_LOG_CONFIG = {
  logLevel: LogLevel.important,
  logToFiles: false,
}

/**
//  * Global Logger factory
//  */
export class LoggerProviderBase {
  public readonly config: LoggerConfig

  protected readonly _diagnosticLogger: DiagnosticsLoggerBase
  protected readonly _fileLoggerFactory: FileLoggerFactory

  constructor(config: LoggerConfig = {}, fileLoggerFactory?: FileLoggerFactory) {
    this.config = {
      logLevel: config.logLevel !== undefined ? config.logLevel : DEFAULT_LOG_CONFIG.logLevel,
      logToFiles:
        config.logToFiles !== undefined ? config.logToFiles : DEFAULT_LOG_CONFIG.logToFiles,
      logDirectory: config.logDirectory,
    }
    this._fileLoggerFactory = fileLoggerFactory
    if (this.config.logToFiles && !this._fileLoggerFactory) {
      throw new Error('Must provide a FileLoggerFactory in order to log to files')
    }
    this._diagnosticLogger = this._makeDiagnosticLogger()
  }

  protected _makeDiagnosticLogger(): DiagnosticsLoggerBase {
    throw new Error('Not implmented in base class')
  }

  public getDiagnosticsLogger(): DiagnosticsLoggerBase {
    return this._diagnosticLogger
  }

  public makeServiceLogger(serviceName: string): ServiceLoggerBase {
    throw new Error('Not implmented in base class')
  }
}
