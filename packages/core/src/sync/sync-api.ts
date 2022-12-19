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
  pauseModelSync(models: string | string[]): Promise<void>
}

interface IpfsService {
  retrieveFromIPFS(cid: CID | string, path?: string): Promise<any>
  storeCommit(data: any, streamId?: StreamID): Promise<CID>
  storeRecord(record: Record<string, unknown>): Promise<CID>
}

interface Protocol {
  // will rename but this is the function we want to use
  handlePubsubUpdate(streamId: StreamID, tip: CID, model?: StreamID): Promise<void>
}

export class SyncApi implements ISyncApi {
  constructor(
    private readonly syncConfig: SyncConfig,
    private readonly ipfsService: IpfsService,
    private readonly protocol: Protocol
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

  async pauseModelSync(models: string | string[]): Promise<void> {
    // stop workers and remove from job queue
  }
}
