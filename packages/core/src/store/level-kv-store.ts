import type {
  ChainedKVBatch,
  IKVStore,
  IKVStoreFindResult,
  StoreSearchParams,
} from './ikv-store.js'
import type { DiagnosticsLogger } from '@ceramicnetwork/common'
import { Level, type IteratorOptions } from 'level'
import all from 'it-all'
import map from 'it-map'
import type { DeepNonNullable } from 'ts-essentials'

class NotFoundError extends Error {
  readonly notFound = true
}

function definiteSearchParams<T extends IteratorOptions<string, string>>(
  obj: T
): DeepNonNullable<T> {
  return Object.keys(obj).reduce(
    (acc, key) =>
      obj[key] === undefined || obj[key] === null ? { ...acc } : { ...acc, [key]: obj[key] },
    {}
  ) as DeepNonNullable<T>
}

export class LevelKVStore implements IKVStore {
  constructor(readonly level: Level, readonly logger: DiagnosticsLogger) {}

  async init(): Promise<void> {
    // do nothing
    return
  }

  batch(): ChainedKVBatch {
    return this.level.batch()
  }

  async close(): Promise<void> {
    await this.level.close()
  }

  async del(key: string): Promise<void> {
    try {
      return await this.level.del(key)
    } catch (err) {
      const msg = `Error deleting key ${key} from leveldb state store: ${err}`
      this.logger.warn(msg)
      throw new Error(msg)
    }
  }

  async get(key: string): Promise<any> {
    try {
      return await this.level.get(key)
    } catch (err) {
      const msg = `Error fetching key ${key} from leveldb state store: ${err}`
      if (err.notFound) {
        // Key not found errors are common and expected, it's too verbose to log them every time.
        throw new NotFoundError(msg)
      } else {
        this.logger.warn(msg)
        throw new Error(msg)
      }
    }
  }

  async isEmpty(params?: Partial<StoreSearchParams>): Promise<boolean> {
    const keys = await this.findKeys(params)
    return keys.length === 0
  }

  async exists(key: string): Promise<boolean> {
    try {
      const val = await this.get(key)
      return typeof val === 'string'
    } catch (e: any) {
      if (e.notFound) {
        return false
      } else {
        throw e
      }
    }
  }

  async find(params?: Partial<StoreSearchParams>): Promise<Array<IKVStoreFindResult>> {
    const searchParams = definiteSearchParams({
      keys: true,
      values: true,
      ...params,
    })
    return all(
      map(this.level.iterator(searchParams), (r) => {
        return {
          key: r[0],
          value: r[1],
        }
      })
    )
  }

  async findKeys(params?: Partial<StoreSearchParams>): Promise<Array<string>> {
    const searchParams = definiteSearchParams({
      keys: true,
      values: false,
      ...params,
    })

    return all(
      map(this.level.iterator(searchParams), (r) => {
        return r[0]
      })
    )
  }

  async put(key: string, value: any): Promise<void> {
    try {
      await this.level.put(key, value)
    } catch (err) {
      const msg = `Error storing key ${key} to leveldb state store: ${err}`
      this.logger.warn(msg)
      throw new Error(msg)
    }
  }
}
