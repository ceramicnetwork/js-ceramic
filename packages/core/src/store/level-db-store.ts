import levelTs from 'level-ts'
import type Level from 'level-ts'
import { IKVStore, IKVStoreFindResult, StoreSearchParams } from './ikv-store.js'
import path from 'path'
import * as fs from 'fs'
import { DiagnosticsLogger, Networks } from '@ceramicnetwork/common'

// When Node.js imports a CJS module from ESM, it considers whole contents of `module.exports` as ESM default export.
// 'level-ts' is a CommomJS module, which exports Level constructor as `exports.default`.
// This `default` name has no special meaning from ESM perspective. It is just yet another name.
// Types provided by level-ts though make it appear as ESM default.
//
// So, here we untangle this mess, even if ugly.
// We import type information separately from code information, and then make sure we can access
// a properly typed constructor of `Level` (thus `LevelC`) exported from level-ts package.
//
// See also https://github.com/nodejs/node/blob/master/doc/api/esm.md#commonjs-namespaces,
const LevelC = (levelTs as any).default as unknown as typeof Level

const DEFAULT_LEVELDB_STORE_USE_CASE_NAME = 'default'
// When ELP existed ELP and Mainnet both utilized the elp location because they shared data.
// In order to not lose the data stored there we will continue to do use the elp location for mainnet.
export const OLD_ELP_DEFAULT_LOCATION = 'elp'

class NotFoundError extends Error {
  readonly notFound = true
}

class LevelDBStoreMap {
  readonly #storeRoot
  readonly networkName
  readonly #map: Map<string, Level>

  constructor(storeRoot: string, networkName: string, readonly logger: DiagnosticsLogger) {
    this.networkName = networkName
    this.#storeRoot = storeRoot
    this.#map = new Map<string, Level>()
  }

  createStore(fullLocation: string): Promise<void> {
    // Different LevelDB stores live in different subdirectories (named based use-cases with the default being 'networkName'
    // and others being `networkName-<useCaseName>` with useCaseNames passed as params by owners of the store map) in #storeRoot
    const storePath = path.join(this.#storeRoot, fullLocation)
    if (fs) {
      fs.mkdirSync(storePath, { recursive: true }) // create dir if it doesn't exist
    }

    const levelDb = new LevelC(storePath)
    // level-ts does not have an error handling exposed for opening errors. I access the private DB variable to add callbacks for logging.
    // @ts-ignore private field
    levelDb.DB.on('error', (err) => {
      this.logger.warn(
        `Received error when starting up leveldb at ${storePath} using level-ts: ${err}`
      )
    })

    this.#map.set(fullLocation, levelDb)

    // add a small delay after creating the leveldb instance before trying to use it.
    return new Promise((res) => setTimeout(res, 100))
  }

  private getStoreLocation(useCaseName: string, networkName = this.networkName): string {
    return useCaseName === DEFAULT_LEVELDB_STORE_USE_CASE_NAME
      ? networkName
      : `${networkName}-${useCaseName}`
  }

  private getFullLocation(useCaseName = DEFAULT_LEVELDB_STORE_USE_CASE_NAME): string {
    // Check if store exists at legacy ELP location
    if (this.networkName === Networks.MAINNET) {
      const elpLocation = this.getStoreLocation(useCaseName, OLD_ELP_DEFAULT_LOCATION)
      if (fs.existsSync(elpLocation)) {
        console.warn(
          `LevelDB store ${useCaseName} found with ELP location, using it instead of default mainnet location`
        )
        return elpLocation
      }
    }
    return this.getStoreLocation(useCaseName)
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

  async init(): Promise<void> {}

  close(useCaseName?: string): Promise<void> {
    // do nothing
    return
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
    const store = await this.#storeMap.get(params?.useCaseName)
    return await store.stream(searchParams)
  }

  async findKeys(params?: StoreSearchParams): Promise<Array<string>> {
    const searchParams: Record<string, any> = {
      keys: true,
      values: false,
      limit: params?.limit,
    }

    const store = await this.#storeMap.get(params?.useCaseName)
    // The return type of .stream is Array<{ key: , value: }>, but if values: false is used in params, then it actually returns Array<string>
    return (await store.stream(searchParams)) as unknown as Promise<Array<string>>
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
