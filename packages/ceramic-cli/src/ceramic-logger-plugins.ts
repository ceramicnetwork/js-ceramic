import fs from 'fs'
import util from 'util'

import {
    Logger,
    LoggerMethodFactory,
    LoggerOptions,
    LoggerProvider,
    LoggerPluginOptions
} from "@ceramicnetwork/ceramic-common"

/**
 * Plugin for the root logger from the `loglevel` library to write logs to files
 */
export class LogToFiles {
    /**
     * Modifies `rootLogger` to append log messages to files
     * @param rootLogger Root logger to use throughout the library
     * @param loggerOptions Not used by this plugin so should be null
     * @param pluginOptions Should include `logPath` string to be used a directory to write files to
     */
    public static main (rootLogger: Logger, loggerOptions: LoggerOptions, pluginOptions: LoggerPluginOptions): void {
        const originalFactory = rootLogger.methodFactory;
        let basePath = pluginOptions.logPath
        if ((basePath === undefined) || (basePath === '')) {
            basePath = '/usr/local/var/log/ceramic/'
        }
        if (!basePath.endsWith('/')) {
            basePath = basePath + '/'
        }

        rootLogger.methodFactory = (methodName: string, logLevel: any, loggerName: string): LoggerMethodFactory => {
            const rawMethod = originalFactory(methodName, logLevel, loggerName);
            return (...args: any[]): any => {
                const message = LoggerProvider._interpolate(args)
                fs.mkdir(basePath, { recursive: true }, (err) => {
                    if (err && (err.code != 'EEXIST')) console.warn('WARNING: Can not write logs to files', err)
                    else {
                        const filePrefix = basePath + loggerName.toLowerCase()
                        const filePath = `${filePrefix}.log`

                        LogToFiles._writeStream(filePath, message, 'a')
                        LogToFiles._writeDocId(filePrefix, message)
                    }
                })
                rawMethod(...args)
            }
        };
        rootLogger.setLevel(rootLogger.getLevel());
    }
    /**
     * Opens a filesystem stream and writes `message` to it
     * @param filePath Full path of file to write to
     * @param message Message to write to `filePath`
     * @param writeFlag Specifies writing method (e.g. "a" for append, "w" for overwrite)
     */
    private static _writeStream (filePath: string, message: string, writeFlag: string): void {
        const stream = fs.createWriteStream(
            filePath,
            { flags: writeFlag }
        )
        stream.write(util.format(message) + '\n')
        stream.end()
    }
    /**
     * Writes the docId in `message` to `filePath`, if `message` contains a docId.
     * @notice The write operation overwrites any existing file.
     * @param filePath Full path of file to write to
     * @param message Message to write to `filePath`
     */
    private static _writeDocId (filePrefix: string, message: string): void {
        const lookup = '/ceramic/'
        const docIdIndex = message.indexOf(lookup)

        if (docIdIndex > -1) {
            const docIdSubstring = message.substring(docIdIndex)
            const match = docIdSubstring.match(/\/ceramic\/\w+/)

            if (match !== null) {
                const docId = match[0]
                const filePath = filePrefix + '-docids.log'
                LogToFiles._writeStream(filePath, docId, 'w')
            }
        }
    }
}
