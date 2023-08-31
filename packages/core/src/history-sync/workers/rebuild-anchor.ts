import { default as PgBoss } from 'pg-boss'
import type { SendOptions } from 'pg-boss'
import type { AnchorProof, AnchorCommit, DiagnosticsLogger } from '@ceramicnetwork/common'
import { MerkleTreeLoader } from '../utils.js'
import { StreamID } from '@ceramicnetwork/streamid'
import {
  type IpfsService,
  type HandleCommit,
  type RebuildAnchorJobData,
  REBUILD_ANCHOR_JOB,
} from '../interfaces.js'
import type { Worker, Job } from '@ceramicnetwork/job-queue'
import { CID } from 'multiformats/cid'
import { pathString } from '@ceramicnetwork/anchor-utils'
import PQueue from 'p-queue'

// Up to 1024 streams could be present in an anchor
const IPFS_LOAD_CONCURRENCY = 16

const REBUILD_ANCHOR_JOB_OPTIONS: SendOptions = {
  retryLimit: 5,
  retryDelay: 60, // 1 minute
  retryBackoff: true,
  expireInHours: 12,
  retentionDays: 3,
}

export function createRebuildAnchorJob(
  proof: AnchorProof,
  models: string[],
  options: SendOptions = REBUILD_ANCHOR_JOB_OPTIONS
): Job<RebuildAnchorJobData> {
  return {
    name: REBUILD_ANCHOR_JOB,
    data: {
      models,
      chainId: proof.chainId,
      txHash: proof.txHash.toString(),
      root: proof.root.toString(),
      txType: proof.txType,
    },
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
    private readonly handleCommit: HandleCommit,
    private readonly logger: DiagnosticsLogger
  ) {}

  private async getModelForStream(streamId: StreamID): Promise<StreamID | null> {
    const signedCommit = await this.ipfsService.retrieveCommit(
      streamId.cid, // genesis commit CID
      streamId
    )

    const genesisCommit = signedCommit?.link
      ? await this.ipfsService.retrieveCommit(signedCommit.link, streamId)
      : signedCommit

    if (!genesisCommit?.header?.model) {
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
    const proof: AnchorProof = {
      chainId: jobData.chainId,
      txHash: CID.parse(jobData.txHash),
      root: CID.parse(jobData.root),
      txType: jobData.txType,
    }

    const proofCid = await this.ipfsService.storeRecord(proof as any).catch((err) => {
      this.logger.err(
        `Failed to store a proof on ipfs for root ${jobData.root} and txHash ${jobData.txHash} for models ${jobData.models} with error: ${err} `
      )
      // TODO (CDB-2291): add failure job for root cid
    })
    if (!proofCid) {
      return
    }

    const merkleTreeLeafLoader = new MerkleTreeLoader(this.ipfsService, proof.root)
    const metadata = await merkleTreeLeafLoader.getMetadata().catch((err) => {
      this.logger.err(
        `Failed to retrieve the merkle tree metadata for root ${jobData.root} and txHash ${jobData.txHash} for models ${jobData.models} with error: ${err} `
      )
      // TODO (CDB-2291): add failure job for root cid
    })
    if (!metadata) {
      return
    }

    const tasks = metadata.streamIds.map((stream, i) => {
      return async () => {
        try {
          const streamId = StreamID.fromString(stream)
          const model = await this.getModelForStream(streamId)

          const shouldIndex = model
            ? jobData.models.some((modelNeedingSync) => modelNeedingSync === model.toString())
            : false

          if (shouldIndex) {
            const { cid, path } = await merkleTreeLeafLoader.getLeafData(i)

            const anchorCommit: AnchorCommit = {
              id: streamId.cid,
              prev: cid,
              proof: proofCid,
              path: pathString(path),
            }

            const anchorCommitCid = await this.ipfsService.storeCommit(anchorCommit)

            await this.handleCommit(streamId, anchorCommitCid, model)

            this.logger.debug(
              `Successfully handled anchor commit ${anchorCommitCid} for stream ${streamId.toString()} and model ${model.toString()} using merkle tree root ${
                jobData.root
              }`
            )
          }
        } catch (err) {
          this.logger.err(
            `Failed to recreate the anchor commit for stream ${stream} using root ${jobData.root} and txHash ${jobData.txHash} for models ${jobData.models} with error: ${err} `
          )
          // TODO (CDB-2291): add failure job for streamId
        }
      }
    })

    const queue = new PQueue({ concurrency: IPFS_LOAD_CONCURRENCY })
    await queue.addAll(tasks)

    this.logger.debug(
      `Rebuild anchor job completed for models ${jobData.models}, root ${jobData.root}, and txHash ${jobData.txHash}`
    )
  }
}
