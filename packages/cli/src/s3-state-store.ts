import { StreamState, Stream, StreamUtils, ServiceLogger } from '@ceramicnetwork/common';
import StreamID from '@ceramicnetwork/streamid'
import { StateStore } from "@ceramicnetwork/core";
import LevelUp from "levelup";
import S3LevelDOWN from "s3leveldown"
import toArray from "stream-to-array"

/**
 * Ceramic store for saving stream state to S3
 */
export class S3StateStore implements StateStore {
  readonly #bucketName: string
  #store

  constructor(bucketName: string, readonly logger: ServiceLogger) {
    this.#bucketName = bucketName
  }

  /**
   * Open pinning service
   */
  open(networkName: string): void {
    const location = this.#bucketName + '/ceramic/' + networkName + '/state-store'
    this.#store = new LevelUp(new S3LevelDOWN(location));
  }

  /**
   * Pin stream
   * @param stream - Stream instance
   */
  async save(stream: Stream): Promise<void> {
    const before = Date.now()
    await this.#store.put(stream.id.baseID.toString(), JSON.stringify(StreamUtils.serializeState(stream.state)))
    const after = Date.now()
    this.logger.log({
      operation: 'save',
      streamId: stream.id.baseID.toString(),
      duration: after - before
    })
  }

  /**
   * Load stream state
   * @param streamId - stream ID
   */
  async load(streamId: StreamID): Promise<StreamState> {
    try {
      const before = Date.now()
      const state = await this.#store.get(streamId.baseID.toString())
      const after = Date.now()
      this.logger.log({
        operation: 'load',
        streamId: streamId.baseID.toString(),
        duration: after - before
      })
      if (state) {
        return StreamUtils.deserializeState(JSON.parse(state));
      } else {
        return null;
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
    const before = Date.now()
    await this.#store.del(streamId.baseID.toString())
    const after = Date.now()
    this.logger.log({
      operation: 'remove',
      streamId: streamId.baseID.toString(),
      duration: after - before
    })
  }

  /**
   * List pinned streams
   * @param streamId - Stream ID
   */
  async list(streamId?: StreamID): Promise<string[]> {
    if (streamId == null) {
      const bufArray = await toArray(this.#store.createKeyStream())
      return bufArray.map((buf) => buf.toString())
    }  else {
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
