import {
    DiagnosticsLogger,
    LogLevel,
    ServiceLogger,
    WriteableStream,
} from '@ceramicnetwork/logger';
import path from "path";
import os from "os";

export interface FileLoggerFactory {
    (logPath: string): WriteableStream;
}

export interface LoggerConfig {
    logDirectory?: string,
    logLevel?: LogLevel,
    logToFiles?: boolean,
}

const DEFAULT_LOG_CONFIG = {
    logLevel: LogLevel.important,
    logDirectory: path.join(os.homedir(), ".ceramic", "logs/"),
    logToFiles: false
}


/**
 * Global Logger factory
 */
export class LoggerProvider {
    public readonly config: LoggerConfig

    private readonly _diagnosticLogger: DiagnosticsLogger
    private readonly _fileLoggerFactory: FileLoggerFactory

    constructor(config: LoggerConfig = {}, fileLoggerFactory?: FileLoggerFactory) {
      this.config = {
        logLevel: config.logLevel !== undefined ? config.logLevel : DEFAULT_LOG_CONFIG.logLevel,
        logToFiles: config.logToFiles !== undefined ? config.logToFiles : DEFAULT_LOG_CONFIG.logToFiles,
        logDirectory: config.logDirectory !== undefined ? config.logDirectory : DEFAULT_LOG_CONFIG.logDirectory,
      }
      this._fileLoggerFactory = fileLoggerFactory
      if (this.config.logToFiles && !this._fileLoggerFactory) {
          throw new Error("Must provide a FileLoggerFactory in order to log to files")
      }
      this._diagnosticLogger = this._makeDiagnosticLogger()
    }

    private _makeDiagnosticLogger(): DiagnosticsLogger {
        const logPath = path.join(this.config.logDirectory, "diagnostics.log")
        const stream = this._fileLoggerFactory(logPath)

        return new DiagnosticsLogger(this.config.logLevel, this.config.logToFiles, stream);
    }

    public getDiagnosticsLogger(): DiagnosticsLogger {
      return this._diagnosticLogger
    }

    public makeServiceLogger(serviceName: string): ServiceLogger {
        const logPath = path.join(this.config.logDirectory, `${serviceName}.log`)
        const stream = this._fileLoggerFactory(logPath)

        return new ServiceLogger(serviceName, this.config.logLevel, this.config.logToFiles, stream)
    }
}
