
import { CommitID } from '@ceramicnetwork/streamid'
import { AbstractStore } from './abstract-store.js'
import { DiagnosticsLogger } from '@ceramicnetwork/common'

// TODO: CDB-2009 make this type store explicitly what's needed for an anchor request
export type AnchorRequestData = Record<string, any>

export class AnchorRequestStore extends AbstractStore<CommitID, AnchorRequestData> {
  constructor() {
    super()
    this.storeSubChannel = 'anchor-requests'
  }

  getKey(object: CommitID): string {
    return object.toString()
  }

  serialize(value: AnchorRequestData): any {
    return JSON.stringify(value)
  }

  deserialize(serialized: any): AnchorRequestData {
    return JSON.parse(serialized)
  }
}
