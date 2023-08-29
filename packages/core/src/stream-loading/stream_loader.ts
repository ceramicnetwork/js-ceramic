import { LogSyncer } from './log_syncer.js'
import { TipFetcher } from './tip_fetcher.js'
import { StateManipulator } from './state_manipulator.js'
import { DiagnosticsLogger, StreamState, StreamUtils } from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'
import { Dispatcher } from '../dispatcher.js'
import { AnchorTimestampExtractor } from './anchor_timestamp_extractor.js'

/**
 * Class to contain all the logic for loading a stream, including fetching the relevant commit
 * data from the p2p network and applying the commits to get a StreamState.  It notably however does
 * not manage the persistence of the state information, nor updating the cache or indexing. It is
 * purely stateless.
 */
export class StreamLoader {
  constructor(
    readonly logger: DiagnosticsLogger,
    readonly dispatcher: Dispatcher,
    readonly tipFetcher: TipFetcher,
    readonly logSyncer: LogSyncer,
    readonly anchorTimestampExtractor: AnchorTimestampExtractor,
    readonly stateManipulator: StateManipulator
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
    return await this.stateManipulator.applyFullLog(logWithTimestamps)
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
    const logWithoutTimestamps = await this.logSyncer.syncLogUntil(
      streamID,
      tip,
      state.log[state.log.length - 1].cid
    )
    const logWithTimestamps = await this.anchorTimestampExtractor.verifyAnchorAndApplyTimestamps(
      logWithoutTimestamps
    )
    return await this.stateManipulator.applyLogToState(state, logWithTimestamps)
  }
}
