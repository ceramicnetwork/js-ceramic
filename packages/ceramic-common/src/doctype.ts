import CID from 'cids'
import cloneDeep from 'lodash.clonedeep'
import { EventEmitter } from "events"
import { Context } from "./context"

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
     * @param genesisCid - Genesis record CID
     */
    static createDocId(genesisCid: any): string {
        return ['/ceramic', genesisCid.toString()].join('/')
    }

    /**
     * Serializes doctype state for over the network transfer
     * @param state - Doctype state
     */
    static serializeState(state: any): any {
        const cloned = cloneDeep(state)

        cloned.log = cloned.log.map((cid: any) => cid.toString());
        if (cloned.anchorStatus) {
            cloned.anchorStatus = AnchorStatus[cloned.anchorStatus];
        }
        if (cloned.anchorScheduledFor) {
            cloned.anchorScheduledFor = new Date(cloned.anchorScheduledFor).toISOString(); // ISO format of the UTC time
        }
        if (cloned.anchorProof) {
            cloned.anchorProof.txHash = cloned.anchorProof.txHash.toString();
            cloned.anchorProof.root = cloned.anchorProof.root.toString();
        }
        return cloned
    }

    /**
     * Deserializes doctype cloned from over the network transfer
     * @param state - Doctype cloned
     */
    static deserializeState(state: any): DocState {
        const cloned = cloneDeep(state)

        cloned.log = cloned.log.map((cidStr: string): CID => new CID(cidStr))
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
        return cloned
    }
}

/**
 * Doctype init options
 */
export interface InitOpts {
    owners?: Array<string>;
    applyOnly?: boolean;
    skipWait?: boolean;
    isUnique?: boolean;
}

/**
 * Describes common doctype attributes
 */
export class Doctype extends EventEmitter {
    constructor(private _state: DocState) {
        super()
    }

    get id(): string {
        return DoctypeUtils.createDocId(this.state.log[0])
    }

    get doctype(): string {
        return this._state.doctype
    }

    get content(): any {
        return cloneDeep(this.state.content)
    }

    get owners(): Array<string> {
        return cloneDeep(this.state.owners)
    }

    get state(): DocState {
        return cloneDeep(this._state)
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
    return <U extends T>(constructor: U): any => { constructor };
}

/**
 * Doctype static signatures
 */
export interface DoctypeConstructor<T extends Doctype> {
    /**
     * Constructor signature
     * @param state - Doctype state
     */
    new (state: DocState): T;

    /**
     * Makes genesis record
     * @param params - Create parameters
     * @param context - Ceramic context
     * @param opts - Initialization options
     */
    makeGenesis(params: Record<string, any>, context?: Context, opts?: InitOpts): Promise<Record<string, any>>;

    /**
     * Makes a change on an existing document
     * @param doctype - Doctype instance
     * @param params - Change parameteres
     * @param context - Ceramic context
     * @param opts - Initialization options
     */
    change(doctype: Doctype, params: Record<string, any>, context: Context, opts?: InitOpts): Promise<T>;
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
