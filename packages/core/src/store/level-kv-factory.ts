import { type DiagnosticsLogger, Networks } from '@ceramicnetwork/common'
import type { IKVFactory } from './ikv-store.js'
import { join } from 'node:path'
import { access, mkdir } from 'node:fs/promises'
import { Mutex } from 'await-semaphore'
import { LevelKVStore } from './level-kv-store.js'
import { Level } from 'level'

export const ELP_NETWORK = 'elp'

export class LevelKVFactory implements IKVFactory {
  readonly #storeRoot: string
  readonly networkName: string
  readonly #cache: Map<string, LevelKVStore>
  readonly #createMutex: Mutex
  readonly #logger: DiagnosticsLogger

  constructor(storeRoot: string, networkName: string, logger: DiagnosticsLogger) {
    this.networkName = networkName
    this.#storeRoot = storeRoot
    this.#cache = new Map()
    this.#createMutex = new Mutex()
    this.#logger = logger
    this.open = this.open.bind(this)
  }

  private create(useCaseName: string | undefined): Promise<LevelKVStore> {
    return this.#createMutex.use(async () => {
      const found = this.#cache.get(useCaseName)
      if (found) return found
      const dirPath = await this.dirPath(useCaseName)

      const level = new Level(dirPath, { valueEncoding: 'json' })
      await level.open()
      const kv = new LevelKVStore(level, this.#logger)

      this.#cache.set(useCaseName, kv)
      return kv
    })
  }

  private subDir(name: string | undefined, network = this.networkName): string {
    if (name) {
      return `${network}-${name}`
    } else {
      return network
    }
  }

  private async dirPath(useCaseName: string | undefined): Promise<string> {
    // Check if store exists at legacy ELP location
    if (this.networkName === Networks.MAINNET) {
      const elpDir = this.subDir(useCaseName, ELP_NETWORK)
      const storePath = join(this.#storeRoot, elpDir)
      const isPresent = await access(storePath)
        .then(() => true)
        .catch(() => false)
      if (isPresent) {
        // Use ELP location if store exists
        this.#logger.warn(
          `LevelDB store ${useCaseName} found with ELP location, using it instead of default mainnet location`
        )
        return storePath
      }
    }
    const subDir = this.subDir(useCaseName)
    const dirPath = join(this.#storeRoot, subDir)
    await mkdir(dirPath, { recursive: true }) // create dir if it doesn't exist
    return dirPath
  }

  async open(name?: string): Promise<LevelKVStore> {
    const found = this.#cache.get(name)
    if (found) return found
    return this.create(name)
  }

  async close(): Promise<void> {
    for (const store of this.#cache.values()) {
      await store.close()
    }
  }
}
