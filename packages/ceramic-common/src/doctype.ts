import CID from 'cids'
import cloneDeep from 'lodash.clonedeep'
import { EventEmitter } from "events"
import type { Context } from "./context"

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
     * @param version - Doctype version
     */
    static createDocIdFromGenesis(genesisCid: any, version: any = null): string {
        const baseDocId = ['ceramic:/', genesisCid.toString()].join('/')
        return version? `${baseDocId}?version=${version.toString()}` : baseDocId
    }

    /**
     * Create Doctype instance from the document wrapper
     * @param docId - Doctype ID
     * @param version - Doctype version
     */
    static createDocIdFromBase(docId: string, version: any = null): string {
        return version? `${docId}?version=${version.toString()}` : docId
    }

    /**
     * Normalize document ID
     * @param docId - Document ID
     */
    static normalizeDocId(docId: string): string {
        if (docId.startsWith('ceramic://')) {
            return docId.replace('ceramic://', '/ceramic/')
        }
        return docId
    }

    /**
     * Normalize document ID
     * @param docId - Document ID
     */
    static getGenesis(docId: string): string {
        const genesis = (docId.startsWith('ceramic://')) ? docId.split('//')[1] : docId.split('/')[2]
        const indexOfVersion = genesis.indexOf('?')
        if (indexOfVersion !== -1) {
            return genesis.substring(0, indexOfVersion)
        }
        return genesis
    }

    /**
     * Normalize document ID
     * @param docId - Document ID
     */
    static getBaseDocId(docId: string): string {
        const indexOfVersion = docId.indexOf('?')
        if (indexOfVersion !== -1) {
            return docId.substring(0, indexOfVersion)
        }
        return docId
    }

    /**
     * Normalize document ID
     * @param docId - Document ID
     */
    static getVersionId(docId: string): CID {
        const genesis = (docId.startsWith('ceramic://')) ? docId.split('//')[1] : docId.split('/')[2]
        const indexOfVersion = genesis.indexOf('?')
        if (indexOfVersion !== -1) {
            const params = DoctypeUtils._getQueryParam(genesis.substring(indexOfVersion + 1))
            return params['version']? new CID(params['version']) : null
        }
        return null
    }

    /**
     * Get query params from document ID
     * @param query - Document query
     * @private
     */
    static _getQueryParam(query: string): Record<string, string> {
        const result: Record<string, string> = {};
        if (!query) {
            return result
        }

        const pairs = query.toLowerCase().split('&')
        pairs.forEach(function(pair) {
            const mapping: string[] = pair.split('=');
            result[mapping[0]] = mapping[1] || '';
        });
        return result
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

    /**
     * Make doctype readonly
     * @param doctype - Doctype instance
     */
    static makeReadOnly<T extends Doctype>(doctype: T): T {
        const cloned = cloneDeep(doctype)
        cloned.change = (): Promise<void> => {
            throw new Error('The version of the document is readonly. Checkout the latest HEAD in order to update.')
        }
        return cloned
    }
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
    constructor(private _state: DocState, private _context: Context) {
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
