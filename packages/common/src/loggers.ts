import { Logger, LoggerModes } from '@overnightjs/logger';
import * as logfmt from 'logfmt';
import util from 'util';
import flatten from 'flat'

enum LogStyle {
  verbose = 'info',
  info = 'info',
  imp = 'imp',
  warn = 'warn',
  err = 'err'
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
export class DiagnosticsLogger {
  public readonly logLevel: LogLevel;
  private readonly logger: Logger;
  private readonly fileLogger: WriteableStream;
  private readonly includeStackTrace: boolean;
  private readonly logToFiles

  constructor(logLevel: LogLevel, logToFiles: boolean, fileLogger?: WriteableStream) {
    this.logLevel = logLevel;
    this.includeStackTrace = this.logLevel <= LogLevel.debug ? true : false;
    this.logToFiles = logToFiles
    this.fileLogger = fileLogger

    const removeTimestamp = true;
    this.logger = new Logger(LoggerModes.Console, '', removeTimestamp);
  }

  /**
   * Calls `this.debug`. Used for stream interfaces.
   * @param content Content to log
   */
  public write(content: string | Record<string, unknown> | Error): void {
    this.debug(content);
  }

  public verbose(content: string | Record<string, unknown> | Error): void {
    if (this.logLevel > LogLevel.verbose) {
      return;
    }
    this.log(LogStyle.verbose, content);
  }

  public debug(content: string | Record<string, unknown> | Error): void {
    if (this.logLevel > LogLevel.debug) {
      return;
    }
    this.log(LogStyle.info, content);
  }

  public imp(content: string | Record<string, unknown> | Error): void {
    if (this.logLevel > LogLevel.important) {
      return;
    }
    this.log(LogStyle.imp, content);
  }

  public warn(content: string | Record<string, unknown> | Error): void {
    this.log(LogStyle.warn, content);
  }

  public err(content: string | Record<string, unknown> | Error): void {
    this.log(LogStyle.err, content);
  }

  private log(style: LogStyle, content: string | Record<string, unknown> | Error): void {
    this.logger[style](content, this.includeStackTrace);
    if (this.logToFiles) {
      const now = new Date();
      const message = `[${now.toUTCString()}] ${content}\n`;
      this.fileLogger.write(message);
    }
  }
}

interface ServiceLog {
  [key: string]: any;
}

/**
 * Logs content from app services to files
 */
export class ServiceLogger {
  public readonly service: string;
  public readonly logToFiles: boolean
  public readonly logToConsole: boolean
  public readonly logLevel: LogLevel

  private readonly stream: WriteableStream;


  constructor(service: string, logLevel: LogLevel, logToFiles: boolean, stream: WriteableStream) {
    this.service = service;
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
    this.write(ServiceLogger.format(serviceLog))
  }

  /**
   * Writes the log message to the file stream and/or the console based on the config.
   * @param message Content to log
   */
  public write(message: string): void {
    const now = new Date();
    // RFC1123 timestamp
    message = `[${now.toUTCString()}] service=${this.service} ${message}`;

    if (this.logToFiles) {
      this.stream.write(util.format(message, '\n').replace(/\n\s*\n$/, '\n'));
    }

    if (this.logToConsole) {
      console.log(message);
    }
  }

  /**
   * Converts `serviceLog` key/value object to logfmt
   * @param serviceLog Service log object
   */
  public static format(serviceLog: ServiceLog): string {
    return logfmt.stringify(flatten(serviceLog));
  }
}
