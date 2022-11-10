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
import PQueue from 'p-queue'

export type StateStoreParams = {
  logger: DiagnosticsLogger
  keyPrefix?: string
  maxReqsPerSec?: number
}

export class StateStore implements StateStoreInterface {
  #logger: DiagnosticsLogger
  #keyPrefix: string
  #store: StoreForNetwork
  readonly #loadingLimit: PQueue

  constructor(params: StateStoreParams) {
    this.#logger = params.logger
    this.#keyPrefix = params.keyPrefix ?? 'state-store'
    if (params.maxReqsPerSec) {
      this.#loadingLimit = new PQueue({
        intervalCap: params.maxReqsPerSec,
        interval: 1000,
        carryoverConcurrencyCount: true,
      })
    }
  }

  /**
   * Gets network name
   */
  get networkName(): string {
    return this.#store.networkName
  }

  private getFullKey(streamID: StreamID): string {
    return this.#keyPrefix ?
      `${this.#keyPrefix}-${streamID.toString()}` :
      streamID.toString()
  }

  private async _load(streamId: StreamID): Promise<StreamState> {
    try {
      const state = await this.#store.get(
        this.getFullKey(streamId.baseID)
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

  async open(store: StoreForNetwork): Promise<void> {
    this.#store = store
    await this.#store.init()
    if (this.#store.networkName == Networks.MAINNET || this.#store.networkName == Networks.ELP) {
      // If using "mainnet", check for data under an 'elp' directory first. This is because older
      // versions of Ceramic only supported an 'elp' network as an alias for mainnet and stored
      // state store data under 'elp' instead of 'mainnet' by mistake, and we don't want to lose
      // that data if it exists.
      const isEmptyParams = this.#keyPrefix ?  { all: `${this.#keyPrefix}-` } : undefined
      const hasPinnedStreams = !(await this.#store.isEmpty(isEmptyParams))
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
    if (this.#loadingLimit) {
      return this.#loadingLimit.add(async () => {
        return await this._load(streamId)
      })
    } else {
      return await this._load(streamId)
    }
  }

  /**
   * List pinned streams
   * @param streamId - Stream ID
   * @param limit - limit on number of results
   */
  async list(streamId?: StreamID | null, limit?: number): Promise<string[]> {
    if (streamId == null) {
      const findParams = this.#keyPrefix ?  { all: `${this.#keyPrefix}-`, limit } : { limit }
      return await this.#store.find(findParams)
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
    await this.#store.put(
      this.getFullKey(stream.id.baseID),
      JSON.stringify(StreamUtils.serializeState(stream.state))
    )
  }

  /**
   * Pin stream
   * @param streamStateHolder - Stream instance
   */
  async saveFromStreamStateHolder(streamStateHolder: StreamStateHolder): Promise<void> {
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
    await this.#store.del(
      this.getFullKey(streamId.baseID)
    )
  }

  /**
   * Close pinning service
   */
  async close(): Promise<void> {
    await this.#store.close()
    this.#store = undefined
  }

}
