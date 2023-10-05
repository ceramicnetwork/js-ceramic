import {
  AppliableStreamLog,
  CommitData,
  CommitType,
  DiagnosticsLogger,
  UnappliableStreamLog,
} from '@ceramicnetwork/common'
import { CID } from 'multiformats/cid'
import { AnchorValidator } from '../anchor/anchor-service.js'

interface IpfsRecordLoader {
  retrieveFromIPFS(cid: CID | string, path?: string): Promise<any>
}

/**
 * Responsible for validating the Anchor Commits in a Stream log, extracting the timestamp
 * information from them, and propagating that timestamp information to all the commits that
 * are anchored by that anchor commit.
 */
export class AnchorTimestampExtractor {
  constructor(
    private readonly logger: DiagnosticsLogger,
    private readonly ipfsLoader: IpfsRecordLoader,
    private readonly anchorValidator: AnchorValidator
  ) {}

  /**
   * Verifies anchor commit structure. Throws if the anchor commit is invalid in any way.
   *
   * @returns The anchor timestamp of the blockchain anchor transaction (in seconds).
   */
  private async verifyAnchorCommit(commitData: CommitData): Promise<number> {
    const proof = commitData.proof
    const commitPath = commitData.commit.path

    let prevCIDViaMerkleTree
    try {
      // optimize verification by using ipfs.dag.tree for fetching the nested CID
      if (commitPath.length === 0) {
        prevCIDViaMerkleTree = proof.root
      } else {
        const merkleTreeParentCommitPath =
          '/root/' + commitPath.substr(0, commitPath.lastIndexOf('/'))
        const last: string = commitPath.substr(commitPath.lastIndexOf('/') + 1)

        const merkleTreeParentCommit = await this.ipfsLoader.retrieveFromIPFS(
          commitData.commit.proof,
          merkleTreeParentCommitPath
        )
        prevCIDViaMerkleTree = merkleTreeParentCommit[last]
      }
    } catch (e) {
      throw new Error(`The anchor commit couldn't be verified. Reason ${e.message}`)
    }

    if (commitData.commit.prev.toString() !== prevCIDViaMerkleTree.toString()) {
      throw new Error(
        `The anchor commit proof ${proof.toString()} with path ${commitPath} points to invalid 'prev' commit`
      )
    }

    return this.anchorValidator.validateChainInclusion(proof)
  }
  /**
   * Validates all the anchor commits in the log, applying timestamp information to the CommitData
   * entries in the log along the way. Defers throwing errors resulting from anchor validation
   * failures until later, when the anchor commits are actually applied.
   * @param log
   */
  async verifyAnchorAndApplyTimestamps(log: UnappliableStreamLog): Promise<AppliableStreamLog> {
    let timestamp = null
    for (let i = log.commits.length - 1; i >= 0; i--) {
      const commitData = log.commits[i]
      if (commitData.type == CommitType.ANCHOR) {
        try {
          timestamp = await this.verifyAnchorCommit(commitData)
        } catch (err) {
          // Save the error for now to be thrown when trying to actually apply the anchor commit.
          this.logger.warn(`Error when validating anchor commit: ${err}`)
          commitData.anchorValidationError = err
        }
      }
      commitData.timestamp = timestamp
    }

    return { commits: log.commits, timestampStatus: 'validated' }
  }
}
