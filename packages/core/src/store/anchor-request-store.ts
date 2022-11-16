
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

export class AnchorRequestStore extends ObjectStore<CommitID, AnchorRequestData> {
  constructor() {
    super(generateKey, serialize, deserialize)
    this.storeSubChannel = 'anchor-requests'
  }
}
