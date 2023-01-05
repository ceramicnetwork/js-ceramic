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

export interface IpfsService {
  retrieveFromIPFS(cid: CID | string, path?: string): Promise<any>
  retrieveCommit(cid: CID | string, streamId: StreamID): Promise<any>
  storeCommit(data: any, streamId?: StreamID): Promise<CID>
  storeRecord(record: Record<string, unknown>): Promise<CID>
}

export interface TreeMetadata {
  numEntries: number
  streamIds: string[]
}
