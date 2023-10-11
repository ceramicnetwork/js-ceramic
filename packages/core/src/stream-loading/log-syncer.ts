import { StreamID } from '@ceramicnetwork/streamid'
import { CID } from 'multiformats/cid'
import { UnappliableStreamLog } from '@ceramicnetwork/common'
import { Dispatcher } from '../dispatcher.js'
import { Utils } from '../utils.js'

type IpfsCommitLoader = {
  retrieveCommit(cid: CID | string, streamId: StreamID): Promise<any>
  retrieveFromIPFS(cid: CID | string, path?: string): Promise<any>
}

/**
 * Used to load all the relevant data for a Stream log from the p2p network that will allow that
 * log to be applied to a StreamState. This does not, however, validate the Anchor Commits nor
 * extract the timestamp information from them which will still be necessary to do before the log
 * can be applied.
 */
export class LogSyncer {
  constructor(private readonly ipfsLoader: IpfsCommitLoader) {}

  /**
   * Given a StreamID and a known tip for that Stream, load all the commits from the tip back to
   * (and including) the genesis commit. If 'tip' is null or turns out to not be a commit in the log
   * for the Stream identified by 'streamID', then the returned log will just have the data for the
   * genesis commit.
   * @param streamID
   * @param tip
   */
  async syncFullLog(streamID: StreamID, tip: CID | null): Promise<UnappliableStreamLog> {
    if (!tip) {
      return this._syncGenesisLog(streamID)
    }

    const log = await this._syncLogHelper(streamID, tip, null)
    if (log.commits.length == 0 || !log.commits[0].cid.equals(streamID.cid)) {
      // This means that the tip we were given didn't actually correspond to the stream from
      // 'streamID'
      return this._syncGenesisLog(streamID)
    }
    return log
  }

  async _syncGenesisLog(streamID: StreamID): Promise<UnappliableStreamLog> {
    const genesisCommitData = await Utils.getCommitData(
      this.ipfsLoader as Dispatcher,
      streamID.cid,
      streamID
    )
    return { commits: [genesisCommitData], timestampStatus: 'pending' }
  }

  /**
   * Given a StreamID, a known tip for that Stream, and a list of CIDs of  of existing commits in
   * the Stream's log, sync all new commits from the tip back until it reaches one of the known
   * existing commit.
   * If 'tip' turns out not to be newer than 'until', or isn't a part of the log for 'streamID' at
   * all, returns an empty array.
   * @param streamID
   * @param tip
   * @param existingCommits - list of existing commits for this stream, in order.  The first entry
   *   in this array MUST be equivalent to the genesis commit CID for this stream.
   */
  async syncLogUntilMatch(
    streamID: StreamID,
    tip: CID,
    existingCommits: Array<CID>
  ): Promise<UnappliableStreamLog> {
    return this._syncLogHelper(streamID, tip, existingCommits)
  }

  /**
   * Helper function for syncing the log. If 'existingCommits' is null then we expect to sync
   * from 'tip' all the way back until the log has no more previous commits (ie until the genesis
   * commit is reached).  If existingCommits is non-null, then we expect our sync to eventually
   * intersect with one of the existing commits, and if it does not we return an empty result set.
   * @private
   */
  private async _syncLogHelper(
    streamID: StreamID,
    tip: CID,
    existingCommits: Array<CID> | null
  ): Promise<UnappliableStreamLog> {
    const syncedLog = []
    let curCid = tip

    while (curCid && !this._logIncludes(curCid, existingCommits)) {
      const commitData = await Utils.getCommitData(this.ipfsLoader as Dispatcher, curCid, streamID)
      const prevCid = commitData.commit.prev
      if (!prevCid && existingCommits) {
        // Someone sent a tip that is a fake log, i.e. a log that at some point does not refer to
        // a previous or genesis commit, or is for a different stream than we expect.
        return { commits: [], timestampStatus: 'pending' }
      }

      syncedLog.push(commitData)
      curCid = prevCid
    }

    // Since we synced the log from newest to oldest we need to reverse it before returning to
    // put it in newest to oldest order.
    return { commits: syncedLog.reverse(), timestampStatus: 'pending' }
  }

  private _logIncludes(cid: CID, log: Array<CID> | null): boolean {
    if (!log) {
      return false
    }
    return log.find((entry) => entry.equals(cid)) != null
  }
}
