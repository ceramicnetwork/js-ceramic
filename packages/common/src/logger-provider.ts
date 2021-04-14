import { DiagnosticsLogger, ServiceLogger } from './loggers';
import { LoggerProviderBase } from './logger-base'
import path from "path";
import os from "os";

/**
 * Global Logger factory
 */
export class LoggerProvider extends LoggerProviderBase {
    private _getLogPath(filename: string) {
        if (!this.config.logToFiles) {
            throw new Error("Tried to generate log path when logToFiles is false") // This indicates a programming error
        }
        const logDirectory = this.config.logDirectory || path.join(os.homedir(), ".ceramic", "logs/")
        return path.join(logDirectory, filename)
    }

    protected _makeDiagnosticLogger(): DiagnosticsLogger {
        let stream = null
        if (this.config.logToFiles) {
            stream = this._fileLoggerFactory(this._getLogPath("diagnostics.log"))
        }

        return new DiagnosticsLogger(this.config.logLevel, this.config.logToFiles, stream);
    }

    public makeServiceLogger(serviceName: string): ServiceLogger {
        let stream = null
        if (this.config.logToFiles) {
            stream = this._fileLoggerFactory(this._getLogPath(`${serviceName}.log`))
        }

        return new ServiceLogger(serviceName, this.config.logLevel, this.config.logToFiles, stream)
    }
}
