import CID from 'cids'
import cloneDeep from "lodash.clonedeep"
import * as u8a from 'uint8arrays'

import {
  AnchorCommit,
  CeramicCommit, CommitType,
  IpfsApi,
  SignedCommit, SignedCommitContainer,
} from '../index';
import { AnchorStatus, StreamState, LogEntry } from "../stream"
import type { DagJWS } from "dids"
import { StreamType } from '@ceramicnetwork/streamid';

/**
 * Stream related utils
 */
export class StreamUtils {

    /**
     * Serializes commit
     * @param commit - Commit instance
     */
    static serializeCommit(commit: any): any {
        const cloned = cloneDeep(commit)

        if (StreamUtils.isSignedCommitContainer(cloned)) {
            cloned.jws.link = cloned.jws.link.toString()
            cloned.linkedBlock = u8a.toString(cloned.linkedBlock, 'base64')
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
        return cloned
    }

    /**
     * Deserializes commit
     * @param commit - Commit instance
     */
    static deserializeCommit(commit: any): any {
        const cloned = cloneDeep(commit)

        if (StreamUtils.isSignedCommitContainer(cloned)) {
            cloned.jws.link = new CID(cloned.jws.link)
            cloned.linkedBlock = u8a.fromString(cloned.linkedBlock, 'base64')
            return cloned
        }

        if (StreamUtils.isSignedCommit(cloned)) {
            cloned.link = new CID(cloned.link)
        }

        if (StreamUtils.isAnchorCommit(cloned)) {
            cloned.proof = new CID(cloned.proof)
        }

        if (cloned.id) {
            cloned.id = new CID(cloned.id)
        }

        if (cloned.prev) {
            cloned.prev = new CID(cloned.prev)
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
            cloned.anchorStatus = AnchorStatus[cloned.anchorStatus];
        }
        if (cloned.anchorScheduledFor != null) {
            cloned.anchorScheduledFor = new Date(cloned.anchorScheduledFor).toISOString()
        }
        if (cloned.anchorProof != null) {
            cloned.anchorProof.txHash = cloned.anchorProof.txHash.toString();
            cloned.anchorProof.root = cloned.anchorProof.root.toString();
        }
        if (cloned.lastAnchored != null) {
            cloned.lastAnchored = cloned.lastAnchored.toString()
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

        cloned.log = cloned.log.map((entry: any): LogEntry => ({ ...entry, cid: new CID(entry.cid) }))
        if (cloned.anchorProof) {
            cloned.anchorProof.txHash = new CID(cloned.anchorProof.txHash);
            cloned.anchorProof.root = new CID(cloned.anchorProof.root);
        }

        let showScheduledFor = true;
        if (cloned.anchorStatus) {
            cloned.anchorStatus = AnchorStatus[cloned.anchorStatus];
            showScheduledFor = cloned.anchorStatus !== AnchorStatus.FAILED && cloned.anchorStatus !== AnchorStatus.ANCHORED
        }
        if (cloned.anchorScheduledFor) {
            if (showScheduledFor) {
                cloned.anchorScheduledFor = Date.parse(cloned.anchorScheduledFor); // ISO format of the UTC time
            } else {
                delete cloned.anchorScheduledFor;
            }
        }
        if (cloned.lastAnchored) {
            cloned.lastAnchored = new CID(cloned.lastAnchored)
        }
        return cloned
    }

    static statesEqual(state1: StreamState, state2: StreamState): boolean {
        return JSON.stringify(StreamUtils.serializeState(state1)) ===
        JSON.stringify(StreamUtils.serializeState(state2))
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

        return true
    }

    /**
     * Converts commit to SignedCommitContainer. The only difference is with signed commit for now
     * @param commit - Commit value
     * @param ipfs - IPFS instance
     */
    static async convertCommitToSignedCommitContainer(commit: CeramicCommit, ipfs: IpfsApi): Promise<CeramicCommit> {
        if (StreamUtils.isSignedCommit(commit)) {
            const block = await ipfs.block.get((commit as DagJWS).link)
            return {
                jws: commit as DagJWS,
                linkedBlock: block.data,
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
}
