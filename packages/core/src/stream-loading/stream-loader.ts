import { LogSyncer } from './log-syncer.js'
import { TipFetcher } from './tip-fetcher.js'
import { ApplyLogToStateOpts, StateManipulator } from './state-manipulator.js'
import { AnchorTimestampExtractor } from './anchor-timestamp-extractor.js'
import { DiagnosticsLogger, StreamState, StreamUtils } from '@ceramicnetwork/common'
import { CommitID, StreamID } from '@ceramicnetwork/streamid'
import { CID } from 'multiformats/cid'

/**
 * Class to contain all the logic for loading a stream, including fetching the relevant commit
 * data from the p2p network and applying the commits to get a StreamState.  It notably however does
 * not manage the persistence of the state information, nor updating the cache or indexing. It is
 * purely stateless.
 */
export class StreamLoader {
  constructor(
    private readonly logger: DiagnosticsLogger,
    private readonly tipFetcher: TipFetcher,
    private readonly logSyncer: LogSyncer,
    private readonly anchorTimestampExtractor: AnchorTimestampExtractor,
    private readonly stateManipulator: StateManipulator
  ) {}

  /**
   * Completely loads the current state of a Stream from the p2p network just from the StreamID.
   * @param streamID
   * @param syncTimeoutSecs
   */
  async loadStream(streamID: StreamID, syncTimeoutSecs: number): Promise<StreamState> {
    const tip = await this.tipFetcher.findTip(streamID, syncTimeoutSecs)
    const logWithoutTimestamps = await this.logSyncer.syncFullLog(streamID, tip)
    const logWithTimestamps = await this.anchorTimestampExtractor.verifyAnchorAndApplyTimestamps(
      logWithoutTimestamps
    )
    return this.stateManipulator.applyFullLog(streamID.type, logWithTimestamps, {
      throwOnInvalidCommit: false,
    })
  }

  /**
   * Loads the current state of a Stream from the p2p network given a currently known, possibly
   * stale state of that Stream.
   * @param state
   * @param syncTimeoutSecs
   */
  async syncStream(state: StreamState, syncTimeoutSecs: number): Promise<StreamState> {
    const streamID = StreamUtils.streamIdFromState(state)
    const tip = await this.tipFetcher.findTip(streamID, syncTimeoutSecs)

    return this._applyTipToState(state, tip, {
      throwOnInvalidCommit: false,
      throwIfStale: false,
      throwOnConflict: false,
    })
  }

  private async _applyTipToState(
    state: StreamState,
    tip: CID,
    opts: ApplyLogToStateOpts
  ): Promise<StreamState> {
    const streamID = StreamUtils.streamIdFromState(state)
    const logWithoutTimestamps = await this.logSyncer.syncLogUntilMatch(
      streamID,
      tip,
      state.log.map((logEntry) => logEntry.cid)
    )
    const logWithTimestamps = await this.anchorTimestampExtractor.verifyAnchorAndApplyTimestamps(
      logWithoutTimestamps
    )
    return await this.stateManipulator.applyLogToState(state, logWithTimestamps, opts)
  }

  /**
   * Given the currently known about StreamState for a Stream, return the state of that stream
   * at a specific CommitID.
   * @param state
   * @param commitId
   */
  async stateAtCommit(initialState: StreamState, commitId: CommitID): Promise<StreamState> {
    // Throw if any commit fails to apply as we are trying to load at a specific commit and want
    // to error if we can't.
    const opts = { throwOnInvalidCommit: true, throwOnConflict: true, throwIfStale: false }

    // If 'commit' is ahead of 'initialState', sync state up to 'commit'
    const baseState = await this._applyTipToState(initialState, commitId.commit, opts)

    // If the commitId is now the tip, we're done.
    if (baseState.log[baseState.log.length - 1].cid.equals(commitId.commit)) {
      return baseState
    }

    // If the requested commit is included in the log, but isn't the most recent commit, we need
    // to reset the state to the state at the requested commit.
    return this.stateManipulator.resetStateToCommit(baseState, commitId.commit)
  }
}
