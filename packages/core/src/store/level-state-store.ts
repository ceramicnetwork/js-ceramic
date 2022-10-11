import levelTs from 'level-ts'
import type Level from 'level-ts'
import {
  DiagnosticsLogger,
  Networks,
  StreamState,
  StreamStateHolder,
  StreamUtils,
} from '@ceramicnetwork/common'
import { StateStore } from './state-store.js'
import { StreamID } from '@ceramicnetwork/streamid'
import * as fs from 'fs'
import path from 'path'

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

/**
 * Helper function for listing keys from a given LevelDB instance.
 */
async function _listAll(store: Level, limit?: number): Promise<string[]> {
  return store.stream({ keys: true, values: false, limit })
}

/**
 * Ceramic store for saving stream state to a local leveldb instance
 */
export class LevelStateStore implements StateStore {
  #store: Level
  #logger: DiagnosticsLogger

  constructor(private storeRoot: string, logger: DiagnosticsLogger) {
    this.#logger = logger
  }

  /**
   * Gets internal db
   */
  get store(): Level {
    return this.#store
  }

  private _makeStore(directoryName: string): Level {
    const storePath = path.join(this.storeRoot, directoryName)
    if (fs) {
      fs.mkdirSync(storePath, { recursive: true }) // create dir if it doesn't exist
    }
    return new LevelC(storePath)
  }

  /**
   * Open pinning service.
   * Always store the pinning state in a network-specific directory.
   */
  async open(networkName: string): Promise<void> {
    if (networkName == Networks.MAINNET || networkName == Networks.ELP) {
      // If using "mainnet", check for data under an 'elp' directory first. This is because older
      // versions of Ceramic only supported an 'elp' network as an alias for mainnet and stored
      // state store data under 'elp' instead of 'mainnet' by mistake, and we don't want to lose
      // that data if it exists.
      const store = this._makeStore(Networks.ELP)
      const pinnedStreamIds = await _listAll(store, 1)
      if (pinnedStreamIds.length > 0) {
        this.#logger.verbose(
          `Detected existing state store data under 'elp' directory. Continuing to use 'elp' directory to store state store data`
        )
      }
      this.#store = store
      return
    }

    this.#store = this._makeStore(networkName)
  }

  /**
   * Pin stream
   * @param streamStateHolder - Stream instance
   */
  async save(streamStateHolder: StreamStateHolder): Promise<void> {
    await this.#store.put(
      streamStateHolder.id.toString(),
      StreamUtils.serializeState(streamStateHolder.state)
    )
  }

  /**
   * Load stream state
   * @param streamId - Stream ID
   */
  async load(streamId: StreamID): Promise<StreamState> {
    try {
      const state = await this.#store.get(streamId.baseID.toString())
      if (state) {
        return StreamUtils.deserializeState(state)
      } else {
        return null
      }
    } catch (err) {
      if (err.notFound) {
        return null // return null for non-existent entry
      }
      throw err
    }
  }

  /**
   * Unpin stream
   * @param streamId - Stream ID
   */
  async remove(streamId: StreamID): Promise<void> {
    await this.#store.del(streamId.baseID.toString())
  }

  /**
   * List pinned stream
   * @param streamId - Stream ID
   * @param limit - limit on number of results
   */
  async list(streamId?: StreamID | null, limit?: number): Promise<string[]> {
    let streamIds: string[]
    if (streamId == null) {
      return _listAll(this.#store, limit)
    } else {
      const exists = Boolean(await this.load(streamId.baseID))
      streamIds = exists ? [streamId.toString()] : []
    }
    return streamIds
  }

  /**
   * Close pinning service
   */
  async close(): Promise<void> {
    // Do Nothing
  }
}
