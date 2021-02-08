import { Logger, LoggerModes } from '@overnightjs/logger';
import * as logfmt from 'logfmt';
import util from 'util';
import { RotatingFileStream } from './stream-helpers';
import flatten from 'flat'

enum LogStyle {
  info = 'info',
  imp = 'imp',
  warn = 'warn',
  err = 'err'
}

export enum LogLevel {
  debug = 1,
  important = 2,
  warn = 3
}

/**
 * Logs to the console based on log level
 */
export class DiagnosticsLogger {
  public readonly logLevel: LogLevel;
  private readonly logger: Logger;
  private readonly fileLogger: RotatingFileStream;
  private readonly includeStackTrace: boolean;
  private readonly logToFiles

  constructor(logPath: string, logLevel: LogLevel, logToFiles: boolean) {
    this.logLevel = logLevel;
    this.includeStackTrace = this.logLevel == LogLevel.debug ? true : false;
    this.logToFiles = logToFiles

    const removeTimestamp = true;
    this.logger = new Logger(LoggerModes.Console, '', removeTimestamp);
    if (this.logToFiles) {
      this.fileLogger = new RotatingFileStream(logPath, true);
    }
  }

  /**
   * Calls `this.debug`. Used for stream interfaces.
   * @param content Content to log
   */
  public write(content: string | object): void {
    this.debug(content);
  }

  public debug(content: string | object): void {
    if (this.logLevel > LogLevel.debug) {
      return;
    }
    this.log(LogStyle.info, content);
  }

  public imp(content: string | object): void {
    if (this.logLevel > LogLevel.important) {
      return;
    }
    this.log(LogStyle.imp, content);
  }

  public warn(content: string | object): void {
    this.log(LogStyle.warn, content);
  }

  public err(content: string | object): void {
    this.log(LogStyle.err, content);
  }

  private log(style: LogStyle, content: string | object): void {
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
  public readonly filePath: string;
  private readonly stream: RotatingFileStream;
  private readonly logLevel: LogLevel
  private readonly logToFiles: boolean

  constructor(service: string, filePath: string, logLevel: LogLevel, logToFiles: boolean) {
    this.service = service;
    this.filePath = filePath;
    this.logLevel = logLevel
    this.logToFiles = logToFiles

    if (this.logToFiles) {
      const writeImmediately = true;
      this.stream = new RotatingFileStream(this.filePath, writeImmediately);
    }
  }

  /**
   * Converts the service log to logfmt and writes it to `this.filePath`
   * @param serviceLog Service log object
   * @param logToConsole True to log to console in addition to file
   */
  public log(serviceLog: ServiceLog, logToConsole?: boolean): void {
    const now = new Date();
    // RFC1123 timestamp
    const message = `[${now.toUTCString()}] service=${this.service} ${ServiceLogger.format(serviceLog)}`;

    if (this.logToFiles) {
      this.stream.write(util.format(message, '\n'));
    }

    // Always respect `logToConsole` if it is explicitly passed.  If it isn't provided, then decide
    // whether to log to console based on the log level.
    logToConsole = logToConsole ?? this.logLevel == LogLevel.debug
    if (logToConsole) {
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