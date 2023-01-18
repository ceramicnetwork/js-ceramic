import { ISyncApi, IpfsService, HandleCommit } from './interfaces.js'

export type SyncConfig = {
  /**
   * Database connection string.
   */
  db: string
}

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
