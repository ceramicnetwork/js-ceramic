import {
  DiagnosticsLogger,
  Networks, Stream,
  StreamState,
  StreamStateHolder,
  StreamUtils
} from '@ceramicnetwork/common'
import { StateStoreInterface } from './state-store-interface.js'
import { StreamID } from '@ceramicnetwork/streamid'
import { LevelStore } from './level-store.js'


/**
 * Ceramic store for saving stream state to a local leveldb instance
 */
export class LevelStateStore implements StateStoreInterface {
  #stateStoreStream = 'state-store'
  #store: LevelStore
  #logger: DiagnosticsLogger

  constructor(logger: DiagnosticsLogger) {
    this.#logger = logger
  }

  private getStreamKey(streamID?: StreamID): string {
    return streamID ?
      `${this.#stateStoreStream}-${streamID.toString()}` :
      `${this.#stateStoreStream}-`
  }

  /**
   * Gets internal db
   */
  get store(): LevelStore {
    return this.#store
  }

  /**
   * Open pinning service.
   * Always store the pinning state in a network-specific directory.
   */
  async open(store: LevelStore): Promise<void> {
    this.#store = store
    await this.#store.init()
    if (this.#store.networkName == Networks.MAINNET || this.#store.networkName == Networks.ELP) {
      // If using "mainnet", check for data under an 'elp' directory first. This is because older
      // versions of Ceramic only supported an 'elp' network as an alias for mainnet and stored
      // state store data under 'elp' instead of 'mainnet' by mistake, and we don't want to lose
      // that data if it exists.
      const hasPinnedStreams = !(await this.#store.isEmpty({ all: this.getStreamKey() }))
      if (hasPinnedStreams) {
        this.#logger.verbose(
          `Detected existing state store data under 'elp' directory. Continuing to use 'elp' directory to store state store data`
        )
      }
    }
  }

  /**
   * Pin stream
   * @param streamStateHolder - Stream instance
   */
  async saveFromStreamStateHolder(streamStateHolder: StreamStateHolder): Promise<void> {
    await this.#store.put(
      this.getStreamKey(streamStateHolder.id),
      StreamUtils.serializeState(streamStateHolder.state)
    )
  }

  /**
   * Pin stream
   * @param stream - Stream instance
   */
  async saveFromStream(stream: Stream): Promise<void> {
    await this.#store.put(
      this.getStreamKey(stream.id.baseID),
      JSON.stringify(StreamUtils.serializeState(stream.state))
    )
  }

  /**
   * Load stream state
   * @param streamId - Stream ID
   */
  async load(streamId: StreamID): Promise<StreamState> {
    try {
      const state = await this.#store.get(
        this.getStreamKey(streamId.baseID)
      )
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
    await this.#store.del(
      this.getStreamKey(streamId.baseID)
    )
  }

  /**
   * List pinned stream
   * @param streamId - Stream ID
   * @param limit - limit on number of results
   */
  async list(streamId?: StreamID | null, limit?: number): Promise<string[]> {
    let streamIds: string[]
    if (streamId == null) {
      return this.#store.find({
        all: this.getStreamKey(),
        limit
      })
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
    await this.#store.close()
    this.#store = undefined
  }
}
