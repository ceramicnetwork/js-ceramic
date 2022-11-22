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
  key: StreamID,
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
  constructor() {
    super(generateKey, serializeAnchorRequestData, deserializeAnchorRequestData)
    this.useCaseName = 'anchor-requests'
  }

  async list(limit?: number): Promise<Array<AnchorRequestStoreListResult>> {
    return (await this.store.find({ limit: limit, useCaseName: this.useCaseName })).map(
      (result) => {
        return {
          key: StreamID.fromString(result.key),
          value: deserializeAnchorRequestData(result.value),
        }
      }
    )
  }
}
