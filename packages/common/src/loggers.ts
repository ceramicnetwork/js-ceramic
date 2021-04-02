import { Logger, LoggerModes } from '@overnightjs/logger';
import * as logfmt from 'logfmt';
import util from 'util';
import flatten from 'flat'
import { 
  ServiceLoggerBase, 
  DiagnosticsLoggerBase, 
  LogStyle, 
  LogLevel, 
  ServiceLog,
WriteableStream } from './logger-base'

/**
 * Logs to the console based on log level
 */
export class DiagnosticsLogger extends DiagnosticsLoggerBase {

  constructor(logLevel: LogLevel, logToFiles: boolean, fileLogger?: WriteableStream) {
    super(logLevel, logToFiles, fileLogger)
    const removeTimestamp = true;
    this.logger = new Logger(LoggerModes.Console, '', removeTimestamp);
  }

  public log(style: LogStyle, content: string | Record<string, unknown> | Error): void {
    this.logger[style](content, this.includeStackTrace);
    if (this.logToFiles) {
      const now = new Date();
      const message = `[${now.toUTCString()}] ${content}\n`;
      this.fileLogger.write(message);
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
      this.stream.write(util.format(message, '\n'));
    }
  }

  /**
   * Converts `serviceLog` key/value object to logfmt
   * @param serviceLog Service log object
   */
  public format(serviceLog: ServiceLog): string {
    return logfmt.stringify(flatten(serviceLog));
  }
}
