
import { CommitID } from '@ceramicnetwork/streamid'
import { ObjectStore } from './object-store.js'

// TODO: CDB-2009 make this type store explicitly what's needed for an anchor request
export type AnchorRequestData = Record<string, any>

function generateKey(object: CommitID): string {
  return object.toString()
}

function serialize(value: AnchorRequestData): any {
  return JSON.stringify(value)
}

function deserialize(serialized: any): AnchorRequestData {
  return JSON.parse(serialized)
}

/**
 * An object-value store being able to save, retrieve and delete anchor request data identified by stream ids
 *
 * Anchor request data includes everything that's necessary to request an anchor from Ceramic Anchoring Service (CAS).
 * This store is used to save and retrieve this data so that it can be re-sent to CAS in case of networking issues.
 */
export class AnchorRequestStore extends ObjectStore<CommitID, AnchorRequestData> {
  constructor() {
    super(generateKey, serialize, deserialize)
    this.useCaseName = 'anchor-requests'
  }
}
