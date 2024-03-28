import type { StreamID } from '@ceramicnetwork/streamid'
import { StreamUtils, type StreamState, type StreamStateHolder } from '@ceramicnetwork/common'
import { ObjectStore } from './object-store.js'

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
  readonly useCaseName = undefined

  constructor() {
    super(generateKey, serialize, deserialize)
  }

  /**
   * Pin stream
   * @param streamStateHolder - Stream instance
   */
  async saveFromStreamStateHolder(streamStateHolder: StreamStateHolder): Promise<void> {
    await this.save(streamStateHolder.id, streamStateHolder.state)
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
