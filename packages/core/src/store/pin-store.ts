import { StateStore } from './state-store'
import {
  LogEntry,
  StreamState,
  PinningBackend,
  StreamStateHolder,
  StreamUtils,
} from '@ceramicnetwork/common'
import CID from 'cids'
import StreamID from '@ceramicnetwork/streamid'

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
   * from the stream, pins them against the configured pinning backend, and also writes the
   * StreamState itself into the state store.
   *
   * If 'pinnedCommits' is provided, it is assumed that
   * @param stateHolder - object holding the current StreamState for the stream being pinned
   * @param pinnedCommits - If the stream was previously pinned, then this will contain a set
   *  of CIDs (in string representation) of the commits that were pinned previously. This means
   *  we only need to pin CIDs corresponding to the commits contained in the log of the given
   *  StreamState that aren't contained within `pinnedCommits`
   */
  async add(stateHolder: StreamStateHolder, pinnedCommits?: Set<string>): Promise<void> {
    const commitLog = stateHolder.state.log.map((logEntry) => logEntry.cid)
    const newCommits = pinnedCommits
      ? commitLog.filter((cid) => !pinnedCommits.has(cid.toString()))
      : commitLog

    const points = await this.pointsOfInterest(newCommits)
    await Promise.all(points.map((point) => this.pinning.pin(point)))
    await this.stateStore.save(stateHolder)
  }

  async rm(streamId: StreamID): Promise<void> {
    const state = await this.stateStore.load(streamId)
    if (state) {
      const commitLog = state.log.map((logEntry) => logEntry.cid)
      const points = await this.pointsOfInterest(commitLog)
      Promise.all(points.map((point) => this.pinning.unpin(point))).catch(() => {
        // Do Nothing
      })
      await this.stateStore.remove(streamId)
    }
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
  protected async pointsOfInterest(commits: Array<CID>): Promise<Array<CID>> {
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
        points.push(commit.link)
      }
    }
    return points
  }
}
