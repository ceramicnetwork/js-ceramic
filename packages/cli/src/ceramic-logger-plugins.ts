import fs from 'fs'
import util from 'util'

import {
    Logger,
    LoggerMethodFactory,
    LoggerOptions,
    LoggerProvider,
    LoggerPluginOptions
} from "@ceramicnetwork/common"

const fsPromises = fs.promises

/**
 * Plugin for the root logger from the `loglevel` library to write logs to files
 */
export class LogToFiles {
    private blockedFiles: { [filePath: string]: boolean }
    private static MINUTES_TO_EXPIRATION = 60

    /**
     * Modifies `rootLogger` to append log messages to files
     * @param rootLogger Root logger to use throughout the library
     * @param { null } loggerOptions Not used by this plugin so should be null
     * @param pluginOptions Should include `logPath` string to be used a directory to write files to
     */
    public main (rootLogger: Logger, loggerOptions: LoggerOptions, pluginOptions: LoggerPluginOptions): void {
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
                fs.mkdir(basePath, { recursive: true }, async (err) => {
                    if (err && (err.code != 'EEXIST')) console.warn('WARNING: Can not write logs to files', err)
                    else {
                        const filePrefix = basePath + loggerName.toLowerCase()
                        const filePath = `${filePrefix}.log`

                        await this._writeFile(filePath, message, 'a')
                        await this._writeDocId(filePrefix, message)
                    }
                })
                rawMethod(...args)
            }
        };
        rootLogger.setLevel(rootLogger.getLevel());
    }

    /**
   * Writes `message` to a file
   * @notice If the file is currently being written to by an open stream or if
   * its buffer is full, the call to this method will return without writing
   * @param filePath Full path of file to write to
   * @param message Message to write to `filePath`
   * @param writeFlag Specifies writing method (e.g. "a" for append, "w" for overwrite)
   */
    private async _writeFile (filePath: string, message: string, writeFlag: string): Promise<void> {
        if (this.blockedFiles[filePath]) {
            console.warn(`Stream busy for ${filePath}. Some logs may be dropped.`)
            return
        }

        this.blockedFiles[filePath] = true

        const fileExpired = await LogToFiles._isExpired(filePath)
        fileExpired && await LogToFiles._rotate(filePath)

        const stream = fs.createWriteStream(filePath, { flags: writeFlag })
        stream.on('error', (err) => {
            console.warn(err)
            return
        })
        stream.on('drain', () => {
            this.blockedFiles[filePath] = false
            return
        })
        stream.on('finish', () => {
            this.blockedFiles[filePath] = false
            return
        })
        this.blockedFiles[filePath] = !stream.write(util.format(message) + '\n', () => {
            stream.end()
            return
        })
    }

    /**
     * Writes the docId in `message` to `filePath`, if `message` contains a docId.
     * @notice The write operation overwrites any existing file.
     * @param filePrefix Prefix of file name to write to
     * @param message Message to write to `filePath`
     */
    private async _writeDocId (filePrefix: string, message: string): Promise<void> {
        const lookup = '/ceramic/'
        const docIdIndex = message.indexOf(lookup)

        if (docIdIndex > -1) {
            const docIdSubstring = message.substring(docIdIndex)
            const match = docIdSubstring.match(/\/ceramic\/\w+/)

            if (match !== null) {
                const docId = match[0]
                const filePath = filePrefix + '-docids.log'
                this._writeFile(filePath, docId, 'w')
            }
        }
    }

    /**
     * Returns true if it has been `MINUTES_TO_EXPIRATION` minutes since the file was created
     * @notice Returns false if file is not found.
     * Returns true if unable to get file creation datetime for some other reason.
     * @param filePath Full path of file
     */
    private static async _isExpired (filePath: string): Promise<boolean> {
        try {
            const { birthtime } = await fsPromises.stat(filePath)
            const minutesSinceBirth = (Date.now() - birthtime.getTime()) / (1000 * 60)
            return minutesSinceBirth >= LogToFiles.MINUTES_TO_EXPIRATION
        } catch (err) {
            if (err.code == 'ENOENT') return false
            else console.error(err)
            return true
        }
    }

    /**
     * Renames the file given, appending `.old` to the file name
     * @notice If a file with the new name already exists, it is overwritten
     * @param filePath Full path of file
     */
    private static async _rotate (filePath: string): Promise<void> {
        try {
            await fsPromises.rename(filePath, `${filePath}.old`)
        } catch (err) {
            console.warn('WARNING: Log file rotation failed for', filePath, err)
        }
    }
}
