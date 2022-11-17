
import { CommitID, StreamID } from '@ceramicnetwork/streamid'
import { ObjectStore } from './object-store.js'
import { CID } from 'multiformats/cid'
import { GenesisCommit } from '@ceramicnetwork/common'

export type AnchorRequestData = {
  cid: CID
  timestamp: number
  genesis: GenesisCommit
}

function generateKey(object: StreamID): string {
  return object.toString()
}

function serialize(value: AnchorRequestData): any {
  return JSON.stringify(value)
}

function deserialize(serialized: any): AnchorRequestData {
  return JSON.parse(serialized)
}

export class AnchorRequestStore extends ObjectStore<StreamID, AnchorRequestData> {
  constructor() {
    super(generateKey, serialize, deserialize)
    this.useCaseName = 'anchor-requests'
  }
}
