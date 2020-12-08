import CID from 'cids'
import cloneDeep from "lodash.clonedeep"
import * as u8a from 'uint8arrays'

import {
    AnchorRecord,
    CeramicRecord,
    DocMetadata,
    IpfsApi,
    RecordHeader,
    SignedRecord, SignedRecordContainer
} from "../index"
import { AnchorStatus, DocState, Doctype, LogEntry } from "../doctype"
import { DagJWS } from "dids"

/**
 * Doctype related utils
 */
export class DoctypeUtils {

    /**
     * Serializes record
     * @param record - Record instance
     */
    static serializeRecord(record: any): any {
        const cloned = cloneDeep(record)

        if (DoctypeUtils.isSignedRecordContainer(cloned)) {
            cloned.jws.link = cloned.jws.link.toString()
            cloned.linkedBlock = u8a.toString(cloned.linkedBlock, 'base64')
            return cloned
        }

        if (DoctypeUtils.isSignedRecord(cloned)) {
            cloned.link = cloned.link.toString()
        }

        if (DoctypeUtils.isAnchorRecord(cloned)) {
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
     * Deserializes record
     * @param record - Record instance
     */
    static deserializeRecord(record: any): any {
        const cloned = cloneDeep(record)

        if (DoctypeUtils.isSignedRecordContainer(cloned)) {
            cloned.jws.link = new CID(cloned.jws.link)
            cloned.linkedBlock = u8a.fromString(cloned.linkedBlock, 'base64')
            return cloned
        }

        if (DoctypeUtils.isSignedRecord(cloned)) {
            cloned.link = new CID(cloned.link)
        }

        if (DoctypeUtils.isAnchorRecord(cloned)) {
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
        if (cloned.anchorStatus) {
            cloned.anchorStatus = AnchorStatus[cloned.anchorStatus];
        }
        if (cloned.anchorScheduledFor) {
            cloned.anchorScheduledFor = new Date(cloned.anchorScheduledFor).toLocaleString()
        }
        if (cloned.anchorProof) {
            cloned.anchorProof.txHash = cloned.anchorProof.txHash.toString();
            cloned.anchorProof.root = cloned.anchorProof.root.toString();
        }
        if (cloned.lastAnchored) {
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
                cloned.anchorScheduledFor = null;
            }
        }
        if (cloned.lastAnchored) {
            cloned.lastAnchored = new CID(cloned.lastAnchored)
        }
        return cloned
    }

    /**
     * Make doctype readonly
     * @param doctype - Doctype instance
     */
    static makeReadOnly<T extends Doctype>(doctype: T): T {
        doctype.change = (): Promise<void> => {
            throw new Error('Historical document versions cannot be modified. Load the document without specifying a version to make updates.')
        }
        return doctype
    }

    /**
     * Converts record to SignedRecordContainer. The only difference is with signed record for now
     * @param record - Record value
     * @param ipfs - IPFS instance
     */
    static async convertRecordToSignedRecordContainer(record: CeramicRecord, ipfs: IpfsApi): Promise<CeramicRecord> {
        if (DoctypeUtils.isSignedRecord(record)) {
            const block = await ipfs.block.get((record as DagJWS).link)
            const linkedBlock = block.data instanceof Uint8Array ? block.data : new Uint8Array(block.data.buffer)
            return {
                jws: record as DagJWS,
                linkedBlock,
            }
        }
        return record
    }

    /**
     * Converts Doctype metadata to record header
     * @param docMetadata - DocMetadata instance
     */
    static metadataToRecordHeader(docMetadata: DocMetadata): RecordHeader {
        return {
            ...docMetadata.controllers && { controllers: docMetadata.controllers },
            ...docMetadata.schema && { schema: docMetadata.schema },
            ...docMetadata.tags && { tags: docMetadata.tags },
        }
    }

    /**
     * Checks if record is signed DTO ({jws: {}, linkedBlock: {}})
     * @param record - Record
     */
    static isSignedRecordContainer(record: CeramicRecord): boolean {
        return (record as SignedRecordContainer).jws !== undefined
    }

    /**
     * Checks if record is signed
     * @param record - Record
     */
    static isSignedRecord(record: CeramicRecord): boolean {
        return (record as SignedRecord).link !== undefined
    }

    /**
     * Checks if record is anchor record
     * @param record - Record
     */
    static isAnchorRecord(record: CeramicRecord): boolean {
        return (record as AnchorRecord).proof !== undefined
    }
}
