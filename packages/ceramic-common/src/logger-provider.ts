import log, { Logger, LogLevelDesc, MethodFactory } from 'loglevel'
import prefix from 'loglevel-plugin-prefix'
import cloneDeep from 'lodash.clonedeep'

/**
 * Default logger options
 */
const defaultOpts: Options = {
    level: 'info',
    format: 'text',
    stacktrace: {
        levels: ['trace', 'warn', 'error'],
        depth: 3,
        excess: 0,
    },
}

/**
 * Logger options
 */
interface Options {
    level?: string;
    format?: string; // [text | json]
    stacktrace?: {
        levels: ['trace', 'warn', 'error'];
        depth: 3;
        excess: 0;
    };
    component?: string;
}

/**
 * Plugin options
 */
interface PluginOptions {
    [index: string]: any;
}

/**
 * Function type for plugins
 * @dev Must call `setLevel` on `rootLogger` to be enabled
 */
type Plugin = (rootLogger: log.RootLogger, loggerOptions: Options, pluginOptions?: PluginOptions) => void;

/**
 * Global Logger factory
 */
class LoggerProvider {
    private static options: Options;

    /**
     * Initialize root logger
     * @param opts - Options
     * @returns Modified options
     */
    static init(opts = defaultOpts): Options {
        this.options = Object.assign(defaultOpts, opts)

        if (this.options.level) {
            log.setLevel(this.options.level as LogLevelDesc)
        } else {
            log.enableAll() // enable all levels (TRACE)
        }

        LoggerProvider._applyPrefix()
        LoggerProvider._includeJsonPlugin()
        return cloneDeep(this.options)
    }

    /**
     * Adds `plugin` to the logger instance
     * @param plugin Plugin function to add
     * @param loggerOptions Options returned from LoggerProvider.init
     * @param pluginOptions Options specific to `plugin`
     */
    static addPlugin(plugin: Plugin, loggerOptions: Options, pluginOptions?: PluginOptions): void {
        plugin(log, loggerOptions, pluginOptions)
    }

    /**
     * Applies prefix
     * @private
     */
    static _applyPrefix(): void {
        prefix.reg(log)
        prefix.apply(log, {
            format(level, name, timestamp) {
                return LoggerProvider._toText(timestamp, level, name)
            },
            timestampFormatter(date) {
                return date.toISOString()
            }
        })
    }

    /**
     * Simple JSON plugin
     * @private
     */
    static _includeJsonPlugin(): void {
        const originalFactory = log.methodFactory;

        log.methodFactory = (methodName: string, logLevel: any, loggerName: string): MethodFactory => {
            const rawMethod = originalFactory(methodName, logLevel, loggerName);
            return (...args: any[]): any => {
                if (this.options.format !== 'json') {
                    rawMethod(...args)
                    return
                }
                const timestamp = new Date().toISOString()
                const hasStacktrace = !!LoggerProvider._stacktrace()
                const needStack = hasStacktrace && this.options.stacktrace.levels.some(level => level === methodName)

                let stacktrace = needStack ? LoggerProvider._stacktrace() : '';
                if (stacktrace) {
                    const lines = stacktrace.split('\n');
                    lines.splice(0, this.options.stacktrace.excess + 3);
                    const { depth } = this.options.stacktrace;
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
                    component: this.options.component || undefined
                }))
            }
        };
        log.setLevel(log.getLevel());
    }

    /**
     * Formats to text
     */
    static _toText(timestamp: any, level: any, name: any): string {
        if (this.options.format === 'json') {
            return "" // no prefix
        }
        return `[${timestamp}] ${level} ${this.options.component ? this.options.component : ""} ${name}:`
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
    MethodFactory as LoggerMethodFactory,
    Options as LoggerOptions,
    Plugin as LoggerPlugin,
    PluginOptions as LoggerPluginOptions,
}
