import {
  AppliableStreamLog,
  CommitType,
  Context,
  DiagnosticsLogger,
  LogEntry,
  Stream,
  StreamHandler,
  StreamState,
  StreamUtils,
  UnappliableStreamLog,
} from '@ceramicnetwork/common'
import { HandlersMap } from '../handlers-map.js'
import { LogSyncer } from './log-syncer.js'

/**
 * @param throwOnInvalidCommit - if true, throws if there is an error applying a commit, otherwise
 *   returns the state that was built so far.
 */
interface ApplyFullLogOpts {
  throwOnInvalidCommit: boolean
}

/**
 * @param throwOnInvalidCommit - if true, throws if there is an error applying a commit, otherwise
 *   returns the state that was built so far.
 * @param throwIfStale - if true, throws if the log to apply does not build directly on top of
 *   the existing state.
 * @param throwOnConflict - if true, throws if the log to apply is rejected by conflict resolution.
 */
interface ApplyLogToStateOpts {
  throwOnInvalidCommit: boolean
  throwIfStale: boolean
  throwOnConflict: boolean
}

/**
 * Entirely stateless class for applying logs of Stream commits to StreamStates.  Handles all
 * conflict resolution rules. Does not do any i/o nor does it manage anything relating to caching or
 * persistence of the state information.
 */
export class StateManipulator {
  constructor(
    private readonly logger: DiagnosticsLogger,
    private readonly streamTypeHandlers: HandlersMap,
    private readonly context: Context,
    private readonly logSyncer: LogSyncer
  ) {}

  async _applyLog<T extends Stream>(
    handler: StreamHandler<T>,
    state: StreamState | null,
    log: AppliableStreamLog,
    throwOnInvalidCommit: boolean
  ): Promise<StreamState> {
    for (const commit of log.commits) {
      try {
        state = await handler.applyCommit(commit, this.context, state)
      } catch (err) {
        if (throwOnInvalidCommit || state == null) {
          throw err
        } else {
          return state
        }
      }
    }
    return state
  }

  /**
   * Applies a complete Stream log (including a Genesis commit) in order to create a StreamState.
   * @param streamType - the StreamType that this stream should be interpreted as.
   * @param log - list of commits to apply to create the stream, starting with the genesis commit
   * @param opts - options to control behavior during log application.
   */
  async applyFullLog(
    streamType: number,
    log: AppliableStreamLog,
    opts: ApplyFullLogOpts
  ): Promise<StreamState> {
    if (log.commits.length < 1) {
      throw new Error(`Log must contain at least one commit to apply`) // this should be impossible
    }
    const handler = this.streamTypeHandlers.get(streamType)

    return this._applyLog(handler, null, log, opts.throwOnInvalidCommit)
  }

  /**
   * Transforms an UnappliableStreamLog to an AppliableStreamLog by getting the timestamp
   * information from the log of an existing StreamState for the same stream.  Because the source
   * log comes from a StreamState that has already had its anchor commits validated, there is no
   * need to re-do the work of anchor commit validation.
   * Note the source log could be longer than the destination log and may contain anchors that
   * are not a part of the destination log - it is important that we ignore timestamps from anchors
   * that are not present in the destination log.
   * @param source - a log of LogEntries (which contains less information than a full CommitData)
   *   from a StreamState for the stream in question.  Must be at least as long as 'dest', and the
   *   entries must correspond 1-1 to the entries of 'dest' (up to the length of 'dest'). Must come
   *   from a StreamState where the timestamps from the anchor commits has already been validated.
   * @param dest - a freshly synced log containing a subset of the entries of 'source', but with
   *   full CommitDatas that have all the information necessary to apply the commits, but are
   *   missing timestamps extracted from the AnchorCommits.
   */
  _copyTrustedTimestamps(source: Array<LogEntry>, dest: UnappliableStreamLog): AppliableStreamLog {
    let timestamp = null
    for (let i = dest.commits.length - 1; i >= 0; i--) {
      if (source[i].type == CommitType.ANCHOR) {
        timestamp = source[i].timestamp
      }
      if (!source[i].cid.equals(dest.commits[i].cid)) {
        // this should be impossible and would indicate programmer error if it happened.
        // Included only as a sanity check.
        throw new Error(`Source and dest logs don't correspond!`)
      }

      dest.commits[i].expirationTime = source[i].expirationTime
      dest.commits[i].timestamp = timestamp
    }

    return { commits: dest.commits, timestampStatus: 'validated' }
  }

  _findAnchorIndex(log: Array<LogEntry>): number {
    return log.findIndex((logEntry) => logEntry.type == CommitType.ANCHOR)
  }

  /**
   * Given two different Stream logs representing two different conflicting histories of the same
   * Stream, pick which history to accept, in accordance with our conflict resolution strategy.
   * The inputted logs should contain only the new commits past the divergence point between the
   * two histories - there should be no commits in common between the two input logs.
   * @param log1
   * @param log2
   * @returns the log that is selected by the conflict resolution rules.
   */
  _pickLogToAccept(log1: Array<LogEntry>, log2: Array<LogEntry>): Array<LogEntry> {
    const firstAnchorIndexForLog1 = this._findAnchorIndex(log1)
    const firstAnchorIndexForLog2 = this._findAnchorIndex(log2)
    const isLog1Anchored = firstAnchorIndexForLog1 >= 0
    const isLog2Anchored = firstAnchorIndexForLog2 >= 0

    // When one of the logs is anchored but not the other, take the one that is anchored
    if (isLog1Anchored != isLog2Anchored) {
      return isLog1Anchored ? log1 : log2
    }

    if (isLog1Anchored && isLog2Anchored) {
      // When both logs are anchored, take the one anchored first.
      const anchorTimestamp1 = log1[firstAnchorIndexForLog1].timestamp
      const anchorTimestamp2 = log2[firstAnchorIndexForLog2].timestamp
      if (anchorTimestamp1 < anchorTimestamp2) {
        return log1
      } else if (anchorTimestamp2 < anchorTimestamp1) {
        return log2
      }
    }

    // When both logs are anchored in the same block (or neither log is anchored), compare log
    // lengths until that anchor (or the end of the log if not anchored) and choose the one with
    // longer length.
    // TODO(CDB-2746) - it's kind of dumb that we only consider the log up until the first anchor.
    // This is basically a holdover from the way conflict resolution was originally implemented, but
    // changing it now would be a breaking change.
    const relevantLength1 = isLog1Anchored ? firstAnchorIndexForLog1 + 1 : log1.length
    const relevantLength2 = isLog2Anchored ? firstAnchorIndexForLog2 + 1 : log2.length

    if (relevantLength1 > relevantLength2) {
      return log1
    } else if (relevantLength1 < relevantLength2) {
      return log2
    }

    // If we got this far, that means that we don't have sufficient information to make a good
    // decision about which log to choose.  The most common way this can happen is that neither log
    // is anchored, although it can also happen if both are anchored but in the same blockNumber or
    // blockTimestamp. At this point, the decision of which log to take is arbitrary, but we want it
    // to still be deterministic. Therefore, we take the log whose last entry has the lowest CID.
    return log1[log1.length - 1].cid.bytes < log2[log2.length - 1].cid.bytes ? log1 : log2
  }

  async _applyLogToState_noCacaoVerification(
    initialState: StreamState,
    logToApply: AppliableStreamLog,
    opts: ApplyLogToStateOpts
  ): Promise<StreamState> {
    if (logToApply.commits.length == 0) {
      return initialState
    }

    const handler = this.streamTypeHandlers.get(initialState.type)

    const firstNewCommit = logToApply.commits[0].commit
    const initialTip = initialState.log[initialState.log.length - 1].cid
    if (firstNewCommit.prev.equals(initialTip)) {
      // the new log starts where the previous one ended
      return this._applyLog(handler, initialState, logToApply, opts.throwOnInvalidCommit)
    }

    // we have a conflict since prev is in the log of the local state, but isn't the tip
    // BEGIN CONFLICT RESOLUTION
    const conflictingTip = logToApply.commits[logToApply.commits.length - 1].cid
    const streamId = StreamUtils.streamIdFromState(initialState)
    if (opts.throwIfStale) {
      // If this tip came from a client-initiated request and it doesn't build off the node's
      // current local state, that means the client has a stale view of the data.  Even if the new
      // commit would win the arbitrary conflict resolution with the local state, that just
      // increases the likelihood of lost writes. Clients should always at least be in sync with
      // their Ceramic node when authoring new writes.
      throw new Error(
        `Commit to stream ${streamId.toString()} rejected because it builds on stale state. Calling 'sync()' on the stream handle will synchronize the stream state in the client with that on the Ceramic node.  Rejected commit CID: ${conflictingTip}. Current tip: ${initialTip}`
      )
    }

    // Index of the last entry that is shared between both histories
    const conflictIdx = initialState.log.findIndex((entry) => entry.cid.equals(firstNewCommit.prev))
    const localConflictingLog = initialState.log.slice(conflictIdx + 1)
    const selectedLog = this._pickLogToAccept(localConflictingLog, logToApply.commits)
    if (selectedLog == localConflictingLog) {
      if (opts.throwOnConflict) {
        throw new Error(
          `Commit to stream ${streamId.toString()} rejected by conflict resolution. Rejected commit CID: ${conflictingTip.toString()}. Current tip: ${initialTip.toString()}`
        )
      }
      return initialState
    }

    // Remote log was selected.  We need to build the state that corresponds to the new log.

    // First get the stream state at the divergence point
    const sharedLogWithoutTimestamps = await this.logSyncer.syncFullLog(
      streamId,
      initialState.log[conflictIdx].cid
    )
    const sharedLogWithTimestamps = this._copyTrustedTimestamps(
      initialState.log,
      sharedLogWithoutTimestamps
    )
    const sharedState = await this._applyLog(handler, null, sharedLogWithTimestamps, true)

    // Now apply the new log to the shared state
    return this._applyLog(handler, sharedState, logToApply, opts.throwOnInvalidCommit)
  }
  /**
   * Applies a log of new commits to an existing StreamState to get the updated StreamState
   * resulting from applying the log. It's possible that the new StreamState could be the same as
   * the old one if the log is rejected due to conflict resolution.
   * @param initialState - current StreamState to apply commits onto
   * @param logToApply - list of commits to apply to the given StreamState
   * @param opts - options to control behavior during log application.
   */
  async applyLogToState(
    initialState: StreamState,
    logToApply: AppliableStreamLog,
    opts: ApplyLogToStateOpts
  ): Promise<StreamState> {
    const state = await this._applyLogToState_noCacaoVerification(initialState, logToApply, opts)

    // The initial state may have included commits that were valid previously but have since had
    // their CACAOs expire.  Before returning the state back to the caller we should double-check
    // that it is based all on valid commits without expired CACAOs.
    StreamUtils.checkForCacaoExpiration(state)

    return state
  }
}
