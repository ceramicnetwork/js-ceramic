import { IKVStoreA, IKVStoreFindResult, StoreSearchParams } from './ikv-store.js'
import { DiagnosticsLogger } from '@ceramicnetwork/common'
import { Level } from 'level'
import all from 'it-all'
import map from 'it-map'

class NotFoundError extends Error {
  readonly notFound = true
}

export class LevelKVStore implements IKVStoreA {
  readonly #open: (useCaseName?: string) => Promise<Level>

  constructor(
    readonly level: Level,
    readonly logger: DiagnosticsLogger,
    readonly networkName: string,
    open: (useCaseName?: string) => Promise<Level>
  ) {
    this.#open = open
  }

  async init(): Promise<void> {
    // do nothing
    return
  }

  close(useCaseName?: string): Promise<void> {
    // do nothing
    return
  }

  async del(key: string, useCaseName?: string): Promise<void> {
    const store = await this.#open(useCaseName)
    try {
      return await store.del(key)
    } catch (err) {
      const msg = `Error deleting key ${key} from leveldb state store: ${err}`
      this.logger.warn(msg)
      throw new Error(msg)
    }
  }

  async get(key: string, useCaseName?: string): Promise<any> {
    const store = await this.#open(useCaseName)
    try {
      return await store.get(key)
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

  async isEmpty(params?: StoreSearchParams): Promise<boolean> {
    const keys = await this.findKeys(params)
    return keys.length === 0
  }

  async exists(key: string, useCaseName?: string): Promise<boolean> {
    try {
      const val = await this.get(key, useCaseName)
      return typeof val === 'string'
    } catch (e) {
      if (/Key not found in database/.test(e.toString())) {
        return false
      } else {
        throw e
      }
    }
  }

  async find(params?: StoreSearchParams): Promise<Array<IKVStoreFindResult>> {
    const searchParams: Record<string, any> = {
      keys: true,
      values: true,
      limit: params?.limit,
    }
    if (params?.gt) searchParams.gt = params.gt
    const store = await this.#open(params?.useCaseName)
    return all(
      map(store.iterator(searchParams), (r) => {
        return {
          key: r[0],
          value: r[1],
        }
      })
    )
  }

  async findKeys(params?: StoreSearchParams): Promise<Array<string>> {
    const searchParams: Record<string, any> = {
      keys: true,
      values: false,
      limit: params?.limit,
    }

    const store = await this.#open(params?.useCaseName)
    return all(
      map(store.iterator(searchParams), (r) => {
        return r[0]
      })
    )
  }

  async put(key: string, value: any, useCaseName?: string): Promise<void> {
    const store = await this.#open(useCaseName)
    try {
      await store.put(key, value)
    } catch (err) {
      const msg = `Error storing key ${key} to leveldb state store: ${err}`
      this.logger.warn(msg)
      throw new Error(msg)
    }
  }
}
