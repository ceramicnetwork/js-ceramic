import levelTs from 'level-ts'
import type Level from 'level-ts'
import { StoreForNetwork, StoreSearchParams } from './store-for-network.js'
import path from 'path'
import fs from 'fs'

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

export class LevelStore implements StoreForNetwork {
  readonly networkName: string
  readonly #storeRoot: string
  #store: Level

  constructor(storeRoot: string, networkName: string) {
    this.networkName = networkName
    this.#storeRoot = storeRoot
  }

  async init(): Promise<void> {
    const storePath = path.join(this.#storeRoot, this.networkName)
    if (fs) {
      fs.mkdirSync(storePath, { recursive: true }) // create dir if it doesn't exist
    }
    this.#store = new LevelC(storePath)
  }

  async del(key: string): Promise<void> {
    await this.#store.del(key)
  }

  async get(key: string): Promise<string> {
    return await this.#store.get(key)
  }

  async isEmpty(params?: StoreSearchParams): Promise<boolean> {
    const result = await this.find({
      limit: 1,
      ...params
    })
    return result.length > 0
  }

  async find(params?: StoreSearchParams): Promise<Array<string>> {
    const seachParams: Record<string, any> = {
      keys: true,
      values: false,
      ...params
    }

    const results = await this.#store.stream(seachParams)
    return results.map( result => { return result.value } )
  }

  async put(key: string, value: string): Promise<void> {
    return await this.#store.put(key, value)
  }

  async close(): Promise<void> {
    // do nothing
    return
  }
}
