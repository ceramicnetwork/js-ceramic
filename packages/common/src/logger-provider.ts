import {
    DiagnosticsLogger,
    LogLevel,
    ServiceLogger,
    WriteableStream,
} from './loggers';
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

// Can't have a default log directory as that would require using the `path` module before we know
// for sure if it's safe to do so. If `logToFiles` is false we must avoid using any node-specific
// functionality as we might be running in-browser
const DEFAULT_LOG_CONFIG = {
    logLevel: LogLevel.important,
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
        logDirectory: config.logDirectory,
      }
      this._fileLoggerFactory = fileLoggerFactory
      if (this.config.logToFiles && !this._fileLoggerFactory) {
          throw new Error("Must provide a FileLoggerFactory in order to log to files")
      }
      this._diagnosticLogger = this._makeDiagnosticLogger()
    }

    private _getLogPath(filename: string) {
        if (!this.config.logToFiles) {
            throw new Error("Tried to generate log path when logToFiles is false") // This indicates a programming error
        }
        const logDirectory = this.config.logDirectory || path.join(os.homedir(), ".ceramic", "logs/")
        return path.join(logDirectory, filename)
    }

    private _makeDiagnosticLogger(): DiagnosticsLogger {
        let stream = null
        if (this.config.logToFiles) {
            stream = this._fileLoggerFactory(this._getLogPath("diagnostics.log"))
        }

        return new DiagnosticsLogger(this.config.logLevel, this.config.logToFiles, stream);
    }

    public getDiagnosticsLogger(): DiagnosticsLogger {
      return this._diagnosticLogger
    }

    public makeServiceLogger(serviceName: string): ServiceLogger {
        let stream = null
        if (this.config.logToFiles) {
            stream = this._fileLoggerFactory(this._getLogPath(`${serviceName}.log`))
        }

        return new ServiceLogger(serviceName, this.config.logLevel, this.config.logToFiles, stream)
    }
}
