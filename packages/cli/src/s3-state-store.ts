import { DocState, Doctype, DoctypeUtils } from "@ceramicnetwork/common"
import StreamID from '@ceramicnetwork/streamid'
import { StateStore } from "@ceramicnetwork/core";
import LevelUp from "levelup";
import S3LevelDOWN from "s3leveldown"
import toArray from "stream-to-array"

/**
 * Ceramic store for saving document state to S3
 */
export class S3StateStore implements StateStore {
  readonly #bucketName: string
  #store

  constructor(bucketName: string) {
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
   * Pin document
   * @param document - Document instance
   */
  async save(document: Doctype): Promise<void> {
    await this.#store.put(document.id.baseID.toString(), JSON.stringify(DoctypeUtils.serializeState(document.state)))
  }

  /**
   * Load document state
   * @param streamId - Document ID
   */
  async load(streamId: StreamID): Promise<DocState> {
    try {
      const state = await this.#store.get(streamId.baseID.toString())
      if (state) {
        return DoctypeUtils.deserializeState(JSON.parse(state));
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
   * Unpin document
   * @param streamId - Document ID
   */
  async remove(streamId: StreamID): Promise<void> {
    await this.#store.del(streamId.baseID.toString())
  }

  /**
   * List pinned document
   * @param streamId - Document ID
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
