import type { CID } from 'multiformats/cid'
import type { StreamID } from '@ceramicnetwork/streamid'
import type { SupportedNetwork } from '@ceramicnetwork/anchor-utils'
import type { AnchorProof } from '@ceramicnetwork/common'

export type SyncConfig = {
  /**
   * Database connection string.
   */
  db: string
  chainId: SupportedNetwork
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

export interface TreeMetadata {
  numEntries: number
  streamIds: string[]
}

export const REBUILD_ANCHOR_JOB_NAME = 'rebuildAnchor'
export interface RebuildAnchorJobData {
  models: string[]
  chainId: string
  txHash: string
  root: string
  txType?: string
}

export const SYNC_JOB_NAME = 'sync'
export interface SyncJobData {
  fromBlock: number
  toBlock: number
  models: string[]
}

export type JobData = RebuildAnchorJobData | SyncJobData
