import { StreamID } from '@ceramicnetwork/streamid'
import {
  DiagnosticsLogger,
  Networks,
  Stream,
  StreamState,
  StreamStateHolder,
  StreamUtils
} from '@ceramicnetwork/common'
import { AbstractStore } from './abstract-store.js'
import { StoreForNetwork } from './store-for-network.js'

export class StateStore extends AbstractStore<StreamID, StreamState> {
  #logger: DiagnosticsLogger

  constructor(logger: DiagnosticsLogger) {
    super()
    this.#logger = logger
  }

  /**
   * Gets network name
   */
  get networkName(): string {
    return this.store.networkName
  }

  getKey(object: StreamID): string {
    return object.toString()
  }

  serialize(value: StreamState): any {
    return StreamUtils.serializeState(value)
  }

  deserialize(serialized: any): StreamState {
    return StreamUtils.deserializeState(serialized)
  }

  /**
   * Pin stream
   * @param stream - Stream instance
   */
  async saveFromStream(stream: Stream): Promise<void> {
    await this.save(stream.id, stream.state)
  }

  /**
   * Pin stream
   * @param streamStateHolder - Stream instance
   */
  async saveFromStreamStateHolder(streamStateHolder: StreamStateHolder): Promise<void> {
    await this.save(streamStateHolder.id, streamStateHolder.state)
  }

  async open(store: StoreForNetwork): Promise<void> {
    if (store.networkName == Networks.MAINNET || store.networkName == Networks.ELP) {
      // If using "mainnet", check for data under an 'elp' directory first. This is because older
      // versions of Ceramic only supported an 'elp' network as an alias for mainnet and stored
      // state store data under 'elp' instead of 'mainnet' by mistake, and we don't want to lose
      // that data if it exists.
      const hasPinnedStreams = !(await store.isEmpty())
      if (hasPinnedStreams) {
        this.#logger.verbose(
          `Detected existing state store data under 'elp' directory. Continuing to use 'elp' directory to store state store data`
        )
      }
    }
    return super.open(store)
  }

  async list(streamId?: StreamID | null, limit?: number): Promise<string[]> {
    if (streamId == null) {
      return await this.store.find({ limit })
    } else {
      const exists = Boolean(await this.load(streamId.baseID))
      return exists ? [streamId.toString()] : []
    }
  }
}
