import fs from 'fs'
import path from 'path'
import util from 'util'

import {
    Logger,
    LoggerMethodFactory,
    LoggerOptions,
    LoggerProvider,
    LoggerPluginOptions
} from "@ceramicnetwork/common"
import DocID from '@ceramicnetwork/docid'
import * as logfmt from 'logfmt'
const flatten = require('flat')

const fsPromises = fs.promises

interface LogToFilesState {
    blockedFiles: BlockedFiles
}

export interface BlockedFiles {
    [filePath: string]: boolean
}

interface WriteResult {
    blocked: boolean
    filePath: string
}

/**
 * Plugin for the root logger from the `loglevel` library to write logs to files
 */
export class LogToFiles {
    private static MINUTES_TO_EXPIRATION = 60
    private static MAX_FILE_BYTES = 10000000 // 10 MB

    /**
     * Modifies `rootLogger` to append log messages to files
     * @param rootLogger Root logger to use throughout the library
     * @param pluginState Shared state used by this plugin
     * @param { null } loggerOptions Not used by this plugin so should be null
     * @param pluginOptions Should include `logPath` string to be used a directory to write files to
     */
    public static main (
        rootLogger: Logger,
        pluginState: LogToFilesState,
        loggerOptions: LoggerOptions,
        pluginOptions: LoggerPluginOptions
    ): void {
        const originalFactory = rootLogger.methodFactory;

        let basePath = pluginOptions.logPath
        if ((basePath === undefined) || (basePath === '')) {
            basePath = path.join(path.resolve(__dirname, '../'), 'logs/')
        }
        if (!basePath.endsWith('/')) {
            basePath = basePath + '/'
        }

        rootLogger.methodFactory = (methodName: string, logLevel: any, loggerName: string): LoggerMethodFactory => {
            const rawMethod = originalFactory(methodName, logLevel, loggerName);
            return (...args: any[]): any => {
                let message = LoggerProvider._interpolate(args)
                let jsonMessage
                try {
                    jsonMessage = JSON.parse(message)
                    message = logfmt.stringify(flatten(jsonMessage))
                } catch {
                    jsonMessage = {message: null}
                }
                fs.mkdir(basePath, { recursive: true }, async (err) => {
                    if (err && (err.code != 'EEXIST')) console.warn('WARNING: Can not write logs to files', err)
                    else {
                        const filePrefix = loggerName.toLowerCase()
                        await LogToFiles._write(pluginState.blockedFiles, basePath, filePrefix, message)
                        await LogToFiles._writeDocId(pluginState.blockedFiles, basePath, filePrefix, jsonMessage.message)
                    }
                })
                rawMethod(...args)
            }
        };
        rootLogger.setLevel(rootLogger.getLevel());
    }

    /**
     * Appends `message` to file `${basePath}${filePrefix}.log`
     * @notice Rotates file if it is expired or of at least max size
     * @param basePath Base directory for file
     * @param filePrefix Prefix of file name to write to
     * @param message Message to write to file
     */
    private static async _write (
        blockedFiles: BlockedFiles,
        basePath: string,
        filePrefix: string,
        message: string
    ): Promise<void> {
        const filePath = `${basePath}${filePrefix}.log`
        await LogToFiles._shouldRotate(filePath) && await LogToFiles._rotate(filePath)
        const result = await LogToFiles._writeStream(blockedFiles, filePath, message, 'a')
        if (result.blocked) await LogToFiles._writeBlockedWarning(blockedFiles, basePath, filePath)
    }

    /**
     * Writes the docId in `message` to file, if `message` contains a docId
     * @notice The write operation overwrites the existing file at `${basePath}${filePrefix}.log`
     * @param basePath Base directory for file
     * @param filePrefix Prefix of file name to write to
     * @param jsonMessage Message containing the docId
     */
    private static async _writeDocId (
        blockedFiles: BlockedFiles,
        basePath: string,
        filePrefix: string,
        jsonMessage: any
    ): Promise<void> {
        if (!jsonMessage) {
            return
        }
        const docId = jsonMessage.doc
        const filePath = `${basePath}${filePrefix}-docids.log`
        const result = await LogToFiles._writeStream(blockedFiles, filePath, docId, 'w')
        if (result.blocked) await LogToFiles._writeBlockedWarning(blockedFiles, basePath, filePath)
    }

    /**
     * Logs and writes warning message about `filePath` being blocked.
     * @notice If the file that this tries to write to itself is blocked,
     * its message will be dropped and only appear in the console
     * @param basePath Base directory for file to write to
     * @param filePath Path to file that is blocked
     */
    private static async _writeBlockedWarning (
        blockedFiles: BlockedFiles,
        basePath: string,
        filePath: string
    ): Promise<void> {
        const loggerFilePath = basePath + 'logger.log'
        const message = `Stream blocked for file: ${filePath}\n`
        await LogToFiles._writeStream(blockedFiles, loggerFilePath, message, 'a')
    }

    /**
      * Writes `message` to a file and returns whether it is blocked or not
      * @notice If the file is currently being written to by an open stream or if
      * its buffer is full, the call to this method will return without writing
      * @param filePath Full path of file to write to
      * @param message Message to write to `filePath`
      * @param writeFlag Specifies writing method (e.g. "a" for append, "w" for overwrite)
      * @returns True if the stream is blocked and false otherwise
      */
    private static async _writeStream (
        blockedFiles: BlockedFiles,
        filePath: string,
        message: string,
        writeFlag: string
    ): Promise<WriteResult> {
        if (blockedFiles[filePath]) {
            console.warn(`Stream busy for ${filePath}. Some logs may be dropped.`)
            return { blocked: blockedFiles[filePath], filePath }
        }

        blockedFiles[filePath] = true

        const stream = fs.createWriteStream(filePath, { flags: writeFlag })
        stream.on('error', (err) => {
            throw err
        })
        stream.on('drain', () => {
            blockedFiles[filePath] = false
            return
        })
        stream.on('finish', () => {
            blockedFiles[filePath] = false
            return
        })
        blockedFiles[filePath] = !stream.write(util.format(message) + '\n', () => {
            stream.end()
            return
        })
        return { blocked: blockedFiles[filePath], filePath }
    }

    /**
     * Returns true if the file should be rotated, false otherwise
     * @param filePath Full path of file
     * @returns If the file should be rotated
     */
    private static async _shouldRotate (filePath: string): Promise<boolean> {
        let fileStats = null

        try {
            fileStats = await fsPromises.stat(filePath)
        } catch (err) {
            if (err.code == 'ENOENT') { // File not found
                return false
            }
            console.error(err)
            return true
        }

        if (!fileStats) {
            return true
        } else if (LogToFiles._isExpired(fileStats)) {
            return true
        } else if (LogToFiles._isMaxSize(fileStats)) {
            return true
        }

        return false
    }

    /**
     * Returns true if it has been `MINUTES_TO_EXPIRATION` minutes since the file was created
     * @notice Returns false if unable to get file creation datetime
     * @param fileStats `fs.Stats` of file
     * @returns If the file is expired
     */
    private static _isExpired (fileStats: fs.Stats): boolean {
        const { birthtime } = fileStats
        if (birthtime.getTime() == 0) {
            console.warn('WARNING: Unable to retrieve file birthtime')
            return false // Inconclusive
        }
        const minutesSinceBirth = (Date.now() - birthtime.getTime()) / (1000 * 60)
        return minutesSinceBirth >= LogToFiles.MINUTES_TO_EXPIRATION
    }

    /**
     * Returns true if file size is >= `MAX_FILE_BYTES`
     * @param fileStats `fs.Stats` of file
     * @returns If the file is at max size
     */
    private static _isMaxSize (fileStats: fs.Stats): boolean {
        const { size } = fileStats
        return size >= LogToFiles.MAX_FILE_BYTES
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
