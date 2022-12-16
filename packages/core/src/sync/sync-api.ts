import type { CID } from 'multiformats/cid'
import { StreamID } from '@ceramicnetwork/streamid'

export interface ISyncApi {}

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
  constructor(private readonly ipfsService: IpfsService, private readonly protocol: Protocol) {
    // create job queue
  }

  async init(): Promise<void> {
    // initialize job queue with handlers from ./workers
  }
}
