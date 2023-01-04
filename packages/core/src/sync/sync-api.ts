import type { CID } from 'multiformats/cid'
import { StreamID } from '@ceramicnetwork/streamid'

export type SyncConfig = {
  /**
   * Database connection string.
   */
  db: string
}

export interface ISyncApi {
  startModelSync(startBlock: number, endBlock: number, models: string | string[]): Promise<void>
  shutdown(): Promise<void>
}

export interface IpfsService {
  retrieveFromIPFS(cid: CID | string, path?: string): Promise<any>
  storeCommit(data: any, streamId?: StreamID): Promise<CID>
  storeRecord(record: Record<string, unknown>): Promise<CID>
}

// handles a commit found during a sync
// should be similar to: https://github.com/ceramicnetwork/js-ceramic/blob/6ae6e121b33132225f256762825e1439fd84f23a/packages/core/src/state-management/state-manager.ts#L210
type HandleCommit = (streamId: StreamID, commit: CID, model?: StreamID) => Promise<void>

export class SyncApi implements ISyncApi {
  constructor(
    private readonly syncConfig: SyncConfig,
    private readonly ipfsService: IpfsService,
    private readonly handleCommit: HandleCommit
  ) {
    // create job queue
  }

  async init(): Promise<void> {
    // initialize job queue with handlers from ./workers
    // start blockchain listener
  }

  async startModelSync(
    startBlock: number,
    endBlock: number,
    models: string | string[]
  ): Promise<void> {
    // add to job queue
  }

  async shutdown(): Promise<void> {
    // stop all workers and shuts the job queue down
  }
}
