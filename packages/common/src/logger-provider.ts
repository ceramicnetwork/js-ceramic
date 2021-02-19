import { DiagnosticsLogger, LogLevel, ServiceLogger } from '@ceramicnetwork/logger';
import path from "path";
import os from "os";


export interface LoggerConfig {
    logPath?: string,
    logLevel?: LogLevel,
    logToFiles?: boolean,
}

const DEFAULT_LOG_CONFIG = {
    logLevel: LogLevel.important,
    logPath: path.join(os.homedir(), ".ceramic", "logs/"),
    logToFiles: false
}

/**
 * Global Logger factory
 */
export class LoggerProvider {
    public readonly config: LoggerConfig

    private readonly _diagnosticLogger: DiagnosticsLogger

    constructor(config: LoggerConfig = {}) {
      this.config = {
        logLevel: config.logLevel !== undefined ? config.logLevel : DEFAULT_LOG_CONFIG.logLevel,
        logToFiles: config.logToFiles !== undefined ? config.logToFiles : DEFAULT_LOG_CONFIG.logToFiles,
        logPath: config.logPath !== undefined ? config.logPath : DEFAULT_LOG_CONFIG.logPath,
      }
      this._diagnosticLogger = this._makeDiagnosticLogger()
    }

    private _makeDiagnosticLogger(): DiagnosticsLogger {
        const logPath = path.join(this.config.logPath, "diagnostics.log")

        return new DiagnosticsLogger(this.config.logLevel, this.config.logToFiles, logPath);
    }

    public getDiagnosticsLogger(): DiagnosticsLogger {
      return this._diagnosticLogger
    }

    public makeServiceLogger(serviceName: string): ServiceLogger {
        const logPath = path.join(this.config.logPath, `${serviceName}.log`)

        return new ServiceLogger(serviceName, logPath, this.config.logLevel, this.config.logToFiles)
    }
}
