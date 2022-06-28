import { StateStore } from './state-store.js'
import { PinningBackend, StreamUtils } from '@ceramicnetwork/common'
import { CID } from 'multiformats/cid'
import { StreamID } from '@ceramicnetwork/streamid'
import { RunningState } from '../state-management/running-state.js'
import { base64urlToJSON } from '../utils.js'

/**
 * Encapsulates logic for pinning streams
 */
export class PinStore {
  constructor(
    readonly stateStore: StateStore,
    readonly pinning: PinningBackend,
    readonly retrieve: (cid: CID) => Promise<any | null>,
    readonly resolve: (path: string) => Promise<CID>
  ) {}

  open(networkName: string): void {
    this.stateStore.open(networkName)
    this.pinning.open()
  }

  async close(): Promise<void> {
    await this.stateStore.close()
    await this.pinning.close()
  }

  /**
   * Takes a StreamState and finds all the IPFS CIDs that are in any way needed to load data
   * from the stream, pins them against the configured pinning backend, writes the
   * StreamState itself into the state store, and updates the RunningState's pinned commits which
   * prevents the StreamState's commits from being stored again.
   * @param runningState - object holding the current StreamState for the stream being pinned
   *  If the stream was previously pinned, then this will also contain a set of CIDs
   *  (in string representation) of the commits that were pinned previously. This means
   *  we only need to pin CIDs corresponding to the commits contained in the log of the given
   *  StreamState that aren't contained within `pinnedCommits`
   * @param force - optional boolean that if set to true forces all commits in the stream to pinned,
   * regardless of whether they have been previously pinned
   */
  async add(runningState: RunningState, force?: boolean): Promise<void> {
    const commitLog = runningState.state.log.map((logEntry) => logEntry.cid)
    const newCommits =
      runningState.pinnedCommits && !force
        ? commitLog.filter((cid) => !runningState.pinnedCommits.has(cid.toString()))
        : commitLog
    if (newCommits.length == 0) {
      return
    }

    const points = await this.getComponentCIDsOfCommits(newCommits)
    await Promise.all(points.map((point) => this.pinning.pin(point)))
    await this.stateStore.save(runningState)
    runningState.markAsPinned()
  }

  async rm(runningState: RunningState): Promise<void> {
    const commitLog = runningState.state.log.map((logEntry) => logEntry.cid)
    const points = await this.getComponentCIDsOfCommits(commitLog)
    Promise.all(points.map((point) => this.pinning.unpin(point))).catch(() => {
      // Do Nothing
    })
    await this.stateStore.remove(runningState.id)
    runningState.markAsUnpinned()
  }

  async ls(streamId?: StreamID): Promise<string[]> {
    return this.stateStore.list(streamId)
  }

  /**
   * Takes an array of CIDs, corresponding to commits in a stream log, and returns all CIDs that
   * would need to be pinned in order to pin all data necessary to keep the corresponding Stream
   * alive and available to the network.  This entails expanding each commit out to all the other
   * IPFS CIDs that that commit depends on (for example AnchorCommits depend on the CID of the
   * AnchorProof, and of all the CIDs in the path from the merkle root to the leaf of the merkle tree
   * for that commit).
   * @param commits - CIDs of Ceramic commits to expand
   * @protected
   */
  protected async getComponentCIDsOfCommits(commits: Array<CID>): Promise<Array<CID>> {
    const points: CID[] = []
    for (const cid of commits) {
      points.push(cid)

      const commit = await this.retrieve(cid)
      if (StreamUtils.isAnchorCommit(commit)) {
        points.push(commit.proof)

        const path = commit.path ? 'root/' + commit.path : 'root'
        const subPaths = path.split('/').filter((p) => !!p)

        let currentPath = ''
        for (const subPath of subPaths) {
          currentPath += '/' + subPath
          const subPathResolved = await this.resolve(commit.proof.toString() + currentPath)
          points.push(subPathResolved)
        }
      }
      if (StreamUtils.isSignedCommit(commit)) {
        const decodedProtectedHeader = base64urlToJSON(commit.signatures[0].protected)
        if (decodedProtectedHeader.cap) {
          const capIPFSUri = decodedProtectedHeader.cap
          const capCID = CID.parse(capIPFSUri.replace('ipfs://', ''))
          points.push(capCID)
        }
        points.push(commit.link)
      }
    }
    return points
  }
}
