import { LogSyncer } from './log-syncer.js'
import { TipFetcher } from './tip-fetcher.js'
import { StateManipulator } from './state-manipulator.js'
import { AnchorTimestampExtractor } from './anchor-timestamp-extractor.js'
import { DiagnosticsLogger, StreamState, StreamUtils } from '@ceramicnetwork/common'
import { CommitID, StreamID } from '@ceramicnetwork/streamid'
import { applyTipToState } from './apply-tip-helper.js'
import { concatMap, lastValueFrom, merge, Observable, of } from 'rxjs'
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

  async _loadStateFromTip(
    streamID: StreamID,
    tip: CID,
    allowSyncErrors: boolean
  ): Promise<StreamState | null> {
    let logWithoutTimestamps
    try {
      logWithoutTimestamps = await this.logSyncer.syncFullLog(streamID, tip)
    } catch (err) {
      if (allowSyncErrors) {
        this.logger.warn(`Error while syncing log for tip ${tip}, for StreamID ${streamID}: ${err}`)

        return null
      } else {
        throw err
      }
    }
    const logWithTimestamps = await this.anchorTimestampExtractor.verifyAnchorAndApplyTimestamps(
      logWithoutTimestamps
    )
    return this.stateManipulator.applyFullLog(streamID.type, logWithTimestamps, {
      throwOnInvalidCommit: false,
    })
  }

  async _applyTips(streamID: StreamID, tipSource$: Observable<CID>): Promise<StreamState> {
    let state
    state = await lastValueFrom(
      tipSource$.pipe(
        concatMap(async (tip) => {
          if (!state) {
            // this is the first tip response, generate a new StreamState by syncing the tip.
            state = await this._loadStateFromTip(streamID, tip, true)
            return state
          } else {
            // This is not the first tip response we've seen, so instead of generating a completely
            // new StreamState, we apply the received tip to the state we already have.
            state = await applyTipToState(
              this.logSyncer,
              this.anchorTimestampExtractor,
              this.stateManipulator,
              state,
              tip,
              { throwOnInvalidCommit: false, throwOnConflict: false, throwIfStale: false }
            )
            return state
          }
        })
      ),
      { defaultValue: null }
    )

    if (state) {
      return state
    }

    // We got no valid tip response, so return the genesis state.
    return this.loadGenesisState(streamID)
  }

  /**
   * Completely loads the current state of a Stream from the p2p network just from the StreamID.
   * @param streamID
   * @param syncTimeoutSecs
   */
  async loadStream(streamID: StreamID, syncTimeoutSecs: number): Promise<StreamState> {
    this.stateManipulator.assertStreamTypeAppliable(streamID.type)
    const tipSource$ = this.tipFetcher.findPossibleTips(streamID, syncTimeoutSecs)
    return this._applyTips(streamID, tipSource$)
  }

  /**
   * Loads the current state of a Stream from the p2p network given a currently known, possibly
   * stale state of that Stream.
   * @param state
   * @param syncTimeoutSecs
   */
  async syncStream(state: StreamState, syncTimeoutSecs: number): Promise<StreamState> {
    const streamID = StreamUtils.streamIdFromState(state)
    const tipSource$ = await this.tipFetcher.findPossibleTips(streamID, syncTimeoutSecs)

    return lastValueFrom(
      tipSource$.pipe(
        concatMap(async (tip) => {
          try {
            state = await applyTipToState(
              this.logSyncer,
              this.anchorTimestampExtractor,
              this.stateManipulator,
              state,
              tip,
              { throwOnInvalidCommit: false, throwOnConflict: false, throwIfStale: false }
            )
          } catch (err) {
            this.logger.warn(
              `Error while applying tip ${tip} received from pubsub, to StreamID ${streamID}: ${err}`
            )
          }
          return state
        })
      ),
      { defaultValue: state }
    )
  }

  /**
   * Given the currently known about StreamState for a Stream, return the state of that stream
   * at a specific CommitID.
   * @param initialState
   * @param commitId
   */
  async stateAtCommit(initialState: StreamState, commitId: CommitID): Promise<StreamState> {
    // Throw if any commit fails to apply as we are trying to load at a specific commit and want
    // to error if we can't.
    const opts = { throwOnInvalidCommit: true, throwOnConflict: true, throwIfStale: false }

    // If 'commit' is ahead of 'initialState', sync state up to 'commit'
    const baseState = await applyTipToState(
      this.logSyncer,
      this.anchorTimestampExtractor,
      this.stateManipulator,
      initialState,
      commitId.commit,
      opts
    )

    // If the commitId is now the tip, we're done.
    if (baseState.log[baseState.log.length - 1].cid.equals(commitId.commit)) {
      return baseState
    }

    // If the requested commit is included in the log, but isn't the most recent commit, we need
    // to reset the state to the state at the requested commit.
    // We set 'copyTimestampsFromRemovedAnchors' to true because we want it to be possible to load
    // at a CommitID for a commit with a CACAO that has expired, but was anchored before it expired.
    // For that to work we need to port over the timestamp information from the most up-to-date
    // version of the stream state that we know about.
    return this.stateManipulator.resetStateToCommit(baseState, commitId.commit, {
      copyTimestampsFromRemovedAnchors: true,
    })
  }

  /**
   * Completely loads the current state of a Stream from the p2p network just from the StreamID.
   * TODO(CDB-2761): Delete this method.
   * @param streamID
   */
  async loadGenesisState(streamID: StreamID): Promise<StreamState> {
    this.stateManipulator.assertStreamTypeAppliable(streamID.type)
    return this._loadStateFromTip(streamID, streamID.cid, false)
  }

  /**
   * Given a known tip for a stream, fully resync and apply the log for that tip, while also
   * querying pubsub in parallel to discover any new possible tips, and then return the StreamState
   * corresponding to the best possible tip.
   * @param streamID
   * @param knownTip
   * @param syncTimeoutSecs
   */
  async resyncStream(
    streamID: StreamID,
    knownTip: CID,
    syncTimeoutSecs: number
  ): Promise<StreamState> {
    this.stateManipulator.assertStreamTypeAppliable(streamID.type)
    const pubsubTips$ = this.tipFetcher.findPossibleTips(streamID, syncTimeoutSecs)
    const tipSource$ = merge(of(knownTip), pubsubTips$)
    return this._applyTips(streamID, tipSource$)
  }
}
