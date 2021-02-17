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

    constructor(config?: LoggerConfig) {
      this.config = {...DEFAULT_LOG_CONFIG, ...config}
      this._diagnosticLogger = this._makeDiagnosticLogger()
    }

    private _makeDiagnosticLogger(): DiagnosticsLogger {
        const logPath = path.join(this.config.logPath, "diagnostics.log")

        return new DiagnosticsLogger(logPath, this.config.logLevel, this.config.logToFiles);
    }

    public getDiagnosticsLogger(): DiagnosticsLogger {
      return this._diagnosticLogger
    }

    public makeServiceLogger(serviceName: string): ServiceLogger {
        const logPath = path.join(this.config.logPath, `${serviceName}.log`)

        return new ServiceLogger(serviceName, logPath, this.config.logLevel, this.config.logToFiles)
    }
}
