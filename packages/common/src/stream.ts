import type { CID } from 'multiformats/cid'
import cloneDeep from 'lodash.clonedeep'
import type { Context } from './context.js'
import { StreamID } from '@ceramicnetwork/streamid'
import { CommitID } from '@ceramicnetwork/streamid'
import type { DagJWS, DagJWSResult } from 'dids'
import { Observable } from 'rxjs'
import type { RunningStateLike } from './running-state-like.js'
import type { CeramicApi } from './ceramic-api.js'
import { LoadOpts, SyncOptions } from './streamopts.js'
import type { Cacao } from '@didtools/cacao'
import { NonEmptyArray } from './non-empty-array.js'
import type { AnchorProof, AnchorStatus } from './anchor-service.js'

export { AnchorStatus } from './anchor-service.js'

/**
 * Describes signature status
 */
export enum SignatureStatus {
  GENESIS,
  PARTIAL,
  SIGNED,
}

export interface CommitHeader {
  controllers: Array<string>
  family?: string // deprecated
  model?: Uint8Array // StreamID encoded as byte array
  schema?: string // deprecated
  tags?: Array<string> // deprecated

  [index: string]: any // allow support for future changes
}

export interface GenesisHeader extends CommitHeader {
  unique?: Uint8Array | string // Model and ModelInstanceDocument use Uint8Array, Caip10Link and TileDocument use 'string'
  forbidControllerChange?: boolean // deprecated, only used by TileDocument
}

export type GenesisCommit = {
  header: GenesisHeader
  data?: any
}

export interface RawCommit {
  id: CID
  header?: CommitHeader
  data: any
  prev: CID
}

export interface AnchorCommit {
  id: CID
  prev: CID
  proof: CID
  path: string
}

export type SignedCommit = DagJWS

export type SignedCommitContainer = DagJWSResult

export type CeramicCommit =
  | AnchorCommit
  | GenesisCommit
  | RawCommit
  | SignedCommit
  | SignedCommitContainer

/**
 * Stream metadata
 */
export interface StreamMetadata {
  controllers: Array<string>
  model?: StreamID
  family?: string // deprecated
  schema?: string // deprecated
  tags?: Array<string> // deprecated
  forbidControllerChange?: boolean // deprecated, only used by TileDocument
  [index: string]: any // allow arbitrary properties
}

/**
 * Stream information about the next iteration
 */
export interface StreamNext {
  content?: any
  metadata?: StreamMetadata
}

export enum CommitType {
  GENESIS,
  SIGNED,
  ANCHOR,
}

/**
 * Entry in a stream log as represented in a StreamState object.
 */
export interface LogEntry {
  // CID of the stream commit
  cid: CID

  // Type of the commit (e.g. genesis, signed, anchor)
  type: CommitType

  // Timestamp (in seconds) of when this commit was anchored (if available)
  timestamp?: number

  // If this commit was created with a CACAO, then this is the timestamp when that CACAO expires.
  // The anchor timestamp must be before the expirationTime, or else the commit is invalid.
  // Timestamp is in seconds since the unix epoch.
  expirationTime?: number
}

/**
 * Includes all additional data necessary to apply the commit without requiring any additional i/o
 * to load anything else from ipfs or the p2p Ceramic network.
 */
export interface CommitData extends LogEntry {
  /**
   * The underlying payload of the commit
   */
  commit: any

  /**
   * If this is a signed commit, then this will have the commit envelope with the signature.
   */
  envelope?: DagJWS

  /**
   * If this is an anchor commit, this will have the anchor proof.
   */
  proof?: AnchorProof

  /**
   * If this is an anchor commit and this may get set after validating the anchor commit if the
   * validation fails for any reason.  This is so that the error can be thrown later when applying
   * the anchor commit (which happens at a different time than when the anchor is validated).
   */
  anchorValidationError?: Error

  /**
   * If this is a signed commit that was signed using a CACAO, this contains it.
   */
  capability?: Cacao
}

/**
 * A SyncedStreamLog that has also validated all the Anchor Commits, extracted the timestamp
 * information from them, and applied them to all the commits in the log. This log can now be
 * applied to a StreamState without needing to perform any additional i/o.
 */
export type AppliableStreamLog = {
  commits: Array<CommitData>
  timestampStatus: 'validated'
}

/**
 * A SyncedStreamLog that has loaded all necessary data from the p2p network but has yet to validate
 * the Anchor Commits and extract the timestamp information needed before the log can be applied.
 */
export type UnappliableStreamLog = {
  commits: Array<CommitData>
  timestampStatus: 'pending'
}

/**
 * Log of commits loaded for a stream that contains all the information needed to apply the log and
 * get a StreamState, without needing to do any additional i/o *to the p2p network*. Note there
 * may still be i/o needed to validate the anchor commits against Ethereum and extract and apply the
 * timestamps to the commits before the log can be fully applied.
 */
export type SyncedStreamLog = AppliableStreamLog | UnappliableStreamLog

/**
 * Stream state
 */
export interface StreamState {
  type: number
  content: any
  next?: StreamNext
  metadata: StreamMetadata
  signature: SignatureStatus
  anchorStatus: AnchorStatus
  anchorProof?: AnchorProof // the anchor proof of the latest anchor, only present when anchor status is anchored
  log: NonEmptyArray<LogEntry>
}

/**
 * Describes object which stores StreamState.
 *
 * Note: the interface should be removed once we refactor streams.
 *
 */
export interface StreamStateHolder {
  id: StreamID
  state: StreamState
}

/**
 * Describes common stream attributes
 */
export abstract class Stream extends Observable<StreamState> implements StreamStateHolder {
  constructor(protected readonly state$: RunningStateLike, private _context: Context) {
    super((subscriber) => {
      state$.subscribe(subscriber)
    })
  }

  get id(): StreamID {
    return new StreamID(this.state$.value.type, this.state$.value.log[0].cid)
  }

  get api(): CeramicApi {
    return this._context.api
  }

  abstract get metadata(): Record<string, any>

  get content(): any {
    const { next, content } = this.state$.value
    return cloneDeep(next?.content ?? content)
  }

  get tip(): CID {
    return this.state$.value.log[this.state$.value.log.length - 1].cid
  }

  get commitId(): CommitID {
    return CommitID.make(this.id, this.tip)
  }

  /**
   * Lists available commits
   */
  get allCommitIds(): Array<CommitID> {
    return this.state$.value.log.map(({ cid }) => CommitID.make(this.id, cid))
  }

  /**
   * Lists available commits that correspond to anchor commits
   */
  get anchorCommitIds(): Array<CommitID> {
    return this.state$.value.log
      .filter(({ type }) => type === CommitType.ANCHOR)
      .map(({ cid }) => CommitID.make(this.id, cid))
  }

  get state(): StreamState {
    return cloneDeep(this.state$.value)
  }

  async sync(opts: LoadOpts = {}): Promise<void> {
    opts = { sync: SyncOptions.PREFER_CACHE, ...opts }
    const stream = await this.api.loadStream(this.id, opts)
    this.state$.next(stream.state)
  }

  async requestAnchor(): Promise<AnchorStatus> {
    return this.api.requestAnchor(this.id)
  }

  /**
   * Makes this stream read-only. After this has been called any future attempts to call
   * mutation methods on the instance will throw.
   */
  abstract makeReadOnly(): void

  /**
   * True if 'makeReadOnly()' has been called previously.
   */
  abstract isReadOnly: boolean
}

/**
 * Stream decorator
 * @constructor
 */
export function StreamStatic<T>() {
  return <U extends T>(constructor: U): any => {
    constructor
  }
}

/**
 * Stream static signatures
 */
export interface StreamConstructor<T extends Stream> {
  /**
   * Constructor signature
   * @param state$ - Stream state
   * @param context - Ceramic context
   */
  new (state$: RunningStateLike, context: Context): T
}

/**
 * Describes stream type handler functionality
 */
export interface StreamHandler<T extends Stream> {
  /**
   * The ID number of the streamtype. This is specified by the table within CIP-59.
   */
  type: number

  /**
   * The string name of the streamtype
   */
  name: string

  /**
   * The constructor used to instantiate an instance of the handled streamtype.
   */
  stream_constructor: StreamConstructor<T>

  /**
   * Applies commit to the stream (genesis|signed|anchored) and returns the new StreamState.
   * StreamHandler implementations of applyCommit are allowed to modify the input state, it is up to
   * callers to clone the input state before calling into applyCommit if they don't want the input
   * state modified.
   * @param commitData - Commit data
   * @param context - Ceramic context
   * @param state - The existing state to apply the commit to.
   */
  applyCommit(commitData: CommitData, context: Context, state?: StreamState): Promise<StreamState>
}
