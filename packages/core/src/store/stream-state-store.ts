import { StreamID } from '@ceramicnetwork/streamid'
import {
  DiagnosticsLogger,
  StreamState,
  StreamStateHolder,
  StreamUtils,
} from '@ceramicnetwork/common'
import { ObjectStore } from './object-store.js'
import type { IKVFactory } from './ikv-store.js'

function generateKey(object: StreamID): string {
  return object.toString()
}

function serialize(value: StreamState): any {
  return StreamUtils.serializeState(value)
}

function deserialize(serialized: string): StreamState {
  return StreamUtils.deserializeState(serialized)
}

/**
 * An object-value store being able to save, retrieve and delete stream states identified by stream ids
 */
export class StreamStateStore extends ObjectStore<StreamID, StreamState> {
  #logger: DiagnosticsLogger

  constructor(logger: DiagnosticsLogger) {
    super(generateKey, serialize, deserialize)
    this.#logger = logger
  }

  /**
   * Gets network name
   */
  get networkName(): string {
    return this.store.networkName
  }

  /**
   * Pin stream
   * @param streamStateHolder - Stream instance
   */
  async saveFromStreamStateHolder(streamStateHolder: StreamStateHolder): Promise<void> {
    await this.save(streamStateHolder.id, streamStateHolder.state)
  }

  async open(factory: IKVFactory): Promise<void> {
    return super.open(factory)
  }

  async listStoredStreamIDs(streamId?: StreamID | null, limit?: number): Promise<string[]> {
    if (streamId == null) {
      return await this.store.findKeys({ limit })
    } else {
      const exists = Boolean(await this.load(streamId.baseID))
      return exists ? [streamId.toString()] : []
    }
  }
}
