import { StateStoreInterface } from './state-store-interface.js'
import { StoreForNetwork } from './store-for-network.js'
import { StreamID } from '@ceramicnetwork/streamid'
import {
  DiagnosticsLogger,
  Networks, Stream,
  StreamState,
  StreamStateHolder,
  StreamUtils
} from '@ceramicnetwork/common'

export class StateStore implements StateStoreInterface {
  #logger: DiagnosticsLogger
  #store: StoreForNetwork

  constructor(logger: DiagnosticsLogger) {
    this.#logger = logger
  }

  /**
   * Gets network name
   */
  get networkName(): string {
    return this.#store.networkName
  }

  /**
   * Gets store
   */
  get store(): StoreForNetwork {
    return this.#store
  }

  private throwIfNotOpened(): void {
    if (!this.#store) throw Error('State Store is closed, you need to call async open(), before performing other operations')
  }

  private getFullKey(streamID: StreamID): string {
    return streamID.toString()
  }

  async open(store: StoreForNetwork): Promise<void> {
    this.#store = store
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
   * Load stream state
   * @param streamId - Stream ID
   */
  async load(streamId: StreamID): Promise<StreamState> {
    this.throwIfNotOpened()
    try {
      const state = await this.#store.get(
        this.getFullKey(streamId.baseID)
      )
      if (state) {
        return StreamUtils.deserializeState(typeof state === 'string' ? JSON.parse(state) : state)
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
   * List pinned streams
   * @param streamId - Stream ID
   * @param limit - limit on number of results
   */
  async list(streamId?: StreamID | null, limit?: number): Promise<string[]> {
    this.throwIfNotOpened()
    if (streamId == null) {
      return await this.#store.find({ limit })
    } else {
      const exists = Boolean(await this.load(streamId.baseID))
      return exists ? [streamId.toString()] : []
    }
  }

  /**
   * Pin stream
   * @param stream - Stream instance
   */
  async saveFromStream(stream: Stream): Promise<void> {
    this.throwIfNotOpened()
    await this.#store.put(
      this.getFullKey(stream.id.baseID),
      StreamUtils.serializeState(stream.state)
    )
  }

  /**
   * Pin stream
   * @param streamStateHolder - Stream instance
   */
  async saveFromStreamStateHolder(streamStateHolder: StreamStateHolder): Promise<void> {
    this.throwIfNotOpened()
    await this.#store.put(
      this.getFullKey(streamStateHolder.id),
      StreamUtils.serializeState(streamStateHolder.state)
    )
  }

  /**
   * Unpin stream
   * @param streamId - Stream ID
   */
  async remove(streamId: StreamID): Promise<void> {
    this.throwIfNotOpened()
    await this.#store.del(
      this.getFullKey(streamId.baseID)
    )
  }

  /**
   * Close pinning service
   */
  async close(): Promise<void> {
    this.throwIfNotOpened()
    await this.#store.close()
    this.#store = undefined
  }

}
