import { LogSyncer } from './log-syncer.js'
import { TipFetcher } from './tip-fetcher.js'
import { StateManipulator } from './state-manipulator.js'
import { AnchorTimestampExtractor } from './anchor-timestamp-extractor.js'
import { DiagnosticsLogger, StreamState, StreamUtils } from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'

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
    const logWithoutTimestamps = await this.logSyncer.syncLogUntilMatch(
      streamID,
      tip,
      state.log.map((logEntry) => logEntry.cid)
    )
    const logWithTimestamps = await this.anchorTimestampExtractor.verifyAnchorAndApplyTimestamps(
      logWithoutTimestamps
    )
    return await this.stateManipulator.applyLogToState(state, logWithTimestamps, {
      throwOnInvalidCommit: false,
      throwIfStale: false,
      throwOnConflict: false,
    })
  }
}
