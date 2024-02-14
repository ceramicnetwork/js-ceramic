import cloneDeep from 'lodash.clonedeep'
import * as uint8arrays from 'uint8arrays'
import { toCID } from './cid-utils.js'
import * as dagCBOR from '@ipld/dag-cbor'
import {
  AnchorCommit,
  AnchorStatus,
  CeramicCommit,
  CommitData,
  EventType,
  LogEntry,
  RawCommit,
  SignedCommit,
  SignedCommitContainer,
  StreamState,
} from '../stream.js'
import type { DagJWS } from 'dids'
import { CommitID, StreamID, StreamType } from '@ceramicnetwork/streamid'
import { CID } from 'multiformats/cid'
import { base64urlToJSON } from './uint8array-utils.js'
import { IpfsApi } from '../index.js'

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

  static tipFromState(state: StreamState): CID {
    return state.log[state.log.length - 1].cid
  }

  /**
   * Serializes commit
   * @param commit - Commit instance
   */
  static serializeCommit(commit: any): any {
    const cloned = cloneDeep(commit)

    if (StreamUtils.isSignedCommitContainer(cloned)) {
      cloned.jws.link = cloned.jws.link.toString()
      cloned.linkedBlock = uint8arrays.toString(cloned.linkedBlock, 'base64')
      if (cloned.cacaoBlock) {
        cloned.cacaoBlock = uint8arrays.toString(cloned.cacaoBlock, 'base64')
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
      cloned.header.model = uint8arrays.toString(commit.header.model, 'base64')
    }

    if (commit.header?.context) {
      cloned.header.context = uint8arrays.toString(commit.header.context, 'base64')
    }

    if (commit.header?.unique) {
      cloned.header.unique = uint8arrays.toString(commit.header.unique, 'base64')
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
      cloned.linkedBlock = uint8arrays.fromString(cloned.linkedBlock, 'base64')
      if (cloned.cacaoBlock) {
        cloned.cacaoBlock = uint8arrays.fromString(cloned.cacaoBlock, 'base64')
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
      cloned.header.model = uint8arrays.fromString(cloned.header.model, 'base64')
    }

    if (cloned.header?.context) {
      cloned.header.context = uint8arrays.fromString(cloned.header.context, 'base64')
    }

    if (cloned.header?.unique) {
      cloned.header.unique = uint8arrays.fromString(cloned.header.unique, 'base64')
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
    if (cloned.anchorProof != null) {
      cloned.anchorProof.txHash = cloned.anchorProof.txHash.toString()
      cloned.anchorProof.root = cloned.anchorProof.root.toString()
    }
    if (state.metadata?.model) {
      cloned.metadata.model = state.metadata.model.toString()
    }
    if (state.metadata?.context) {
      cloned.metadata.context = state.metadata.context.toString()
    }
    if (state.metadata?.unique && state.type != TILE_TYPE_ID) {
      cloned.metadata.unique = uint8arrays.toString(cloned.metadata.unique, 'base64')
    }

    cloned.doctype = StreamType.nameByCode(cloned.type)

    return cloned
  }

  /**
   * Deserializes stream cloned from over the network transfer. Returns null if given null as a param.
   * @param state - Stream cloned
   */
  static deserializeState(state: any): StreamState | null {
    if (!state) return null

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

    if (cloned.anchorStatus) {
      cloned.anchorStatus = AnchorStatus[cloned.anchorStatus]
    }

    if (state.metadata?.model) {
      cloned.metadata.model = StreamID.fromString(state.metadata.model)
    }
    if (state.metadata?.context) {
      cloned.metadata.context = StreamID.fromString(state.metadata.context)
    }
    if (state.metadata?.unique && state.type != TILE_TYPE_ID) {
      cloned.metadata.unique = uint8arrays.fromString(state.metadata.unique, 'base64')
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

    if (state.log.length === base.log.length && state.anchorStatus != base.anchorStatus) {
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
   */
  static assertCommitLinksToState(state: StreamState, commit: RawCommit | AnchorCommit) {
    const streamId = this.streamIdFromState(state)

    // Older versions of the CAS created AnchorCommits without an 'id' field, so only check
    // the commit's 'id' field if it is present.
    if (commit.id && !commit.id.equals(state.log[0].cid)) {
      throw new Error(
        `Invalid genesis CID in commit for StreamID ${streamId.toString()}. Found: ${
          commit.id
        }, expected ${state.log[0].cid}`
      )
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
      const block = await ipfs.block.get(toCID((commit as DagJWS).link))
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

  static getCacaoCidFromCommit(commit: CeramicCommit): CID | undefined {
    if (StreamUtils.isSignedCommit(commit)) {
      const decodedProtectedHeader = base64urlToJSON(commit.signatures[0].protected)
      if (decodedProtectedHeader.cap) {
        const capIPFSUri = decodedProtectedHeader.cap
        return CID.parse(capIPFSUri.replace('ipfs://', ''))
      }
    }
    return undefined
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

  static commitDataToLogEntry(commitData: CommitData, eventType: EventType): LogEntry {
    const logEntry: LogEntry = {
      cid: commitData.cid,
      type: eventType,
    }
    if (commitData?.capability?.p?.exp) {
      logEntry.expirationTime = Math.floor(Date.parse(commitData.capability.p.exp) / 1000)
    }
    if (commitData.timestamp) {
      logEntry.timestamp = commitData.timestamp
    }
    return logEntry
  }

  /**
   * Takes a StreamState and validates that none of the commits in its log are based on expired CACAOs.
   */
  static checkForCacaoExpiration(state: StreamState): void {
    const now = Math.floor(Date.now() / 1000) // convert millis to seconds
    for (const logEntry of state.log) {
      const timestamp = logEntry.timestamp ?? now
      if (logEntry.expirationTime && logEntry.expirationTime < timestamp) {
        throw new Error(
          `CACAO expired: Commit ${logEntry.cid.toString()} of Stream ${StreamUtils.streamIdFromState(
            state
          ).toString()} has a CACAO that expired at ${
            logEntry.expirationTime
          }. Loading the stream with 'sync: SyncOptions.ALWAYS_SYNC' will restore the stream to a usable state, by discarding the invalid commits (this means losing the data from those invalid writes!)`
        )
      }
    }
  }

  /**
   * Given a StreamState returns the timestamp when it was last anchored, or null if the state
   * hasn't been anchored yet.
   * @param state
   */
  static anchorTimestampFromState(state: StreamState): number | null {
    for (let i = state.log.length - 1; i >= 0; i--) {
      const entry = state.log[i]
      if (entry.timestamp) {
        return entry.timestamp
      }
    }

    return null
  }

  /**
   * Checks if the given object is a string that could plausibly represent a DID.
   * @param did
   */
  static validDIDString(did: any): boolean {
    if (typeof did != 'string') {
      return false
    }

    if (!did.startsWith('did:')) {
      return false
    }

    return true
  }

  /**
   * Returns whether the given StreamState contains the given commit CID in its log
   */
  static stateContainsCommit(state: StreamState, commit: CID): boolean {
    return state.log.find((logEntry) => logEntry.cid.equals(commit)) != null
  }

  /**
   * Returns a commitId given a StreamState
   * @param streamState
   */
  static commitIdFromStreamState(streamState: StreamState): CommitID {
    const tipCID = streamState.log[streamState.log.length - 1].cid
    const genesisCID = streamState.log[0].cid
    return new CommitID(streamState.type, genesisCID, tipCID)
  }

  /**
   * Returns the height of the commit
   * @param state StreamState
   * @param commit commit we are looking for the height of
   * @returns number representing the height of the commit
   */
  static getCommitHeight(state: StreamState, commit: any): number {
    let prev
    if (StreamUtils.isSignedCommitContainer(commit)) {
      const payload = dagCBOR.decode(commit.linkedBlock) as any
      prev = payload.prev
    } else {
      prev = commit.prev
    }

    // assumes this is the genesis commit
    if (!prev) {
      return 0
    }

    const indexOfPrev = state.log.findIndex(({ cid }) => {
      return cid.toString() === prev.toString()
    })

    // this commit is not part of this stream
    if (indexOfPrev === -1) {
      throw Error('Commit prev not found in the log')
    }

    return indexOfPrev + 1
  }
}
