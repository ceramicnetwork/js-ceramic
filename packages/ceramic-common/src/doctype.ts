import CID from 'cids'
import cloneDeep from 'lodash.clonedeep'
import { EventEmitter } from "events"
import type { Context } from "./context"
import { DoctypeUtils } from "./utils/doctype-utils"

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
 * Doctype init options
 */
export interface DocOpts {
    owners?: Array<string>;
    applyOnly?: boolean;
    skipWait?: boolean;
    isUnique?: boolean;
}

/**
 * Describes common doctype attributes
 */
export abstract class Doctype extends EventEmitter {
    constructor(private _state: DocState, private _context: Context, private _metadata: Record<string, any> = {}) {
        super()
    }

    get id(): string {
        return DoctypeUtils.createDocIdFromGenesis(this.state.log[0])
    }

    get doctype(): string {
        return this._state.doctype
    }

    get content(): any {
        return cloneDeep(this.state.content)
    }

    get metadata(): Record<string, any> {
        return cloneDeep(this._metadata)
    }

    get schema(): any {
        return this._metadata? this._metadata.schema : null
    }

    get owners(): Array<string> {
        return cloneDeep(this.state.owners)
    }

    get head(): CID {
        return this.state.log[this.state.log.length - 1]
    }

    get state(): DocState {
        return cloneDeep(this._state)
    }

    set state(state: DocState) {
        this._state = state
    }

    set context(context: Context) {
        this._context = context
    }

    get context(): Context {
        return this._context
    }

    /**
     * Validates the content against the schema in case there is one
     */
    public validate(): void {
        DoctypeUtils.validate(this)
    }

    /**
     * Clones the doctype
     */
    public clone(): Doctype {
        return new (this.constructor() as any)(this.state, this.context, this.metadata);
    }

    /**
     * Makes a change on an existing document
     * @param params - Change parameteres
     * @param opts - Initialization options
     */
    abstract change(params: Record<string, any>, opts?: DocOpts): Promise<void>;

}

/**
 * Doctype decorator
 * @constructor
 */
export function DoctypeStatic<T>() {
    return <U extends T>(constructor: U): any => { constructor };
}

/**
 * Doctype static signatures
 */
export interface DoctypeConstructor<T extends Doctype> {
    /**
     * Constructor signature
     * @param state - Doctype state
     * @param context - Ceramic context
     */
    new (state: DocState, context: Context): T;

    /**
     * Makes genesis record
     * @param params - Create parameters
     * @param context - Ceramic context
     * @param opts - Initialization options
     */
    makeGenesis(params: Record<string, any>, context?: Context, opts?: DocOpts): Promise<Record<string, any>>;
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
    doctype: DoctypeConstructor<T>;

    /**
     * Applies record to the document (genesis|signed|anchored)
     * @param record - Record intance
     * @param cid - Record CID
     * @param context - Ceramic context
     * @param state - Document state
     */
    applyRecord(record: any, cid: CID, context: Context, state?: DocState): Promise<DocState>;

}
