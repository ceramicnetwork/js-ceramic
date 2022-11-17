import levelTs from 'level-ts'
import type Level from 'level-ts'
import sublevel from 'sublevel'
import { StoreWrapperInterface, StoreSearchParams } from './store-wrapper-interface.js'
import path from 'path'
import * as fs from 'fs'
import { Networks } from '@ceramicnetwork/common'

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

class LevelStoreMap {
  readonly #storePath
  readonly networkName
  readonly #map: Map<string, Level>

  constructor(storeRoot: string, networkName: string) {
    this.networkName = networkName
    this.#storePath = path.join(
      storeRoot,
      // We want ELP and Mainnet to share data
      this.networkName === Networks.MAINNET ? Networks.ELP : this.networkName
    )
    if (fs) {
      fs.mkdirSync(this.#storePath, { recursive: true }) // create dir if it doesn't exist
    }
    this.#map = new Map<string, Level>()
    this.#map.set(this.getFullLocation(), this.createStore())

  }

  private getBaseLocation(): string {
    return 'root'
  }

  private createStore(sublevelName?: string): Level {
    if (!sublevelName) {
      return new LevelC(this.#storePath)
    } else {
      return new LevelC(sublevel(this.#map.get(this.getBaseLocation()), sublevelName))
    }
  }

  private getFullLocation(sublevelName?: string): string {
    if (sublevelName) {
      return `${this.getBaseLocation()}/${sublevelName}`
    } else {
      return this.getBaseLocation()
    }
  }

  get(sublevelName?: string): Level {
    const fullLocation = this.getFullLocation(sublevelName)
    if (!this.#map.get(fullLocation)) {
      this.#map.set(fullLocation, this.createStore(sublevelName))
    }
    return this.#map.get(fullLocation)
  }

  values(): IterableIterator<Level> {
    return this.#map.values()
  }
}

export class LevelDbStoreWrapper implements StoreWrapperInterface {
  readonly #storeMap: LevelStoreMap

  constructor(storeRoot: string, networkName: string) {
    this.#storeMap = new LevelStoreMap(storeRoot, networkName)
  }

  get networkName(): string {
    return this.#storeMap.networkName
  }

  async del(key: string, subChannel?: string): Promise<void> {
    await this.#storeMap.get(subChannel).del(key)
  }

  async get(key: string, subChannel?: string): Promise<any> {
    return await this.#storeMap.get(subChannel).get(key)
  }

  async isEmpty(params?: StoreSearchParams): Promise<boolean> {
    const result = await this.find({
      limit: params?.limit ?? 1,
    })
    return result.length > 0
  }

  async find(params?: StoreSearchParams): Promise<Array<any>> {
    const seachParams: Record<string, any> = {
      keys: true,
      values: false,
      limit: params?.limit
    }

    // The return type of .stram is Array<{ key: , value: }>, but if values: false is used in params, then it actually returns Array<string>
    return (await this.#storeMap.get(params?.subChannel).stream(seachParams)) as unknown as Array<string>
  }

  async put(key: string, value: any, subChannel?: string): Promise<void> {
    return await this.#storeMap.get(subChannel).put(key, value)
  }

  async close(): Promise<void> {
    // do nothing
    return
  }
}
