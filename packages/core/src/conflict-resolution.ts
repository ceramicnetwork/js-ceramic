import type CID from 'cids'
import {
  AnchorCommit,
  AnchorProof,
  AnchorStatus,
  CommitType,
  Context,
  StreamState,
  StreamStateHolder,
  Stream,
  StreamHandler,
  StreamUtils,
  LogEntry,
  AnchorValidator,
} from '@ceramicnetwork/common'
import { Dispatcher } from './dispatcher'
import cloneDeep from 'lodash.clonedeep'
import { CommitID } from '@ceramicnetwork/streamid'
import { StateValidation } from './state-management/state-validation'
import { HandlersMap } from './handlers-map'

/**
 * Verifies anchor commit structure
 *
 * @param dispatcher - To get raw blob from IPFS
 * @param anchorValidator - AnchorValidator to verify chain inclusion
 * @param commit - Anchor commit
 */
async function verifyAnchorCommit(
  dispatcher: Dispatcher,
  anchorValidator: AnchorValidator,
  commit: AnchorCommit
): Promise<AnchorProof> {
  const proofCID = commit.proof
  const proof = await dispatcher.retrieveFromIPFS(proofCID)

  let prevCIDViaMerkleTree
  try {
    // optimize verification by using ipfs.dag.tree for fetching the nested CID
    if (commit.path.length === 0) {
      prevCIDViaMerkleTree = proof.root
    } else {
      const merkleTreeParentRecordPath =
        '/root/' + commit.path.substr(0, commit.path.lastIndexOf('/'))
      const last: string = commit.path.substr(commit.path.lastIndexOf('/') + 1)

      const merkleTreeParentRecord = await dispatcher.retrieveFromIPFS(
        proofCID,
        merkleTreeParentRecordPath
      )
      prevCIDViaMerkleTree = merkleTreeParentRecord[last]
    }
  } catch (e) {
    throw new Error(`The anchor commit couldn't be verified. Reason ${e.message}`)
  }

  if (commit.prev.toString() !== prevCIDViaMerkleTree.toString()) {
    throw new Error(
      `The anchor commit proof ${commit.proof.toString()} with path ${
        commit.path
      } points to invalid 'prev' commit`
    )
  }

  await anchorValidator.validateChainInclusion(proof)
  return proof
}

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

    // Compare block heights to decide which to take
    if (proof1.blockNumber < proof2.blockNumber) {
      return state1
    } else if (proof2.blockNumber < proof1.blockNumber) {
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
    return new HistoryLog(dispatcher, state.log)
  }

  constructor(private readonly dispatcher: Dispatcher, readonly items: LogEntry[]) {}

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
    return new HistoryLog(this.dispatcher, next)
  }
}

/**
 * Fetch log to find a connection for the given CID.
 * Expands SignedCommits and adds a CID into the log for their inner `link` records
 *
 * @param dispatcher - Get commit from IPFS
 * @param cid - Commit CID
 * @param stateLog - Log from the current stream state
 * @param log - Found log so far
 * @param timestamp - Previously found timestamp
 * @private
 */
export async function fetchLog(
  dispatcher: Dispatcher,
  cid: CID,
  stateLog: HistoryLog,
  log: LogEntry[] = [],
  timestamp?: number
): Promise<LogEntry[]> {
  if (stateLog.includes(cid)) {
    // already processed
    return []
  }
  const commit = await dispatcher.retrieveCommit(cid)
  if (!commit) throw new Error(`No commit found for CID ${cid.toString()}`)

  let payload = commit
  const isSignedCommit = StreamUtils.isSignedCommit(commit)
  if (isSignedCommit) {
    payload = await dispatcher.retrieveCommit(commit.link)
    if (!payload) throw new Error(`No commit found for CID ${commit.link.toString()}`)
  }
  const prevCid: CID = payload.prev
  if (!prevCid) {
    // this is a fake log
    return []
  }
  let nextEntry: LogEntry
  if (StreamUtils.isAnchorCommit(commit)) {
    const proof = await dispatcher.retrieveFromIPFS(commit.proof)
    timestamp = proof.blockTimestamp
    nextEntry = {
      type: CommitType.ANCHOR,
      cid: cid,
      timestamp: timestamp,
    }
  } else {
    nextEntry = {
      type: CommitType.SIGNED,
      cid: cid,
      timestamp: timestamp,
    }
  }

  // Should be unshift [O(N)], but push [O(1)] + reverse [O(N)] seem better
  log.push(nextEntry)
  if (stateLog.includes(prevCid)) {
    // we found the connection to the canonical log
    return log.reverse()
  }
  return fetchLog(dispatcher, prevCid, stateLog, log, timestamp)
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
  return stateHolder.id.atCommit(commitCid)
}

export class ConflictResolution {
  constructor(
    public anchorValidator: AnchorValidator,
    private readonly stateValidation: StateValidation,
    private readonly dispatcher: Dispatcher,
    private readonly context: Context,
    private readonly handlers: HandlersMap
  ) {}

  /**
   * Applies the log to the stream and updates the state.
   */
  private async applyLogToState<T extends Stream>(
    handler: StreamHandler<T>,
    log: LogEntry[],
    state?: StreamState,
    breakOnAnchor?: boolean
  ): Promise<StreamState> {
    // When we have genesis state only, and add some commits on top, we should check a signature at particular timestamp.
    // Most probably there is a timestamp information there. If no timestamp found, we consider it to be _now_.
    // `fetchLog` provides the timestamps.
    if (state && state.log.length === 1) {
      const timestamp = log[0].timestamp
      const genesisCid = state.log[0].cid
      const genesis = await this.dispatcher.retrieveCommit(genesisCid)
      await handler.applyCommit(genesis, { cid: genesisCid, timestamp: timestamp }, this.context)
    }
    const itr = log.entries()
    let entry = itr.next()
    while (!entry.done) {
      const logEntry = entry.value[1]
      const commit = await this.dispatcher.retrieveCommit(logEntry.cid)
      // TODO - should catch potential thrown error here

      let payload = commit
      if (StreamUtils.isSignedCommit(commit)) {
        payload = await this.dispatcher.retrieveCommit(commit.link)
      }

      if (payload.proof) {
        // it's an anchor commit
        // TODO: Anchor validation should be done by the StreamHandler as part of applying the anchor commit
        await verifyAnchorCommit(this.dispatcher, this.anchorValidator, commit)
        state = await handler.applyCommit(commit, logEntry, this.context, state)
      } else {
        // it's a signed commit
        const tmpState = await handler.applyCommit(commit, logEntry, this.context, state)
        const isGenesis = !payload.prev
        const effectiveState = isGenesis ? tmpState : tmpState.next
        // TODO: Schema validation should be done by the StreamHandler as part of applying the commit
        await this.stateValidation.validate(effectiveState, effectiveState.content)
        state = tmpState // if validation is successful
      }

      if (breakOnAnchor && AnchorStatus.ANCHORED === state.anchorStatus) {
        return state
      }
      entry = itr.next()
    }
    return state
  }

  /**
   * Applies the log to the state.
   *
   * @param initialState - State to apply log to.
   * @param initialStateLog - HistoryLog representation of the `initialState.log` with SignedCommits expanded out and CIDs for their `link` record included in the log.
   * @param log - commits to apply
   */
  private async applyLog(
    initialState: StreamState,
    initialStateLog: HistoryLog,
    log: LogEntry[]
  ): Promise<StreamState | null> {
    const handler = this.handlers.get(initialState.type)
    const tip = initialStateLog.last
    if (log[log.length - 1].cid.equals(tip)) {
      // log already applied
      return null
    }
    const cid = log[0].cid
    const commit = await this.dispatcher.retrieveCommit(cid)
    let payload = commit
    if (StreamUtils.isSignedCommit(commit)) {
      payload = await this.dispatcher.retrieveCommit(commit.link)
    }
    if (payload.prev.equals(tip)) {
      // the new log starts where the previous one ended
      return this.applyLogToState(handler, log, cloneDeep(initialState))
    }

    // we have a conflict since prev is in the log of the local state, but isn't the tip
    // BEGIN CONFLICT RESOLUTION
    const conflictIdx = initialStateLog.findIndex(payload.prev) + 1
    const canonicalLog = initialStateLog.items
    const localLog = canonicalLog.splice(conflictIdx)
    // Compute state up till conflictIdx
    const state: StreamState = await this.applyLogToState(handler, canonicalLog)
    // Compute next transition in parallel
    const localState = await this.applyLogToState(handler, localLog, cloneDeep(state), true)
    const remoteState = await this.applyLogToState(handler, log, cloneDeep(state), true)

    const selectedState = await pickLogToAccept(localState, remoteState)
    if (selectedState === localState) {
      return null
    }

    return this.applyLogToState(handler, log, cloneDeep(state))
  }

  /**
   * Add tip to the state. Return null if already applied.
   *
   * @param initialState - State to start from
   * @param tip - Commit CID
   */
  async applyTip(initialState: StreamState, tip: CID): Promise<StreamState | null> {
    const stateLog = HistoryLog.fromState(this.dispatcher, initialState)
    const log = await fetchLog(this.dispatcher, tip, stateLog)
    if (log.length) {
      return this.applyLog(initialState, stateLog, log)
    }
  }

  /**
   * Verify signature of a lone genesis commit, using current time to check for revoked key.
   */
  async verifyLoneGenesis(state: StreamState) {
    const handler = this.handlers.get(state.type)
    const genesisCid = state.log[0].cid
    const genesis = await this.dispatcher.retrieveCommit(genesisCid)
    await handler.applyCommit(genesis, { cid: genesisCid }, this.context)
  }

  /**
   * Return state at `commitId` version.
   */
  async snapshotAtCommit(initialState: StreamState, commitId: CommitID): Promise<StreamState> {
    // If 'commit' is ahead of 'initialState', sync state up to 'commit'
    const baseState = (await this.applyTip(initialState, commitId.commit)) || initialState

    const baseStateLog = HistoryLog.fromState(this.dispatcher, baseState)

    // If 'commit' is not included in stream's log at this point, that means that conflict resolution
    // rejected it.
    const commitIndex = await baseStateLog.findIndex(commitId.commit)
    if (commitIndex < 0) {
      throw new Error(
        `Requested commit CID ${commitId.commit.toString()} not found in the log for stream ${commitId.baseID.toString()}`
      )
    }

    // If the requested commit is included in the log, but isn't the most recent commit, we need
    // to reset the state to the state at the requested commit.
    const resetLog = baseStateLog.slice(0, commitIndex + 1).items
    const handler = this.handlers.get(initialState.type)
    return this.applyLogToState(handler, resetLog)
  }
}
