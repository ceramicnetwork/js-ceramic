import { DiagnosticsLogger, LogLevel, ServiceLogger } from '@ceramicnetwork/logger';
import path from "path";
import os from "os";


export interface LoggerConfig {
    logPath?: string,
    logLevel?: LogLevel | string,
    logToFiles?: boolean,
}


const logLevelMapping = {
    'debug': LogLevel.debug,
    'important': LogLevel.important,
    'warn': LogLevel.warn
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

    static makeDiagnosticLogger(config: LoggerConfig): DiagnosticsLogger {
        config = { ...DEFAULT_LOG_CONFIG, ...config }

        const logLevel: LogLevel = typeof config.logLevel == "string" ? logLevelMapping[config.logLevel] : config.logLevel
        const logPath = path.join(config.logPath, "diagnostics.log")
        return new DiagnosticsLogger(logPath, logLevel, config.logToFiles);
    }

    static makeServiceLogger(serviceName: string, config: LoggerConfig): ServiceLogger {
        config = { ...DEFAULT_LOG_CONFIG, ...config }

        const logLevel: LogLevel = typeof config.logLevel == "string" ? logLevelMapping[config.logLevel] : config.logLevel
        const logPath = path.join(config.logPath, `${serviceName}.log`)
        return new ServiceLogger(serviceName, logPath, logLevel)
    }
}