import { default as PgBoss } from 'pg-boss'
import type { SendOptions } from 'pg-boss'
import type { AnchorCommit } from '@ceramicnetwork/common'
import { MerkleTreeLoader } from '../utils.js'
import { StreamID } from '@ceramicnetwork/streamid'
import {
  type IpfsService,
  type HandleCommit,
  type RebuildAnchorJobData,
  REBUILD_ANCHOR_JOB_NAME,
} from '../interfaces.js'
import type { Worker, Job } from '../../state-management/job-queue.js'

const REBUILD_ANCHOR_JOB_OPTIONS: SendOptions = {
  retryLimit: 5,
  retryDelay: 60, // 1 minute
  retryBackoff: true,
  expireInHours: 12,
  retentionDays: 3,
}

export function createRebuildAnchorJob(
  data: RebuildAnchorJobData,
  options: SendOptions = REBUILD_ANCHOR_JOB_OPTIONS
): Job<RebuildAnchorJobData> {
  return {
    name: REBUILD_ANCHOR_JOB_NAME,
    data,
    options,
  }
}

/**
 * Worker that recreates the anchor commits based on the anchor proof given.
 * It ensures that the data is stored and handled.
 */
export class RebuildAnchorWorker implements Worker<RebuildAnchorJobData> {
  constructor(
    private readonly ipfsService: IpfsService,
    private readonly handleCommit: HandleCommit
  ) {}

  private async getModelForStream(streamId: StreamID): Promise<StreamID | null> {
    const signedCommit = await this.ipfsService.retrieveCommit(
      streamId.cid, // genesis commit CID
      streamId
    )

    const genesisCommit = await this.ipfsService.retrieveCommit(signedCommit.link, streamId)

    if (!genesisCommit.header.model) {
      return null
    }

    return StreamID.fromBytes(genesisCommit.header.model)
  }

  /**
   * Takes an anchor proof, and stores it if it has no been stored.
   * Using the merkle root cid contained in the proof, it finds the leaf commits
   * that need to be synced, recreates their anchor commits, and handles them.
   * @param job job that contains an anchor proof in its data
   * @returns
   */
  async handler(job: PgBoss.Job) {
    const jobData = job.data as RebuildAnchorJobData
    const { proof, models } = jobData

    const proofCid = await this.ipfsService.storeRecord(proof as any).catch(() => {
      // TODO: add failure job for root cid
    })
    if (!proofCid) {
      return
    }

    const merkleTreeLeafLoader = new MerkleTreeLoader(this.ipfsService, proof.root)
    const metadata = await merkleTreeLeafLoader.getMetadata().catch(() => {
      // TODO: add failure job for root cid
    })
    if (!metadata) {
      return
    }

    const streams = metadata.streamIds

    await Promise.all(
      streams.map(async (stream, i) => {
        try {
          const streamId = StreamID.fromString(streams[i])

          const model = await this.getModelForStream(streamId)

          const shouldIndex = model
            ? models.some((modelNeedingSync) => modelNeedingSync === model.toString())
            : false

          if (shouldIndex) {
            const { cid, path } = await merkleTreeLeafLoader.getLeafData(i)

            const anchorCommit: AnchorCommit = {
              id: streamId.cid,
              prev: cid,
              proof: proofCid,
              path: path.join('/'),
            }

            const anchorCommitCid = await this.ipfsService.storeCommit(anchorCommit)

            await this.handleCommit(streamId, anchorCommitCid, model)
          }
        } catch (err) {
          // TODO: add failure job for streamId
        }
      })
    )
  }
}
