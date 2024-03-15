import { Level } from 'level'
import { IKVStore, IKVStoreFindResult, StoreSearchParams } from './ikv-store.js'
import path from 'path'
import * as fs from 'fs'
import { DiagnosticsLogger, Networks } from '@ceramicnetwork/common'
import all from 'it-all'
import map from 'it-map'

const DEFAULT_LEVELDB_STORE_USE_CASE_NAME = 'default'
// When ELP existed ELP and Mainnet both utilized the elp location because they shared data.
// In order to not lose the data stored there we will continue to do use the elp location for mainnet.
export const OLD_ELP_DEFAULT_LOCATION = 'elp'

class NotFoundError extends Error {
  readonly notFound = true

  constructor(key: string) {
    super(`Error fetching key ${key} from leveldb state store: Key not found in database`)
  }
}

class LevelDBStoreMap {
  readonly #storeRoot
  readonly networkName
  readonly #map: Map<string, Level>
  #fullLocations: Record<string, string> = {}

  constructor(storeRoot: string, networkName: string, readonly logger: DiagnosticsLogger) {
    this.networkName = networkName
    this.#storeRoot = storeRoot
    this.#map = new Map<string, Level>()
  }

  async createStore(fullLocation: string): Promise<void> {
    // Different LevelDB stores live in different subdirectories (named based use-cases with the default being 'networkName'
    // and others being `networkName-<useCaseName>` with useCaseNames passed as params by owners of the store map) in #storeRoot
    const storePath = path.join(this.#storeRoot, fullLocation)
    if (fs) {
      // FIXME
      fs.mkdirSync(storePath, { recursive: true }) // create dir if it doesn't exist
    }

    const levelDb = new Level(storePath, { valueEncoding: 'json' })
    await levelDb.open()

    this.#map.set(fullLocation, levelDb)
  }

  private getStoreLocation(useCaseName: string, networkName = this.networkName): string {
    return useCaseName === DEFAULT_LEVELDB_STORE_USE_CASE_NAME
      ? networkName
      : `${networkName}-${useCaseName}`
  }

  private getFullLocation(useCaseName = DEFAULT_LEVELDB_STORE_USE_CASE_NAME): string {
    let fullLocation = this.#fullLocations[useCaseName]
    if (fullLocation != null) {
      return fullLocation
    }

    // Check if store exists at legacy ELP location
    if (this.networkName === Networks.MAINNET) {
      const elpLocation = this.getStoreLocation(useCaseName, OLD_ELP_DEFAULT_LOCATION)
      const storePath = path.join(this.#storeRoot, elpLocation)
      if (fs.existsSync(storePath)) {
        // Use ELP location if store exists
        this.logger.warn(
          `LevelDB store ${useCaseName} found with ELP location, using it instead of default mainnet location`
        )
        fullLocation = elpLocation
      }
    }

    // Get store location if not already set
    if (fullLocation == null) {
      fullLocation = this.getStoreLocation(useCaseName)
    }
    // Cache resolved location
    this.#fullLocations[useCaseName] = fullLocation

    return fullLocation
  }

  async get(useCaseName?: string): Promise<Level> {
    const location = this.getFullLocation(useCaseName)
    if (!this.#map.get(location)) {
      await this.createStore(location)
    }
    return this.#map.get(location)
  }

  values(): IterableIterator<Level> {
    return this.#map.values()
  }
}

export class LevelDbStore implements IKVStore {
  readonly #storeMap: LevelDBStoreMap

  constructor(readonly logger: DiagnosticsLogger, storeRoot: string, networkName: string) {
    this.#storeMap = new LevelDBStoreMap(storeRoot, networkName, logger)
  }

  get networkName(): string {
    return this.#storeMap.networkName
  }

  async init(): Promise<void> {
    // do nothing
    return
  }

  async close(useCaseName?: string): Promise<void> {
    const store = await this.#storeMap.get(useCaseName)
    await store.close()
  }

  async del(key: string, useCaseName?: string): Promise<void> {
    const store = await this.#storeMap.get(useCaseName)
    try {
      return await store.del(key)
    } catch (err) {
      const msg = `Error deleting key ${key} from leveldb state store: ${err}`
      this.logger.warn(msg)
      throw new Error(msg)
    }
  }

  async get(key: string, useCaseName?: string): Promise<any> {
    const store = await this.#storeMap.get(useCaseName)
    try {
      return await store.get(key)
    } catch (err: any) {
      const msg = `Error fetching key ${key} from leveldb state store: ${err}`
      if (err.notFound) {
        // Key not found errors are common and expected, it's too verbose to log them every time.
        throw new NotFoundError(key)
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
    const store = await this.#storeMap.get(params?.useCaseName)
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

    const store = await this.#storeMap.get(params?.useCaseName)
    return all(
      map(store.iterator(searchParams), (r) => {
        return r[0]
      })
    )
  }

  async put(key: string, value: any, useCaseName?: string): Promise<void> {
    const store = await this.#storeMap.get(useCaseName)
    try {
      await store.put(key, value)
    } catch (err) {
      const msg = `Error storing key ${key} to leveldb state store: ${err}`
      this.logger.warn(msg)
      throw new Error(msg)
    }
  }
}
