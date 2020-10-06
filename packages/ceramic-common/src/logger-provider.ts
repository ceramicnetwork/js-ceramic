import chalk from 'chalk'
import fs from 'fs'
import log, { Logger, LogLevelDesc, MethodFactory } from 'loglevel'
import prefix from 'loglevel-plugin-prefix'
import util from 'util'
import { DoctypeUtils } from "@ceramicnetwork/ceramic-common"
import { Doctype } from './doctype'

/**
 * Logger colors
 */
const colors: Record<string, any> = {
    TRACE: chalk.magenta,
    DEBUG: chalk.cyan,
    INFO: chalk.blue,
    WARN: chalk.yellow,
    ERROR: chalk.red,
}

/**
 * Default logger options
 */
const defaultOpts: Options = {
    colors: false,
    level: 'info',
    format: 'text',
    stacktrace: {
        levels: ['trace', 'warn', 'error'],
        depth: 3,
        excess: 0,
    },
    outputToFiles: false,
    outputPath: undefined,
    getDocument: null
}

/**
 * Logger options
 */
interface Options {
    level?: string;
    colors?: boolean;
    format?: string; // [text | json]
    stacktrace?: {
        levels: ['trace', 'warn', 'error'];
        depth: 3;
        excess: 0;
    };
    component?: string;
    outputToFiles?: boolean;
    outputPath?: string;
    getDocument?: (docId: string) => Promise<Doctype>;
}

/**
 * Global Logger factory
 */
class LoggerProvider {

    /**
     * Initialize root logger
     * @param opts - Options
     */
    static init(opts = defaultOpts): void {
        const options = Object.assign(defaultOpts, opts)

        if (options.level) {
            log.setLevel(options.level as LogLevelDesc)
        } else {
            log.enableAll() // enable all levels (TRACE)
        }

        LoggerProvider._applyPrefix(options)
        if (options.outputToFiles) {
            LoggerProvider._includeFilePlugin(options)
        }
        LoggerProvider._includeJsonPlugin(options)
    }

    /**
     * Applies prefix
     * @private
     */
    static _applyPrefix(options: Options): void {
        prefix.reg(log)
        prefix.apply(log, {
            format(level, name, timestamp) {
                return LoggerProvider._toText(options, timestamp, level, name)
            },
            timestampFormatter(date) {
                return date.toISOString()
            }
        })
    }

    /**
     * Plugin to append log messages to files named after components
     * @notice If no component name is given 'default' will be included in the file name
     * @param options Should include `component` name string and `outputPath` string
     */
    static _includeFilePlugin (options: Options): void {
        const originalFactory = log.methodFactory;
        let basePath = options.outputPath
        if ((basePath === undefined) || (basePath === '')) {
            basePath = '/usr/local/var/log/ceramic/'
        }
        if (!basePath.endsWith('/')) {
            basePath = basePath + '/'
        }

        log.methodFactory = (methodName: string, logLevel: any, loggerName: string): MethodFactory => {
            const rawMethod = originalFactory(methodName, logLevel, loggerName);
            return (...args: any[]): any => {
                const message = LoggerProvider._interpolate(args)
                const namespace = options.component ? options.component.toLowerCase() : 'default'
                fs.mkdir(basePath, { recursive: true }, (err) => {
                    if (err && (err.code != 'EEXIST')) console.warn('WARNING: Can not write logs to files', err)
                    else {
                        const filePrefix = basePath + loggerName.toLowerCase()
                        const filePath = `${filePrefix}-${namespace}.log`

                        this._writeStream(filePath, message, 'a')
                        const docId = this._writeDocId(filePrefix, message)
                        this._write3id(filePrefix, docId, options.getDocument)
                    }
                })
                rawMethod(...args)
            }
        };
        log.setLevel(log.getLevel());
    }

    static _writeDocId(filePrefix: string, message: string) {
        const lookup = '/ceramic/'
        const docIdIndex = message.indexOf(lookup)

        if (docIdIndex > -1) {
            const docIdSubstring = message.substring(docIdIndex)
            const match = docIdSubstring.match(/\/ceramic\/\w+/)

            if (match !== null) {
                const docId = match[0]
                const filePath = filePrefix + '-docids.log'
                this._writeStream(filePath, docId, 'w')
                return docId
            }
        }
    }

    static async _write3id(filePrefix: string, docId: string, getDocument: (docId: string) => Promise<Doctype>) {
        if (!getDocument || !docId) return

        const doc = await getDocument(docId)
        const docState = DoctypeUtils.serializeState(doc.state)

        let is3id = false
        try {
            is3id = docState.metadata.tags.includes('3id')
        } catch (error) {
            return
        }

        if (is3id) {
            const filePath = filePrefix + '-3ids.log'
            this._writeStream(filePath, docId, 'w')
        }
    }
    
    static _writeStream(filePath: string, message: string, writeFlag: string) {
        const stream = fs.createWriteStream(
            filePath,
            { flags: writeFlag }
        )
        stream.write(util.format(message) + '\n')
        stream.end()
    }

    /**
     * Simple JSON plugin
     * @private
     */
    static _includeJsonPlugin(options: Options): void {
        const originalFactory = log.methodFactory;

        log.methodFactory = (methodName: string, logLevel: any, loggerName: string): MethodFactory => {
            const rawMethod = originalFactory(methodName, logLevel, loggerName);
            return (...args: any[]): any => {
                if (options.format !== 'json') {
                    rawMethod(...args)
                    return
                }
                const timestamp = new Date().toISOString()
                const hasStacktrace = !!LoggerProvider._stacktrace()
                const needStack = hasStacktrace && options.stacktrace.levels.some(level => level === methodName)

                let stacktrace = needStack ? LoggerProvider._stacktrace() : '';
                if (stacktrace) {
                    const lines = stacktrace.split('\n');
                    lines.splice(0, options.stacktrace.excess + 3);
                    const { depth } = options.stacktrace;
                    if (depth && lines.length !== depth + 1) {
                        const shrink = lines.splice(0, depth);
                        stacktrace = shrink.join('\n');
                        if (lines.length) {
                            stacktrace += `\n    and ${lines.length} more`;
                        }
                    } else {
                        stacktrace = lines.join('\n');
                    }
                }

                rawMethod(JSON.stringify({
                    message: LoggerProvider._interpolate(args),
                    level: {
                        label: methodName, value: logLevel,
                    },
                    logger: loggerName || '',
                    timestamp,
                    stacktrace,
                    component: options.component || undefined
                }))
            }
        };
        log.setLevel(log.getLevel());
    }

    /**
     * Formats to text
     */
    static _toText(options: Options, timestamp: any, level: any, name: any): string {
        if (options.format === 'json') {
            return "" // no prefix
        }
        if (!options.colors) {
            return `[${timestamp}] ${level} ${options.component ? options.component : ""} ${name}:`
        }
        return `${chalk.gray(`[${timestamp}]`)} ${colors[level.toUpperCase()](level)} ${options.component ? chalk.gray(options.component) : ""} ${chalk.green(`${name}:`)}`
    }

    /**
     * Gets possible stacktrace
     * @private
     */
    static _stacktrace(): any[string] {
        try {
            throw new Error();
        } catch (trace) {
            return trace.stack;
        }
    }

    /**
     * Interpolate parameters
     * https://github.com/kutuluk/loglevel-plugin-remote/blob/master/src/remote.js
     * @private
     */
    static _interpolate(array: any[]): string {
        let result = '';
        let index = 0;

        if (array.length > 1 && typeof array[0] === 'string') {
            result = array[0].replace(/(%?)(%([sdjo]))/g, (match, escaped, ptn, flag) => {
                if (!escaped) {
                    index += 1;
                    const arg = array[index];
                    let a = '';
                    switch (flag) {
                        case 's':
                            a += arg;
                            break;
                        case 'd':
                            a += +arg;
                            break;
                        case 'j':
                            a = LoggerProvider._safeStringify(arg);
                            break;
                        case 'o': {
                            let obj = LoggerProvider._safeStringify(arg);
                            if (obj[0] !== '{' && obj[0] !== '[') {
                                obj = `<${obj}>`;
                            }
                            a = LoggerProvider._constructorName(arg) + obj;
                            break;
                        }
                    }
                    return a;
                }
                return match;
            });

            // update escaped %% values
            result = result.replace(/%{2,2}/g, '%');
            index += 1;
        }

        // arguments remaining after formatting
        if (array.length > index) {
            if (result) result += ' ';
            result += array.slice(index).join(' ');
        }
        return result;
    }

    /**
     * Gets possible constructor name
     * @private
     */
    static _constructorName(obj: any): string {
        if (!Object.getOwnPropertyDescriptor || !Object.getPrototypeOf) {
            return Object.prototype.toString.call(obj).slice(8, -1);
        }
        // https://github.com/nodejs/node/blob/master/lib/internal/util.js
        while (obj) {
            const descriptor = Object.getOwnPropertyDescriptor(obj, 'constructor');
            if (descriptor !== undefined && typeof descriptor.value === 'function' && descriptor.value.name !== '') {
                return descriptor.value.name;
            }
            obj = Object.getPrototypeOf(obj);
        }
        return '';
    }

    /**
     * Tries to JSON stringify
     * @param obj - Input
     * @param indent - Ident value
     * @private
     */
    static _safeStringify(obj: any, indent = 0): string {
        let cache: any[] = [];
        const retVal = JSON.stringify(
            obj, (key, value) =>
                typeof value === "object" && value !== null
                    ? cache.includes(value)
                    ? undefined // Duplicate reference found, discard key
                    : cache.push(value) && value // Store value in our collection
                    : value,
            indent
        );
        cache = null
        return retVal
    }
}

export {
    LoggerProvider,
    Logger,
    log as RootLogger,
}
