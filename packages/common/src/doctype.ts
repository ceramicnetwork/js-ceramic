import CID from 'cids'
import cloneDeep from 'lodash.clonedeep'
import { EventEmitter } from "events"
import type { Context } from "./context"
import DocID from '@ceramicnetwork/docid'

/**
 * Describes signature status
 */
export enum SignatureStatus {
    GENESIS, PARTIAL, SIGNED
}

/**
 * Describes all anchor statuses
 */
export enum AnchorStatus {
    NOT_REQUESTED, PENDING, PROCESSING, ANCHORED, FAILED
}

export interface RecordHeader {
    controllers: Array<string>
    schema?: string
    tags?: Array<string>

    unique?: string

    [index: string]: any // allow support for future changes
}

export type GenesisHeader = RecordHeader

export type GenesisRecord = {
    header: GenesisHeader
    data?: any
    unique?: string
}

export interface UnsignedRecord {
    id: CID
    header?: RecordHeader
    data: any
    prev: CID
}

export interface AnchorProof {
    chainId: string,
    blockNumber: number,
    blockTimestamp: number,
    txHash: CID,
    root: CID,
}

export interface AnchorRecord {
    id: CID,
    prev: CID,
    refs?: Array<CID>
    proof: CID,
    path: string,
}

import type { DagJWSResult, DagJWS } from 'dids'

export type SignedRecordDTO = DagJWSResult

export type SignedRecord = DagJWS

export type CeramicRecord = GenesisRecord | UnsignedRecord | AnchorRecord | SignedRecordDTO | SignedRecord

/**
 * Document metadata
 */
export interface DocMetadata {
    controllers: Array<string>
    schema?: string
    tags?: Array<string>

    [index: string]: any // allow arbitrary properties (nonce, etc.)
}

/**
 * Document params
 */
export interface DocParams {
    metadata?: DocMetadata
    // deterministic is a tri-state. True means means always create the document deterministically,
    // false means always force the document to be unique, undefined means use the default behavior
    deterministic?: boolean

    [index: string]: any // allow arbitrary properties
}

/**
 * Document information about the next iteration
 */
export interface DocNext {
    content?: any
    controllers?: Array<string>
    metadata?: DocMetadata
}

export enum RecordType {
  GENESIS, SIGNED, ANCHOR
}

export interface LogEntry {
  cid: CID
  type: RecordType
}
/**
 * Document state
 */
export interface DocState {
    doctype: string
    content: any
    next?: DocNext
    metadata: DocMetadata
    signature: SignatureStatus
    anchorStatus: AnchorStatus
    anchorScheduledFor?: number // only present when anchor status is pending
    anchorProof?: AnchorProof // the anchor proof of the latest anchor, only present when anchor status is anchored
    log: Array<LogEntry>
}

/**
 * Options that are passed to each operation on a document (create, change, load) that control
 * behaviors that are performed as part of the operation.
 */
export interface DocOpts {
    // Whether or not to request an anchor after performing the operation.
    anchor?: boolean

    // Whether or not to publish the current tip record to the pubsub channel after performing the operation.
    publish?: boolean

    // Whether or not to wait a short period of time to hear about new tips for the document after performing the operation.
    sync?: boolean
}

/**
 * Describes common doctype attributes
 */
export abstract class Doctype extends EventEmitter {
    constructor(private _state: DocState, private _context: Context) {
        super()
    }

    get id(): DocID {
        return new DocID(this._state.doctype, this._state.log[0].cid)
    }

    get doctype(): string {
        return this._state.doctype
    }

    get content(): any {
        const { next, content } = this._state
        return cloneDeep(next?.content ?? content)
    }

    get metadata(): DocMetadata {
        const { next, metadata } = this._state
        return cloneDeep(next?.metadata ?? metadata)
    }

    get controllers(): Array<string> {
        return this.metadata.controllers
    }

    get tip(): CID {
        return this._state.log[this._state.log.length - 1].cid
    }

    get versionId(): DocID {
        return this.allVersionIds.pop()
    }

    /**
     * Lists available versions
     */
    get allVersionIds(): Array<DocID> {
      return this._state.log
        .filter(({ type }) => (type === RecordType.GENESIS) || (type === RecordType.ANCHOR))
        .map(({ cid }) => DocID.fromOther(this.id, cid))
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

}

/**
 * Doctype decorator
 * @constructor
 */
export function DoctypeStatic<T>() {
    return <U extends T>(constructor: U): any => { constructor }
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
    new(state: DocState, context: Context): T

    /**
     * Makes genesis record
     * @param params - Create parameters
     * @param context - Ceramic context
     * @param opts - Initialization options
     */
    makeGenesis(params: DocParams, context?: Context, opts?: DocOpts): Promise<CeramicRecord>
}

/**
 * Describes document type handler functionality
 */
export interface DoctypeHandler<T extends Doctype> {
    /**
     * The string name of the doctype
     */
    name: string

    /**
     * The doctype class
     */
    doctype: DoctypeConstructor<T>

    /**
     * Applies record to the document (genesis|signed|anchored)
     * @param record - Record instance
     * @param cid - Record CID
     * @param context - Ceramic context
     * @param state - Document state
     */
    applyRecord(record: CeramicRecord, cid: CID, context: Context, state?: DocState): Promise<DocState>

}
