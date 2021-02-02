import { DiagnosticsLogger, LogLevel } from '@ceramicnetwork/logger';
import path from "path";
import os from "os";

// Invalid to access before calling `initializeLogger()`
export let logger: DiagnosticsLogger


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
    static init(config: LoggerConfig) {
        config = { ...DEFAULT_LOG_CONFIG, ...config }

        const logLevel: LogLevel = typeof config.logLevel == "string" ? logLevelMapping[config.logLevel] : config.logLevel
        logger = new DiagnosticsLogger(config.logPath, logLevel, config.logToFiles);
    }
}