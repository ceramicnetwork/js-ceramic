import {
  StreamState,
  Stream,
  StreamUtils,
  DiagnosticsLogger,
  Networks,
} from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'
import { StateStore } from '@ceramicnetwork/core'
import LevelUp from 'levelup'
import S3LevelDOWN from 's3leveldown'
import toArray from 'stream-to-array'
import PQueue from 'p-queue'

/**
 * Maximum GET/HEAD requests per second to AWS S3
 */
const MAX_LOAD_RPS = 4000

/**
 * Helper function for listing keys from a given S3 LevelDB instance.
 */
async function _listAll(store, limit?: number): Promise<string[]> {
  const bufArray = await toArray(store.createKeyStream({ limit }))
  return bufArray.map((buf) => buf.toString())
}

/**
 * Ceramic store for saving stream state to S3
 */
export class S3StateStore implements StateStore {
  readonly #bucketName: string
  readonly #logger: DiagnosticsLogger
  /**
   * Limit reading to +MAX_CONCURRENT_READS+ requests per second
   */
  readonly #loadingLimit = new PQueue({
    intervalCap: MAX_LOAD_RPS,
    interval: 1000,
    carryoverConcurrencyCount: true,
  })
  #store

  constructor(bucketName: string, logger: DiagnosticsLogger) {
    this.#bucketName = bucketName
    this.#logger = logger
  }

  private _makeStore(directoryName: string) {
    const location = this.#bucketName + '/ceramic/' + directoryName + '/state-store'
    // @ts-ignore
    return new LevelUp(new S3LevelDOWN(location))
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
    } else {
      this.#store = this._makeStore(networkName)
    }
  }

  /**
   * Pin stream
   * @param stream - Stream instance
   */
  async save(stream: Stream): Promise<void> {
    await this.#store.put(
      stream.id.baseID.toString(),
      JSON.stringify(StreamUtils.serializeState(stream.state))
    )
  }

  /**
   * Load stream state
   * @param streamId - stream ID
   */
  async load(streamId: StreamID): Promise<StreamState> {
    return this.#loadingLimit.add(async () => {
      try {
        const state = await this.#store.get(streamId.baseID.toString())
        if (state) {
          return StreamUtils.deserializeState(JSON.parse(state))
        } else {
          return null
        }
      } catch (err) {
        if (err.notFound) {
          return null // return null for non-existent entry
        }
        throw err
      }
    })
  }

  /**
   * Unpin stream
   * @param streamId - Stream ID
   */
  async remove(streamId: StreamID): Promise<void> {
    await this.#store.del(streamId.baseID.toString())
  }

  /**
   * List pinned streams
   * @param streamId - Stream ID
   * @param limit - limit on number of results
   */
  async list(streamId?: StreamID | null, limit?: number): Promise<string[]> {
    if (streamId == null) {
      return _listAll(this.#store)
    } else {
      const exists = Boolean(await this.load(streamId.baseID))
      return exists ? [streamId.toString()] : []
    }
  }

  /**
   * Close pinning service
   */
  async close(): Promise<void> {
    this.#store.close()
  }
}
