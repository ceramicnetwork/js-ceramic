import { LogSyncer } from './log-syncer.js'
import { ApplyLogToStateOpts, StateManipulator } from './state-manipulator.js'
import { AnchorTimestampExtractor } from './anchor-timestamp-extractor.js'
import { StreamState, StreamUtils } from '@ceramicnetwork/common'
import { CID } from 'multiformats/cid'

/**
 * Helper function for taking a StreamState and a tip CID and returning the new StreamState that
 * results from applying that tip to the state.
 * @param logSyncer
 * @param anchorTimestampExtractor
 * @param stateManipulator
 * @param state
 * @param tip
 * @param opts
 */
export async function applyTipToState(
  logSyncer: LogSyncer,
  anchorTimestampExtractor: AnchorTimestampExtractor,
  stateManipulator: StateManipulator,
  state: StreamState,
  tip: CID,
  opts: ApplyLogToStateOpts
): Promise<StreamState> {
  const streamID = StreamUtils.streamIdFromState(state)
  const logWithoutTimestamps = await logSyncer.syncLogUntilMatch(
    streamID,
    tip,
    state.log.map((logEntry) => logEntry.cid)
  )
  const logWithTimestamps = await anchorTimestampExtractor.verifyAnchorAndApplyTimestamps(
    logWithoutTimestamps
  )
  return stateManipulator.applyLogToState(state, logWithTimestamps, opts)
}
