import CID from 'cids'
import { Context } from "./context"
import cloneDeep from 'lodash.clonedeep'

/**
 * Describes signature status
 */
export enum SignatureStatus {
    GENESIS,
    PARTIAL,
    SIGNED
}

/**
 * Describes all anchor statuses
 */
export enum AnchorStatus {
    NOT_REQUESTED,
    PENDING,
    PROCESSING,
    ANCHORED,
    FAILED
}

/**
 * Describes anchor record
 */
export interface AnchorRecord {
    prev: CID; // should be CID type
    proof: CID; // should be CID type
    path: string;
}

/**
 * Describes anchor proof
 */
export interface AnchorProof {
    chainId: string;
    blockNumber: number;
    blockTimestamp: number;
    txHash: CID;
    root: CID;
}

/**
 * Document state
 */
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

/**
 * Doctype related utils
 */
export class DoctypeUtils {
    /**
     * Create Doctype instance from the document wrapper
     * @param docId - Document ID
     * @param docState - Document state
     */
    static docStateToDoctype<T extends Doctype>(docId: string, docState: DocState): T {
        const cloned = cloneDeep(docState)
        return {
            id: docId,
            doctype: cloned.doctype,
            content: cloned.content,
            owners: cloned.owners,
            state: cloned,
            head: cloned.log[docState.log.length - 1],
        } as T
    }
}

/**
 * Doctype init options
 */
export interface InitOpts {
    owners?: Array<string>;
    onlyGenesis?: boolean;
    onlyApply?: boolean;
    skipWait?: boolean;
    isUnique?: boolean;
}

/**
 * Describes common doctype attributes
 */
export interface Doctype {
    id: string;
    doctype: string;
    content: object;
    owners: Array<string>;
    state: DocState;
    head: CID;
}

/**
 * Describes document type handler functionality
 */
export interface DoctypeHandler<T extends Doctype> {
    /**
     * the string name of the doctype
     */
    name: string;

    /**
     * Creates new Doctype
     * @param params - Doctype params
     * @param context - Ceramic context
     * @param opts - Initialization options
     */
    create(params: object, context: Context, opts?: InitOpts): Promise<T> ;

    /**
     * Applies record to the document (genesis|signed|anchored)
     * @param record - Record intance
     * @param cid - Record CID
     * @param context - Ceramic context
     * @param state - Document state
     */
    applyRecord(record: any, cid: CID, context: Context, state?: DocState): Promise<DocState>;

}
