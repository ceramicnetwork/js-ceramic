import cloneDeep from 'lodash.clonedeep'
import * as u8a from 'uint8arrays'
import { toCID } from './cid-utils.js'

import {
  AnchorCommit,
  CeramicCommit,
  CommitData,
  IpfsApi,
  RawCommit,
  SignedCommit,
  SignedCommitContainer,
} from '../index.js'
import { AnchorStatus, StreamState, LogEntry } from '../stream.js'
import type { DagJWS } from 'dids'
import { StreamID, StreamType } from '@ceramicnetwork/streamid'

const TILE_TYPE_ID = 0

/**
 * Stream related utils
 */
export class StreamUtils {
  /**
   * Gets StreamID from the given StreamState object.
   * @param state
   */
  static streamIdFromState(state: StreamState): StreamID {
    return new StreamID(state.type, state.log[0].cid)
  }

  /**
   * Serializes commit
   * @param commit - Commit instance
   */
  static serializeCommit(commit: any): any {
    const cloned = cloneDeep(commit)

    if (StreamUtils.isSignedCommitContainer(cloned)) {
      cloned.jws.link = cloned.jws.link.toString()
      cloned.linkedBlock = u8a.toString(cloned.linkedBlock, 'base64')
      if (cloned.cacaoBlock) {
        cloned.cacaoBlock = u8a.toString(cloned.cacaoBlock, 'base64')
      }
      return cloned
    }

    if (StreamUtils.isSignedCommit(commit)) {
      cloned.link = cloned.link.toString()
    }

    if (StreamUtils.isAnchorCommit(commit)) {
      cloned.proof = cloned.proof.toString()
    }

    if (cloned.id) {
      cloned.id = cloned.id.toString()
    }

    if (cloned.prev) {
      cloned.prev = cloned.prev.toString()
    }

    if (commit.header?.model) {
      cloned.header.model = commit.header.model.toString()
    }

    return cloned
  }

  /**
   * Deserializes commit
   * @param commit - Commit instance
   */
  static deserializeCommit(commit: any): any {
    const cloned = cloneDeep(commit)

    if (StreamUtils.isSignedCommitContainer(cloned)) {
      cloned.jws.link = toCID(cloned.jws.link)
      cloned.linkedBlock = u8a.fromString(cloned.linkedBlock, 'base64')
      if (cloned.cacaoBlock) {
        cloned.cacaoBlock = u8a.fromString(cloned.cacaoBlock, 'base64')
      }
      return cloned
    }

    if (StreamUtils.isSignedCommit(cloned)) {
      cloned.link = toCID(cloned.link)
    }

    if (StreamUtils.isAnchorCommit(cloned)) {
      cloned.proof = toCID(cloned.proof)
    }

    if (cloned.id) {
      cloned.id = toCID(cloned.id)
    }

    if (cloned.prev) {
      cloned.prev = toCID(cloned.prev)
    }

    if (cloned.header?.model) {
      cloned.header.model = StreamID.fromString(cloned.header.model)
    }

    return cloned
  }

  /**
   * Serializes stream state for over the network transfer
   * @param state - Stream state
   */
  static serializeState(state: StreamState): any {
    const cloned = cloneDeep(state) as any

    cloned.log = cloned.log.map((entry: LogEntry) => ({ ...entry, cid: entry.cid.toString() }))
    if (cloned.anchorStatus != null) {
      cloned.anchorStatus = AnchorStatus[cloned.anchorStatus]
    }
    if (cloned.anchorScheduledFor != null) {
      cloned.anchorScheduledFor = new Date(cloned.anchorScheduledFor).toISOString()
    }
    if (cloned.anchorProof != null) {
      cloned.anchorProof.txHash = cloned.anchorProof.txHash.toString()
      cloned.anchorProof.root = cloned.anchorProof.root.toString()
    }
    if (state.metadata?.model) {
      cloned.metadata.model = state.metadata.model.toString()
    }
    if (state.next?.metadata?.model) {
      cloned.next.metadata.model = state.next.metadata.model.toString()
    }
    if (state.metadata?.unique && state.type != TILE_TYPE_ID) {
      cloned.metadata.unique = u8a.toString(cloned.metadata.unique, 'base64')
    }

    cloned.doctype = StreamType.nameByCode(cloned.type)

    return cloned
  }

  /**
   * Deserializes stream cloned from over the network transfer
   * @param state - Stream cloned
   */
  static deserializeState(state: any): StreamState {
    const cloned = cloneDeep(state)

    if (cloned.doctype) {
      cloned.type = StreamType.codeByName(cloned.doctype)
      delete cloned.doctype
    }

    cloned.log = cloned.log.map((entry: any): LogEntry => ({ ...entry, cid: toCID(entry.cid) }))
    if (cloned.anchorProof) {
      cloned.anchorProof.txHash = toCID(cloned.anchorProof.txHash)
      cloned.anchorProof.root = toCID(cloned.anchorProof.root)
    }

    let showScheduledFor = true
    if (cloned.anchorStatus) {
      cloned.anchorStatus = AnchorStatus[cloned.anchorStatus]
      showScheduledFor =
        cloned.anchorStatus !== AnchorStatus.FAILED && cloned.anchorStatus !== AnchorStatus.ANCHORED
    }
    if (cloned.anchorScheduledFor) {
      if (showScheduledFor) {
        cloned.anchorScheduledFor = Date.parse(cloned.anchorScheduledFor) // ISO format of the UTC time
      } else {
        delete cloned.anchorScheduledFor
      }
    }
    if (state.metadata?.model) {
      cloned.metadata.model = StreamID.fromString(state.metadata.model)
    }
    if (state.next?.metadata?.model) {
      cloned.next.metadata.model = StreamID.fromString(state.next.metadata.model)
    }
    if (state.metadata?.unique && state.type != TILE_TYPE_ID) {
      cloned.metadata.unique = u8a.fromString(state.metadata.unique, 'base64')
    }

    return cloned
  }

  static statesEqual(state1: StreamState, state2: StreamState): boolean {
    return (
      JSON.stringify(StreamUtils.serializeState(state1)) ===
      JSON.stringify(StreamUtils.serializeState(state2))
    )
  }

  /**
   * Returns true iff 'state' describes a state object containing all the same history as
   * 'base', possibly with additional commits on top.
   * @param state - the state that might be a superset of 'base'
   * @param base - the baseline to be compared against
   */
  static isStateSupersetOf(state: StreamState, base: StreamState): boolean {
    if (state.log.length < base.log.length) {
      return false
    }

    for (const i in base.log) {
      if (!state.log[i].cid.equals(base.log[i].cid)) {
        return false
      }
    }

    if (state.anchorStatus != base.anchorStatus) {
      // Re-creating a state object from the exact same set of commits can still lose information,
      // such as whether or not an anchor has been requested.
      return false
    }

    return true
  }

  /**
   * Asserts that the 'id' and 'prev' properties of the given commit properly link to the tip of
   * the given stream state.
   *
   * By the time the code gets into a StreamtypeHandler's applyCommit function the link to the state
   * should already have been established by the stream loading and conflict resolution code, so
   * if this check were to fail as part of a StreamtypeHandler's applyCommit function, that would
   * indicate a programming error.
   *
   * TODO: Use a process-fatal 'invariant' designed for checking against programming errors, once
   * we have a more robust error handling framework in place.
   * @param state
   * @param commit
   * @param skipIdCheck - There was a bug in older versions of ceramic that caused the 'id' field
   *   of Caip10Link update commits and some TileDocument update commits to be incorrect. Because
   *   of that we cannot verify the 'id' field for TileDocument and Caip10Link streams, and so
   *   the 'skipIdCheck' flag allows those two streamtypes to skip that check.  Newer streamtypes
   *   like Model and ModelInstanceDocument do not have this problem.
   */
  static assertCommitLinksToState(
    state: StreamState,
    commit: RawCommit | AnchorCommit,
    skipIdCheck = false
  ) {
    if (!skipIdCheck) {
      const streamId = this.streamIdFromState(state)
      if (!commit.id.equals(state.log[0].cid)) {
        throw new Error(
          `Invalid genesis CID in commit for StreamID ${streamId.toString()}. Found: ${
            commit.id
          }, expected ${state.log[0].cid}`
        )
      }
    }

    const expectedPrev = state.log[state.log.length - 1].cid
    if (!commit.prev.equals(expectedPrev)) {
      throw new Error(
        `Commit doesn't properly point to previous commit in log. Expected ${expectedPrev}, found 'prev' ${commit.prev}`
      )
    }
  }

  /**
   * Converts commit to SignedCommitContainer. The only difference is with signed commit for now
   * @param commit - Commit value
   * @param ipfs - IPFS instance
   */
  static async convertCommitToSignedCommitContainer(
    commit: CeramicCommit,
    ipfs: IpfsApi
  ): Promise<CeramicCommit> {
    if (StreamUtils.isSignedCommit(commit)) {
      const block = await ipfs.block.get((commit as DagJWS).link)
      return {
        jws: commit as DagJWS,
        linkedBlock: block,
      }
    }
    return commit
  }

  /**
   * Checks if commit is signed DTO ({jws: {}, linkedBlock: {}})
   * @param commit - Commit
   */
  static isSignedCommitContainer(commit: CeramicCommit): boolean {
    return commit && (commit as SignedCommitContainer).jws !== undefined
  }

  /**
   * Checks if commit is signed
   * @param commit - Commit
   */
  static isSignedCommit(commit: CeramicCommit): commit is SignedCommit {
    return commit && (commit as SignedCommit).link !== undefined
  }

  /**
   * Checks if commit is anchor commit
   * @param commit - Commit
   */
  static isAnchorCommit(commit: CeramicCommit): commit is AnchorCommit {
    return commit && (commit as AnchorCommit).proof !== undefined
  }

  /**
   * Checks if commit data is signed
   * @param commitData - Commit data
   */
  static isSignedCommitData(commitData: CommitData): boolean {
    return commitData && commitData.envelope !== undefined
  }

  /**
   * Checks if commit data is anchor commit
   * @param commitData - Commit data
   */
  static isAnchorCommitData(commitData: CommitData): boolean {
    return commitData && commitData.proof !== undefined
  }
}
