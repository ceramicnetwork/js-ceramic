import CID from 'cids'
import cloneDeep from 'lodash.clonedeep'
import type { Context } from "./context"
import { StreamID, CommitID } from '@ceramicnetwork/streamid'
import type { DagJWSResult, DagJWS } from 'dids'
import { Observable } from 'rxjs'
import { RunningStateLike } from './running-state-like';
import { CeramicApi } from "./ceramic-api";

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

export interface CommitHeader {
    controllers: Array<string>
    family?: string
    schema?: string
    tags?: Array<string>

    [index: string]: any // allow support for future changes
}

export interface GenesisHeader extends CommitHeader {
  unique?: string
}

export type GenesisCommit = {
    header: GenesisHeader
    data?: any
}

export interface UnsignedCommit {
    id: CID
    header?: CommitHeader
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

export interface AnchorCommit {
    id: CID,
    prev: CID,
    proof: CID,
    path: string,
}

export type SignedCommit = DagJWS

export type SignedCommitContainer = DagJWSResult

export type CeramicCommit = GenesisCommit | UnsignedCommit | AnchorCommit | SignedCommit | SignedCommitContainer

/**
 * Document metadata
 */
export interface DocMetadata {
    controllers: Array<string>
    family?: string
    schema?: string
    tags?: Array<string>

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

export enum CommitType {
  GENESIS, SIGNED, ANCHOR
}

export interface LogEntry {
  cid: CID
  type: CommitType
  timestamp?: number
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
 * Describes object which stores DocState.
 *
 * Note: the interface should be removed once we refactor documents.
 *
 */
export interface DocStateHolder {
    id: StreamID;
    state: DocState;
}

/**
 * Describes common doctype attributes
 */
export abstract class Doctype extends Observable<DocState> implements DocStateHolder {
    constructor(protected readonly state$: RunningStateLike, private _context: Context) {
        super(subscriber => {
          state$.subscribe(subscriber)
        })
    }

    get id(): StreamID {
        return new StreamID(this.state$.value.doctype, this.state$.value.log[0].cid)
    }

    get doctype(): string {
        return this.state$.value.doctype
    }

    get api(): CeramicApi {
        return this._context.api
    }

    get metadata(): DocMetadata {
        const { next, metadata } = this.state$.value
        return cloneDeep(next?.metadata ?? metadata)
    }

    get controllers(): Array<string> {
        return this.metadata.controllers
    }

    get tip(): CID {
        return this.state$.value.log[this.state$.value.log.length - 1].cid
    }

    get commitId(): CommitID {
        return this.id.atCommit(this.tip)
    }

    /**
     * Lists available commits
     */
    get allCommitIds(): Array<CommitID> {
      return this.state$.value.log.map(({ cid }) => this.id.atCommit(cid))
    }

    /**
     * Lists available commits that correspond to anchor commits
     */
    get anchorCommitIds(): Array<CommitID> {
        return this.state$.value.log
            .filter(({ type }) => type === CommitType.ANCHOR)
            .map(({ cid }) => this.id.atCommit(cid))
    }

    get state(): DocState {
        return cloneDeep(this.state$.value)
    }

    async sync(): Promise<void> {
      const document = await this.api.loadDocument(this.id, { sync: true, forceSync: true })
      this.state$.next(document.state)
    }

    protected _getContent(): any {
        const { next, content } = this.state$.value
        return cloneDeep(next?.content ?? content)
    }

    /**
     * Makes this document read-only. After this has been called any future attempts to call
     * mutation methods on the instance will throw.
     */
    abstract makeReadOnly()

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
     * @param state$ - Doctype state
     * @param context - Ceramic context
     */
    new(state$: RunningStateLike, context: Context): T
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
     * Applies commit to the document (genesis|signed|anchored)
     * @param commit - Commit instance
     * @param cid - Record CID
     * @param context - Ceramic context
     * @param state - Document state
     */
    applyCommit(commit: CeramicCommit, cid: CID, context: Context, state?: DocState): Promise<DocState>
}
