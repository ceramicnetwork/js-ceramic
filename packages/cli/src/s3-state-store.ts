import {
  StreamState,
  Stream,
  StreamUtils,
  DiagnosticsLogger,
  Networks,
} from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'
import { StateStore } from '@ceramicnetwork/core'
import toArray from 'stream-to-array'
import PQueue from 'p-queue'
import { S3Store } from './s3-store.js'

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
  #store: S3Store
  #logger: DiagnosticsLogger
  /**
   * Limit reading to +MAX_CONCURRENT_READS+ requests per second
   */
  readonly #loadingLimit = new PQueue({
    intervalCap: MAX_LOAD_RPS,
    interval: 1000,
    carryoverConcurrencyCount: true,
  })

  constructor(logger: DiagnosticsLogger) {
    this.#logger = logger
  }

  /**
   * Open pinning service.
   * Always store the pinning state in a network-specific directory.
   */
  async open(store: S3Store): Promise<void> {
    this.#store = store
    await this.#store.init()
    if (this.#store.networkName == Networks.MAINNET || this.#store.networkName == Networks.ELP) {
      // If using "mainnet", check for data under an 'elp' directory first. This is because older
      // versions of Ceramic only supported an 'elp' network as an alias for mainnet and stored
      // state store data under 'elp' instead of 'mainnet' by mistake, and we don't want to lose
      // that data if it exists.
      const hasPinnedStreams = !(await this.#store.isEmpty())
      if (hasPinnedStreams) {
        this.#logger.verbose(
          `Detected existing state store data under 'elp' directory. Continuing to use 'elp' directory to store state store data`
        )
      }
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
      return await this.#store.find({ limit })
    } else {
      const exists = Boolean(await this.load(streamId.baseID))
      return exists ? [streamId.toString()] : []
    }
  }

  /**
   * Close pinning service
   */
  async close(): Promise<void> {
    await this.#store.close()
    this.#store = undefined
  }
}
