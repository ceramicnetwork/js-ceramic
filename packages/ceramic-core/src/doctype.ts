import CID from 'cids'
import { Context } from "./context"
import cloneDeep from 'lodash.clonedeep'
import { EventEmitter } from "events"

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
export abstract class Doctype extends EventEmitter {
    public uuid: string

    constructor(private _state: DocState) {
        super()

        let dt = new Date().getTime();
        this.uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = (dt + Math.random() * 16) % 16 | 0;
            dt = Math.floor(dt / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }

    get id(): string {
        return ['/ceramic', this.state.log[0].toString()].join('/')
    }

    get doctype(): string {
        return this._state.doctype
    }

    get content(): Record<string, any> {
        return cloneDeep(this.state.content)
    }

    get owners(): Array<string> {
        return cloneDeep(this.state.owners)
    }

    get state(): DocState {
        return this._state
    }

    set state(state: DocState) {
        this._state = state
    }

    get head(): CID {
        return this.state.log[this.state.log.length - 1]
    }

}

/**
 * Doctype decorator
 * @constructor
 */
export function DoctypeStatic<T>() {
    return <U extends T>(constructor: U) => { constructor };
}

/**
 * Doctype static signatures
 */
export interface DoctypeConstructor {
    /**
     * Constructor signature
     * @param state - Doctype state
     */
    new (state: DocState): Doctype;

    /**
     * Makes genesis record
     * @param params - Create parameters
     * @param context - Ceramic context
     * @param opts - Initialization options
     */
    makeGenesis(params: Record<string, any>, context?: Context, opts?: InitOpts): Promise<Record<string, any>>;
}

/**
 * Describes document type handler functionality
 */
export interface DoctypeHandler<T extends Doctype> {
    /**
     * The string name of the doctype
     */
    name: string;

    /**
     * The doctype class
     */
    doctypeClass(): DoctypeConstructor;

    /**
     * Creates new Doctype
     * @param params - Doctype params
     * @param context - Ceramic context
     * @param opts - Initialization options
     */
    create(params: object, context: Context, opts?: InitOpts): Promise<T>;

    /**
     * Applies record to the document (genesis|signed|anchored)
     * @param record - Record intance
     * @param cid - Record CID
     * @param context - Ceramic context
     * @param state - Document state
     */
    applyRecord(record: any, cid: CID, context: Context, state?: DocState): Promise<DocState>;

}
