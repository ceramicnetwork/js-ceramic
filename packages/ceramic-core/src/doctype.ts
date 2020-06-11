import CID from 'cids'
import { Context } from "./context"

export enum SignatureStatus {
    GENESIS,
    PARTIAL,
    SIGNED
}

export enum AnchorStatus {
    NOT_REQUESTED,
    PENDING,
    PROCESSING,
    ANCHORED,
    FAILED
}

export interface AnchorRecord {
    prev: CID; // should be CID type
    proof: CID; // should be CID type
    path: string;
}

export interface AnchorProof {
    chainId: string;
    blockNumber: number;
    blockTimestamp: number;
    txHash: CID;
    root: CID;
}

export interface DocState {
    doctype: string;
    owners: Array<string>;
    nextOwners?: Array<string>;
    content: any;
    nextContent?: any;
    signature: SignatureStatus;
    anchorStatus: AnchorStatus;
    anchorScheduledFor?: number; // only present when anchor status is pending
    anchorProof?: AnchorProof; // the anchor proof of the latest anchor, only present when anchor status is anchored
    log: Array<CID>;
}

export interface InitOpts {
    owners?: Array<string>;
    onlyGenesis?: boolean;
    skipWait?: boolean;
    isUnique?: boolean;
}

export interface Doctype {
    // All doctypes extend this interface and add
    // methods for updating the document
    doctype: string;
    content: object;
    owners: Array<string>;
    state: DocState;
    head: CID;
}

export interface DoctypeHandler {
    name: string; // the string name of the doctype
    applyRecord(record: any, cid: CID, context: Context, state?: DocState): DocState;
    create<T extends Doctype>(params: object, context: Context): T;
}
