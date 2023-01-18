import type { CID } from 'multiformats/cid'
import { StreamID } from '@ceramicnetwork/streamid'

export interface ISyncApi {
  startModelSync(startBlock: number, endBlock: number, models: string | string[]): Promise<void>
  shutdown(): Promise<void>
}

export interface ISyncApi {
  startModelSync(startBlock: number, endBlock: number, models: string | string[]): Promise<void>
  shutdown(): Promise<void>
}

// handles a commit found during a sync
// should be similar to: https://github.com/ceramicnetwork/js-ceramic/blob/6ae6e121b33132225f256762825e1439fd84f23a/packages/core/src/state-management/state-manager.ts#L210
export type HandleCommit = (streamId: StreamID, commit: CID, model?: StreamID) => Promise<void>

export interface IpfsService {
  retrieveFromIPFS(cid: CID | string, path?: string): Promise<any>
  retrieveCommit(cid: CID | string, streamId: StreamID): Promise<any>
  storeCommit(data: any, streamId?: StreamID): Promise<CID>
  storeRecord(record: Record<string, unknown>): Promise<CID>
}

export interface IndexApi {
  shouldIndexStream(streamId: StreamID): Promise<boolean>
}

export interface TreeMetadata {
  numEntries: number
  streamIds: string[]
}
