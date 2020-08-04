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
 * Document metadata
 */
export interface DocMetadata {
    owners: Array<string>;
    schema?: string;
    tags?: Array<string>;
    isUnique?: boolean;

    [index: string]: any; // allow arbitrary properties
}

/**
 * Document params
 */
export interface DocParams {
    metadata?: DocMetadata;

    [index: string]: any; // allow arbitrary properties
}

/**
 * Document information about the next iteration
 */
export interface DocNext {
    content?: any;
    owners?: Array<string>;
    metadata?: DocMetadata;
}

/**
 * Document state
 */
export interface DocState {
    doctype: string;
    content: any;
    next?: DocNext;
    metadata: DocMetadata;
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
    applyOnly?: boolean;
    skipWait?: boolean;
}

/**
 * Describes common doctype attributes
 */
export abstract class Doctype extends EventEmitter {
    constructor(private _state: DocState, private _context: Context) {
        super()
    }

    get id(): string {
        return DoctypeUtils.createDocIdFromGenesis(this._state.log[0])
    }

    get doctype(): string {
        return this._state.doctype
    }

    get content(): any {
        return cloneDeep(this._state.content)
    }

    get metadata(): DocMetadata {
        return cloneDeep(this._state.metadata)
    }

    get owners(): Array<string> {
        return cloneDeep(this._state.metadata.owners)
    }

    get head(): CID {
        return this._state.log[this._state.log.length - 1]
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
     * Makes a change on an existing document
     * @param params - Change parameters
     * @param opts - Initialization options
     */
    abstract change(params: DocParams, opts?: DocOpts): Promise<void>

    /**
     * Validate Doctype against schema
     */
    async validate(): Promise<void> {
        const schemaDocId = this.state?.metadata?.schema
        if (schemaDocId) {
            const schemaDoc = await this.context.api.loadDocument(schemaDocId)
            if (!schemaDoc) {
                throw new Error(`Schema not found for ${schemaDocId}`)
            }
            DoctypeUtils.validate(this.content, schemaDoc.content)
        }
    }

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
    makeGenesis(params: DocParams, context?: Context, opts?: DocOpts): Promise<Record<string, any>>;
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
     * @param record - Record instance
     * @param cid - Record CID
     * @param context - Ceramic context
     * @param state - Document state
     */
    applyRecord(record: any, cid: CID, context: Context, state?: DocState): Promise<DocState>;

}
