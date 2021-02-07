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

        const logToFiles = config.logToFiles ?? DEFAULT_LOG_CONFIG.logToFiles
        const logDir = config.logPath ?? DEFAULT_LOG_CONFIG.logPath
        let logLevel = typeof config.logLevel == "string" ? logLevelMapping[config.logLevel] : config.logLevel
        logLevel = logLevel ?? DEFAULT_LOG_CONFIG.logLevel
        const logPath = path.join(logDir, "diagnostics.log")

        return new DiagnosticsLogger(logPath, logLevel, logToFiles);
    }

    static makeServiceLogger(serviceName: string, config: LoggerConfig): ServiceLogger {
        const logDir = config.logPath ?? DEFAULT_LOG_CONFIG.logPath
        let logLevel = typeof config.logLevel == "string" ? logLevelMapping[config.logLevel] : config.logLevel
        logLevel = logLevel ?? DEFAULT_LOG_CONFIG.logLevel
        const logPath = path.join(logDir, `${serviceName}.log`)

        return new ServiceLogger(serviceName, logPath, logLevel)
    }
}