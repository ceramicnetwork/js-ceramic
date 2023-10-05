import { StreamID } from '@ceramicnetwork/streamid'
import { ObjectStore } from './object-store.js'
import { CID } from 'multiformats/cid'
import { GenesisCommit, StreamUtils } from '@ceramicnetwork/common'

export type AnchorRequestData = {
  cid: CID
  timestamp: number
  genesis: GenesisCommit
}

export type AnchorRequestStoreListResult = {
  key: StreamID
  value: AnchorRequestData
}

function generateKey(object: StreamID): string {
  return object.toString()
}

export function serializeAnchorRequestData(value: AnchorRequestData): any {
  return JSON.stringify({
    cid: value.cid.toString(),
    timestamp: value.timestamp,
    genesis: StreamUtils.serializeCommit(value.genesis),
  })
}

export function deserializeAnchorRequestData(serialized: any): AnchorRequestData {
  const parsed = JSON.parse(serialized)
  return {
    cid: CID.parse(parsed.cid),
    timestamp: parsed.timestamp,
    genesis: StreamUtils.deserializeCommit(parsed.genesis),
  }
}

/**
 * An object-value store being able to save, retrieve and delete anchor request data identified by stream ids
 *
 * Anchor request data includes everything that's necessary to request an anchor from Ceramic Anchoring Service (CAS).
 * This store is used to save and retrieve this data so that it can be re-sent to CAS in case of networking issues.
 */
export class AnchorRequestStore extends ObjectStore<StreamID, AnchorRequestData> {
  #shouldStop: boolean

  constructor() {
    super(generateKey, serializeAnchorRequestData, deserializeAnchorRequestData)
    this.useCaseName = 'anchor-requests'
  }

  exists(key: StreamID): Promise<boolean> {
    return this.store.exists(generateKey(key), this.useCaseName)
  }

  async *list(batchSize = 1): AsyncIterable<Array<AnchorRequestStoreListResult>> {
    let gt: StreamID | undefined = undefined
    do {
      const batch = await this.store.find({
        limit: batchSize,
        useCaseName: this.useCaseName,
        gt: gt ? generateKey(gt) : undefined,
      })
      if (batch.length > 0) {
        gt = StreamID.fromString(batch[batch.length - 1].key)
        yield batch.map((item) => {
          return {
            key: StreamID.fromString(item.key),
            value: deserializeAnchorRequestData(item.value),
          }
        })
      } else {
        return
      }
    } while (true)
  }

  // FIXME Change name
  async *infiniteList(batchSize = 1): AsyncGenerator<AnchorRequestStoreListResult> {
    let gt: StreamID | undefined = undefined
    do {
      const batch = await this.store.find({
        limit: batchSize,
        useCaseName: this.useCaseName,
        gt: gt ? generateKey(gt) : undefined,
      })
      if (batch.length > 0) {
        gt = StreamID.fromString(batch[batch.length - 1].key)
        for (const item of batch) {
          yield {
            key: StreamID.fromString(item.key),
            value: deserializeAnchorRequestData(item.value),
          }
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 100)) // FIXME
        gt = undefined
      }
    } while (!this.#shouldStop)
  }

  async close() {
    this.#shouldStop = true
    await super.close()
  }

  async close(): Promise<void> {
    await this.store.close(this.useCaseName)
  }
}
