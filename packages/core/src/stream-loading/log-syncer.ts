import { StreamID } from '@ceramicnetwork/streamid'
import { CID } from 'multiformats/cid'
import { UnappliableStreamLog } from '@ceramicnetwork/common'

interface IpfsCommitLoader {
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
  constructor(readonly ipfsLoader: IpfsCommitLoader) {}

  /**
   * Given a StreamID and a known tip for that Stream, load all the commits from the tip back to
   * (and including) the genesis commit. If 'tip' turns out to not be a commit in the log for
   * the Stream identified by 'streamID', returns null.
   * @param streamID
   * @param tip
   */
  async syncFullLog(streamID: StreamID, tip: CID): Promise<UnappliableStreamLog | null> {
    throw new Error(`Not yet implemented`)
  }

  /**
   * Given a StreamID, a known tip for that Stream, and a CID of an existing commit in the Stream's
   * log, sync all new commits from the tip back until it reaches the known existing commit. The
   * data for 'until' will *not* be included in the result.
   * If 'tip' turns out not to be newer than 'until', or isn't a part of the log for 'streamID' at
   * all, returns null.
   * @param streamID
   * @param tip
   * @param until
   */
  async syncLogUntil(
    streamID: StreamID,
    tip: CID,
    until: CID
  ): Promise<UnappliableStreamLog | null> {
    throw new Error(`Not yet implemented`)
  }
}
