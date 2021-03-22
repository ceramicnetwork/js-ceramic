import CID from 'cids'
import cloneDeep from "lodash.clonedeep"
import * as u8a from 'uint8arrays'

import {
    AnchorCommit,
    CeramicCommit,
    IpfsApi,
    SignedCommit, SignedCommitContainer
} from "../index"
import { AnchorStatus, DocState, Doctype, LogEntry } from "../doctype"
import { DagJWS } from "dids"

/**
 * Doctype related utils
 */
export class DoctypeUtils {

    /**
     * Serializes commit
     * @param commit - Commit instance
     */
    static serializeCommit(commit: any): any {
        const cloned = cloneDeep(commit)

        if (DoctypeUtils.isSignedCommitContainer(cloned)) {
            cloned.jws.link = cloned.jws.link.toString()
            cloned.linkedBlock = u8a.toString(cloned.linkedBlock, 'base64')
            return cloned
        }

        if (DoctypeUtils.isSignedCommit(cloned)) {
            cloned.link = cloned.link.toString()
        }

        if (DoctypeUtils.isAnchorCommit(cloned)) {
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

        if (DoctypeUtils.isSignedCommitContainer(cloned)) {
            cloned.jws.link = new CID(cloned.jws.link)
            cloned.linkedBlock = u8a.fromString(cloned.linkedBlock, 'base64')
            return cloned
        }

        if (DoctypeUtils.isSignedCommit(cloned)) {
            cloned.link = new CID(cloned.link)
        }

        if (DoctypeUtils.isAnchorCommit(cloned)) {
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
     * Serializes doctype state for over the network transfer
     * @param state - Doctype state
     */
    static serializeState(state: any): any {
        const cloned = cloneDeep(state)

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
        return cloned
    }

    /**
     * Deserializes doctype cloned from over the network transfer
     * @param state - Doctype cloned
     */
    static deserializeState(state: any): DocState {
        const cloned = cloneDeep(state)

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

    static statesEqual(state1: DocState, state2: DocState): boolean {
        return JSON.stringify(DoctypeUtils.serializeState(state1)) ===
        JSON.stringify(DoctypeUtils.serializeState(state2))
    }

    /**
     * Make doctype readonly
     * @param doctype - Doctype instance
     */
    static makeReadOnly<T extends Doctype>(doctype: T): T {
        doctype.change = async (): Promise<void> => {
            throw new Error('Historical document commits cannot be modified. Load the document without specifying a commit to make updates.')
        }
        return doctype
    }

    /**
     * Converts commit to SignedCommitContainer. The only difference is with signed commit for now
     * @param commit - Commit value
     * @param ipfs - IPFS instance
     */
    static async convertCommitToSignedCommitContainer(commit: CeramicCommit, ipfs: IpfsApi): Promise<CeramicCommit> {
        if (DoctypeUtils.isSignedCommit(commit)) {
            const block = await ipfs.block.get((commit as DagJWS).link)
            const linkedBlock = block.data instanceof Uint8Array ? block.data : new Uint8Array(block.data.buffer)
            return {
                jws: commit as DagJWS,
                linkedBlock,
            }
        }
        return commit
    }

    /**
     * Checks if commit is signed DTO ({jws: {}, linkedBlock: {}})
     * @param commit - Commit
     */
    static isSignedCommitContainer(commit: CeramicCommit): boolean {
        return (commit as SignedCommitContainer).jws !== undefined
    }

    /**
     * Checks if commit is signed
     * @param commit - Commit
     */
    static isSignedCommit(commit: CeramicCommit): boolean {
        return (commit as SignedCommit).link !== undefined
    }

    /**
     * Checks if commit is anchor commit
     * @param commit - Commit
     */
    static isAnchorCommit(commit: CeramicCommit): boolean {
        return (commit as AnchorCommit).proof !== undefined
    }
}
