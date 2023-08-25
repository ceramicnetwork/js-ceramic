import type { CID } from 'multiformats/cid'
import {
  AnchorStatus,
  AnchorValidator,
  CommitData,
  CommitType,
  Context,
  DiagnosticsLogger,
  InternalOpts,
  LogEntry,
  Stream,
  StreamHandler,
  StreamState,
  StreamStateHolder,
  StreamUtils,
} from '@ceramicnetwork/common'
import { Dispatcher } from './dispatcher.js'
import cloneDeep from 'lodash.clonedeep'
import { CommitID, StreamID } from '@ceramicnetwork/streamid'
import { HandlersMap } from './handlers-map.js'
import { Utils } from './utils.js'
import { AnchorTimestampExtractor } from './loading/anchor_timestamp_extractor.js'

/**
 * Given two different StreamStates representing two different conflicting histories of the same
 * stream, pick which commit to accept, in accordance with our conflict resolution strategy
 * @param state1 - first log's state
 * @param state2 - second log's state
 * @returns the StreamState containing the log that is selected
 */
export async function pickLogToAccept(
  state1: StreamState,
  state2: StreamState
): Promise<StreamState> {
  const isState1Anchored = state1.anchorStatus === AnchorStatus.ANCHORED
  const isState2Anchored = state2.anchorStatus === AnchorStatus.ANCHORED

  if (isState1Anchored != isState2Anchored) {
    // When one of the logs is anchored but not the other, take the one that is anchored
    return isState1Anchored ? state1 : state2
  }

  if (isState1Anchored && isState2Anchored) {
    // compare anchor proofs if both states are anchored
    const { anchorProof: proof1 } = state1
    const { anchorProof: proof2 } = state2

    if (proof1.chainId != proof2.chainId) {
      // TODO: Add logic to handle conflicting updates anchored on different chains
      throw new Error(
        'Conflicting logs on the same stream are anchored on different chains. Chain1: ' +
          proof1.chainId +
          ', chain2: ' +
          proof2.chainId
      )
    }

    // Compare anchor block timestamp to decide which to take.  Even though blockTimestamps can
    // drift from wallclock time, they are guaranteed to be increasing in increasing blockNumbers
    // (see Ethereum Yellowpaper section "Block Header Validity"), so they are still safe to compare
    // for relative ordering.
    const anchorTimestamp1 = StreamUtils.anchorTimestampFromState(state1)
    const anchorTimestamp2 = StreamUtils.anchorTimestampFromState(state2)
    if (anchorTimestamp1 < anchorTimestamp2) {
      return state1
    } else if (anchorTimestamp2 < anchorTimestamp1) {
      return state2
    }
    // If they have the same block number fall through to fallback mechanism
  }

  // The anchor states are the same for both logs. Compare log lengths and choose the one with longer length.
  if (state1.log.length > state2.log.length) {
    return state1
  } else if (state1.log.length < state2.log.length) {
    return state2
  }

  // If we got this far, that means that we don't have sufficient information to make a good
  // decision about which log to choose.  The most common way this can happen is that neither log
  // is anchored, although it can also happen if both are anchored but in the same blockNumber or
  // blockTimestamp. At this point, the decision of which log to take is arbitrary, but we want it
  // to still be deterministic. Therefore, we take the log whose last entry has the lowest CID.
  return state1.log[state1.log.length - 1].cid.bytes < state2.log[state2.log.length - 1].cid.bytes
    ? state1
    : state2
}

export class HistoryLog {
  static fromState(dispatcher: Dispatcher, state: StreamState): HistoryLog {
    return new HistoryLog(dispatcher, state.log, StreamUtils.streamIdFromState(state))
  }

  constructor(
    private readonly dispatcher: Dispatcher,
    readonly items: LogEntry[],
    readonly streamId: StreamID
  ) {}

  get length(): number {
    return this.items.length
  }

  /**
   * Determines if the HistoryLog includes a CID, returning true or false as appropriate.
   */
  includes(cid: CID): boolean {
    const index = this.findIndex(cid)
    return index !== -1
  }

  get last(): CID {
    return this.items[this.items.length - 1].cid
  }

  /**
   * Find index of the commit in the array
   *
   * @param cid - CID value
   */
  findIndex(cid: CID): number {
    return this.items.findIndex((entry) => entry.cid.equals(cid))
  }

  slice(start?: number, end?: number): HistoryLog {
    const next = this.items.slice(start, end)
    return new HistoryLog(this.dispatcher, next, this.streamId)
  }

  async toCommitData(): Promise<CommitData[]> {
    return await Promise.all(
      this.items.map(
        async (logEntry) =>
          await Utils.getCommitData(
            this.dispatcher,
            logEntry.cid,
            this.streamId,
            logEntry.timestamp
          )
      )
    )
  }
}

/**
 * Fetch log to find a connection for the given CID.
 * Expands SignedCommits and adds a CID into the log for their inner `link` commits
 *
 * @param dispatcher - Get commit from IPFS
 * @param cid - Commit CID
 * @param stateLog - Log from the current stream state
 * @param unappliedCommits - Unapplied commits found so far
 * @private
 */
export async function fetchLog(
  dispatcher: Dispatcher,
  cid: CID,
  stateLog: HistoryLog,
  unappliedCommits: CommitData[] = []
): Promise<CommitData[]> {
  if (stateLog.includes(cid)) {
    // already processed
    return []
  }
  // Fetch expanded `CommitData` using the CID and running timestamp
  const nextCommitData = await Utils.getCommitData(dispatcher, cid, stateLog.streamId)
  const prevCid: CID = nextCommitData.commit.prev
  if (!prevCid) {
    // Someone sent a tip that is a fake log, i.e. a log that at some point does not refer to a previous or genesis
    // commit.
    return []
  }

  // Should be unshift [O(N)], but push [O(1)] + reverse [O(N)] seem better
  unappliedCommits.push(nextCommitData)
  if (stateLog.includes(prevCid)) {
    // we found the connection to the canonical log
    return unappliedCommits.reverse()
  }
  return fetchLog(dispatcher, prevCid, stateLog, unappliedCommits)
}

export function commitAtTime(stateHolder: StreamStateHolder, timestamp: number): CommitID {
  let commitCid: CID = stateHolder.state.log[0].cid
  for (const entry of stateHolder.state.log) {
    if (entry.type === CommitType.ANCHOR) {
      if (entry.timestamp <= timestamp) {
        commitCid = entry.cid
      } else {
        break
      }
    }
  }
  return CommitID.make(stateHolder.id, commitCid)
}

export class ConflictResolution {
  constructor(
    public logger: DiagnosticsLogger,
    public anchorTimestampExtractor: AnchorTimestampExtractor,
    private readonly dispatcher: Dispatcher,
    private readonly context: Context,
    private readonly handlers: HandlersMap
  ) {}

  /**
   * Applies the log to the stream and updates the state.
   * If an error is encountered while applying a commit, commit application stops and the state
   * that was built thus far is returned, unless 'opts.throwOnInvalidCommit' is true.
   */
  private async applyLogToState<T extends Stream>(
    handler: StreamHandler<T>,
    unappliedCommits: CommitData[],
    state: StreamState | null,
    breakOnAnchor: boolean,
    opts: InternalOpts
  ): Promise<StreamState> {
    state = await this._applyLogToState_noCacaoVerification(
      handler,
      unappliedCommits,
      state,
      breakOnAnchor,
      opts
    )
    StreamUtils.checkForCacaoExpiration(state)

    return state
  }

  private async _applyLogToState_noCacaoVerification<T extends Stream>(
    handler: StreamHandler<T>,
    unappliedCommits: CommitData[],
    state: StreamState | null,
    breakOnAnchor: boolean,
    opts: InternalOpts
  ): Promise<StreamState> {
    for (const entry of unappliedCommits) {
      try {
        state = await handler.applyCommit(entry, this.context, state)
      } catch (err) {
        const streamId = state ? StreamUtils.streamIdFromState(state).toString() : null
        this.logger.warn(
          `Error while applying commit ${entry.cid.toString()} to stream ${streamId}: ${err}`
        )
        if (opts.throwOnInvalidCommit) {
          throw err
        } else {
          return state
        }
      }

      if (breakOnAnchor && AnchorStatus.ANCHORED === state.anchorStatus) {
        return state
      }
    }
    return state
  }

  /**
   * Applies the log to the state.
   *
   * @param initialState - State to apply log to.
   * @param initialStateLog - HistoryLog representation of the `initialState.log` with SignedCommits expanded out and CIDs for their `link` commit included in the log.
   * @param unappliedCommits - commits to apply
   * @param opts - options that control the behavior when applying the commit
   */
  private async applyLog(
    initialState: StreamState,
    initialStateLog: HistoryLog,
    unappliedCommits: CommitData[],
    opts: InternalOpts
  ): Promise<StreamState | null> {
    const handler = this.handlers.get(initialState.type)
    const tip = initialStateLog.last
    if (unappliedCommits[unappliedCommits.length - 1].cid.equals(tip)) {
      // log already applied
      return null
    }
    const commitData = unappliedCommits[0]
    if (commitData.commit.prev.equals(tip)) {
      // the new log starts where the previous one ended
      return this.applyLogToState(handler, unappliedCommits, cloneDeep(initialState), false, opts)
    }

    // we have a conflict since prev is in the log of the local state, but isn't the tip
    // BEGIN CONFLICT RESOLUTION
    const conflictingTip = unappliedCommits[unappliedCommits.length - 1].cid
    const streamId = StreamUtils.streamIdFromState(initialState)
    if (opts.throwIfStale) {
      // If this tip came from a client-initiated request and it doesn't build off the node's
      // current local state, that means the client has a stale view of the data.  Even if the new
      // commit would win the arbitrary conflict resolution with the local state, that just
      // increases the likelihood of lost writes. Clients should always at least be in sync with
      // their Ceramic node when authoring new writes.
      throw new Error(
        `Commit to stream ${streamId.toString()} rejected because it builds on stale state. Calling 'sync()' on the stream handle will synchronize the stream state in the client with that on the Ceramic node.  Rejected commit CID: ${conflictingTip}. Current tip: ${tip}`
      )
    }

    const conflictIdx = initialStateLog.findIndex(commitData.commit.prev) + 1
    const canonicalLog = await initialStateLog.toCommitData()
    // The conflict index applies equivalently to the CommitData array derived from the canonical state log
    const localLog = canonicalLog.splice(conflictIdx)
    // Compute state up till conflictIdx
    const state: StreamState = await this.applyLogToState(handler, canonicalLog, null, false, opts)
    // Compute next transition in parallel
    const localState = await this.applyLogToState(handler, localLog, cloneDeep(state), true, opts)
    const remoteState = await this.applyLogToState(
      handler,
      unappliedCommits,
      cloneDeep(state),
      true,
      opts
    )

    const selectedState = await pickLogToAccept(localState, remoteState)
    if (selectedState === localState) {
      if (opts.throwOnConflict) {
        const tip = localState.log[localState.log.length - 1].cid
        throw new Error(
          `Commit to stream ${streamId.toString()} rejected by conflict resolution. Rejected commit CID: ${conflictingTip.toString()}. Current tip: ${tip.toString()}`
        )
      }
      return null
    }

    return this.applyLogToState(handler, unappliedCommits, cloneDeep(state), false, opts)
  }

  /**
   * Add tip to the state. Return null if already applied.
   *
   * @param initialState - State to start from
   * @param tip - Commit CID
   * @param opts - options that control the behavior when applying the commit
   */
  async applyTip(
    initialState: StreamState,
    tip: CID,
    opts: InternalOpts
  ): Promise<StreamState | null> {
    if (initialState.log.find((logEntry) => logEntry.cid.equals(tip))) {
      // Tip is already included in the log, nothing to do
      return null
    }

    const stateLog = HistoryLog.fromState(this.dispatcher, initialState)
    const logWithoutTimestamps = await fetchLog(this.dispatcher, tip, stateLog)
    if (!logWithoutTimestamps.length) {
      return null
    }
    const log = await this.anchorTimestampExtractor.verifyAnchorAndApplyTimestamps({
      commits: logWithoutTimestamps,
      anchorTimestampsValidated: false,
    })
    return this.applyLog(initialState, stateLog, log.commits, opts)
  }

  /**
   * Return state at `commitId` version.
   */
  async snapshotAtCommit(initialState: StreamState, commitId: CommitID): Promise<StreamState> {
    // Throw if any commit fails to apply as we are trying to load at a specific commit and want
    // to error if we can't.
    const opts = { throwOnInvalidCommit: true, throwOnConflict: true, throwIfStale: false }

    // If 'commit' is ahead of 'initialState', sync state up to 'commit'
    const baseState = (await this.applyTip(initialState, commitId.commit, opts)) || initialState

    const baseStateLog = HistoryLog.fromState(this.dispatcher, baseState)

    // If 'commit' is not included in stream's log at this point, that means that conflict resolution
    // rejected it.
    const commitIndex = baseStateLog.findIndex(commitId.commit)
    if (commitIndex < 0) {
      throw new Error(
        `Requested commit CID ${commitId.commit.toString()} not found in the log for stream ${commitId.baseID.toString()}`
      )
    }

    // If the requested commit is included in the log, but isn't the most recent commit, we need
    // to reset the state to the state at the requested commit.
    // The calculated commit index applies equivalently to the CommitData array derived from the base state log
    const resetLog = await baseStateLog.slice(0, commitIndex + 1).toCommitData()
    const handler = this.handlers.get(initialState.type)
    return this.applyLogToState(handler, resetLog, null, false, opts)
  }
}
