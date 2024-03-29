import jsonpatch from 'fast-json-patch'
import type { Operation } from 'fast-json-patch'
import * as dagCbor from '@ipld/dag-cbor'
import { randomBytes } from '@stablelib/random'
import sizeof from 'object-sizeof'
import {
  CreateOpts,
  LoadOpts,
  UpdateOpts,
  Stream,
  StreamConstructor,
  StreamStatic,
  SyncOptions,
  CeramicCommit,
  GenesisCommit,
  RawCommit,
  SignedCommitContainer,
  CeramicSigner,
  GenesisHeader,
  StreamWriter,
  StreamReader,
  IntoSigner,
  CommitHeader,
  NonEmptyArray,
} from '@ceramicnetwork/common'
import { CommitID, StreamID, StreamRef } from '@ceramicnetwork/streamid'
import { fromString } from 'uint8arrays'

/**
 * Arguments used to generate the metadata for Model Instance Documents
 */
export interface ModelInstanceDocumentMetadataArgs {
  /**
   * The DID that is allowed to author updates to this ModelInstanceDocument
   */
  controller?: string

  /**
   * The StreamID of the Model that this ModelInstanceDocument belongs to.
   */
  model: StreamID

  /**
   * An optional string used to identify the context of the ModelInstanceDocument.
   */
  context?: StreamID

  /**
   * Whether the stream should be created deterministically or not.  Should only be used for
   * ModelInstanceDocuments whose Model has an accountRelation of 'SINGLE'.
   */
  deterministic?: boolean

  /**
   * Whether the stream should be stored by indexers or not. When undefined, indexers could
   * index the stream if wanted.
   */
  shouldIndex?: boolean
}

/**
 * Represents the metadata associated with a model instance document state.
 */
export type ModelInstanceDocumentStateMetadata = {
  /**
   * The DIDs that is allowed to author updates to this ModelInstanceDocument.
   */
  controllers: NonEmptyArray<string>
  /**
   * The StreamID of the Model that this ModelInstanceDocument belongs to.
   */
  model: StreamID
  /**
   * The "context" StreamID for this ModelInstanceDocument.
   */
  context?: StreamID
  /**
   * Unique bytes
   */
  unique?: Uint8Array
  /**
   * A flag indicating whether the stream should be indexed or not.
   */
  shouldIndex?: boolean
}

/**
 * Metadata for a ModelInstanceDocument
 */
export interface ModelInstanceDocumentMetadata {
  /**
   * The DID that is allowed to author updates to this ModelInstanceDocument
   */
  controller: string

  /**
   * The StreamID of the Model that this ModelInstanceDocument belongs to.
   */
  model: StreamID

  /**
   * Unique bytes
   */
  unique?: Uint8Array

  /**
   * The "context" StreamID for this ModelInstanceDocument.
   */
  context?: StreamID

  /**
   * Whether the stream should be indexed or not.
   */
  shouldIndex?: boolean
}

const DEFAULT_CREATE_OPTS = {
  anchor: true,
  publish: true,
  sync: SyncOptions.NEVER_SYNC,
  syncTimeoutSeconds: 0,
}
const DEFAULT_DETERMINISTIC_OPTS = {
  anchor: false,
  publish: false,
  sync: SyncOptions.PREFER_CACHE,
}
const DEFAULT_LOAD_OPTS = { sync: SyncOptions.PREFER_CACHE }
const DEFAULT_UPDATE_OPTS = { anchor: true, publish: true }

async function throwReadOnlyError(): Promise<void> {
  throw new Error(
    'Historical stream commits cannot be modified. Load the stream without specifying a commit to make updates.'
  )
}

/**
 * ModelInstanceDocument stream implementation
 */
@StreamStatic<StreamConstructor<ModelInstanceDocument>>()
export class ModelInstanceDocument<T = Record<string, any>> extends Stream {
  static STREAM_TYPE_NAME = 'MID'
  static STREAM_TYPE_ID = 3
  static MAX_DOCUMENT_SIZE = 16_000_000

  private _isReadOnly = false

  get content(): T | null {
    return super.content
  }

  get metadata(): ModelInstanceDocumentMetadata {
    const metadata = this.state$.value.metadata
    return {
      controller: metadata.controllers[0],
      model: metadata.model,
      unique: metadata.unique,
      context: metadata.context,
      shouldIndex: metadata.shouldIndex,
    }
  }

  /**
   * Creates a Model Instance Document.
   * @param ceramic - Interface to write to ceramic network
   * @param content - Genesis contents. If 'null', then no signature is required to make the genesis commit
   * @param metadata - Genesis metadata, including the model that this document belongs to
   * @param opts - Additional options
   */
  static async create<T>(
    ceramic: StreamWriter,
    content: T | null,
    metadata: ModelInstanceDocumentMetadataArgs,
    opts: CreateOpts = {}
  ): Promise<ModelInstanceDocument<T>> {
    opts = { ...DEFAULT_CREATE_OPTS, ...opts }
    const signer: CeramicSigner = opts.asDID
      ? CeramicSigner.fromDID(opts.asDID)
      : opts.signer || ceramic.signer
    const commit = await ModelInstanceDocument.makeGenesis(signer, content, metadata)

    return ceramic.createStreamFromGenesis<ModelInstanceDocument<T>>(
      ModelInstanceDocument.STREAM_TYPE_ID,
      commit,
      opts
    )
  }

  /**
   * Creates a deterministic ModelInstanceDocument with a 'single' accountRelation.
   * @param ceramic - Interface to write to ceramic network
   * @param metadata - Genesis metadata
   * @param opts - Additional options
   */
  static async single<T>(
    ceramic: StreamWriter,
    metadata: ModelInstanceDocumentMetadataArgs,
    opts: CreateOpts = {}
  ): Promise<ModelInstanceDocument<T>> {
    opts = { ...DEFAULT_DETERMINISTIC_OPTS, ...opts }
    const signer: CeramicSigner = opts.asDID
      ? CeramicSigner.fromDID(opts.asDID)
      : opts.signer || ceramic.signer
    metadata = { ...metadata, deterministic: true }

    const commit = await ModelInstanceDocument.makeGenesis(signer, null, metadata)
    return ceramic.createStreamFromGenesis<ModelInstanceDocument<T>>(
      ModelInstanceDocument.STREAM_TYPE_ID,
      commit,
      opts
    )
  }

  /**
   * Creates a deterministic ModelInstanceDocument with a 'set' accountRelation.
   * @param ceramic - Interface to write to ceramic network
   * @param metadata - Genesis metadata
   * @param unique - Unique fields values
   * @param opts - Additional options
   */
  static async set<T>(
    ceramic: StreamWriter,
    metadata: ModelInstanceDocumentMetadataArgs,
    unique: Array<string>,
    opts: CreateOpts = {}
  ): Promise<ModelInstanceDocument<T>> {
    opts = { ...DEFAULT_DETERMINISTIC_OPTS, ...opts }
    const signer: CeramicSigner = opts.asDID
      ? CeramicSigner.fromDID(opts.asDID)
      : opts.signer || ceramic.signer
    metadata = { ...metadata, deterministic: true }

    const commit = await ModelInstanceDocument.makeGenesis(signer, null, metadata, unique)
    return ceramic.createStreamFromGenesis<ModelInstanceDocument<T>>(
      ModelInstanceDocument.STREAM_TYPE_ID,
      commit,
      opts
    )
  }

  /**
   * Loads a Model Instance Document from a given StreamID
   * @param reader - Interface for reading streams from ceramic network
   * @param streamId - StreamID to load.  Must correspond to a ModelInstanceDocument
   * @param opts - Additional options
   */
  static async load<T>(
    reader: StreamReader,
    streamId: StreamID | CommitID | string,
    opts: LoadOpts = {}
  ): Promise<ModelInstanceDocument<T>> {
    opts = { ...DEFAULT_LOAD_OPTS, ...opts }
    const streamRef = StreamRef.from(streamId)
    if (streamRef.type != ModelInstanceDocument.STREAM_TYPE_ID) {
      throw new Error(
        `StreamID ${streamRef.toString()} does not refer to a '${
          ModelInstanceDocument.STREAM_TYPE_NAME
        }' stream, but to a ${streamRef.typeName}`
      )
    }

    return reader.loadStream<ModelInstanceDocument<T>>(streamRef, opts)
  }

  /**
   * Update an existing Model Instance Document by replacing its content
   * @param content - New content to replace old content
   * @param metadata
   * @param opts - Additional options
   */
  async replace(
    content: T | null,
    metadata: Partial<ModelInstanceDocumentMetadataArgs> | undefined | null = undefined,
    opts: UpdateOpts = {}
  ): Promise<void> {
    opts = { ...DEFAULT_UPDATE_OPTS, ...opts }
    validateContentLength(content)
    const signer: CeramicSigner = opts.asDID
      ? CeramicSigner.fromDID(opts.asDID)
      : opts.signer || this.api.signer
    let header: Partial<CommitHeader> | undefined = undefined
    if (metadata && metadata.shouldIndex != null) {
      header = {
        shouldIndex: metadata.shouldIndex,
      }
    }
    const updateCommit = await ModelInstanceDocument.makeUpdateCommit(
      signer,
      this.commitId,
      this.content,
      content,
      header
    )
    const updated = await this.api.applyCommit(this.id, updateCommit, opts)
    this.state$.next(updated.state)
  }

  /**
   * Update the contents of an existing Model Instance Document based on a JSON-patch diff from the existing
   * contents to the desired new contents
   * @param jsonPatch - JSON patch diff of document contents
   * @param metadata - Metadata change
   * @param opts - Additional options
   */
  async patch(
    jsonPatch: Operation[],
    metadata: Partial<ModelInstanceDocumentMetadataArgs> | undefined | null = undefined,
    opts: UpdateOpts = {}
  ): Promise<void> {
    opts = { ...DEFAULT_UPDATE_OPTS, ...opts }
    const signer: CeramicSigner = opts.asDID
      ? CeramicSigner.fromDID(opts.asDID)
      : opts.signer || this.api.signer
    jsonPatch.forEach((patch) => {
      switch (patch.op) {
        case 'add': {
          validateContentLength(patch.value)
          break
        }
        case 'replace': {
          validateContentLength(patch.value)
          break
        }
        default: {
          break
        }
      }
    })
    const rawCommit: RawCommit = {
      data: jsonPatch,
      prev: this.tip,
      id: this.id.cid,
    }
    // Null check is necessary to avoid `undefined` value that can't be encoded with IPLD
    if (metadata?.shouldIndex != null) {
      rawCommit.header = {
        shouldIndex: metadata.shouldIndex,
      }
    }
    const commit = await signer.createDagJWS(rawCommit)
    const updated = await this.api.applyCommit(this.id, commit, opts)
    this.state$.next(updated.state)
  }

  /**
   * Set the index metadata field for the stream
   * @param shouldIndex - Whether the stream should be indexed or not
   * @param opts - Additional options
   */
  shouldIndex(shouldIndex: boolean, opts: UpdateOpts = {}): Promise<void> {
    return this.patch([], { shouldIndex: shouldIndex }, opts)
  }

  /**
   * Makes this document read-only. After this has been called any future attempts to call
   * mutation methods on the instance will throw.
   */
  makeReadOnly() {
    this.replace = throwReadOnlyError
    this.patch = throwReadOnlyError
    this.sync = throwReadOnlyError
    this._isReadOnly = true
  }

  get isReadOnly(): boolean {
    return this._isReadOnly
  }

  /**
   * Make a commit to update the document.  Can be applied using the applyCommit method on the
   * Ceramic client.
   * @param signer - Interface to create signatures
   * @param prev - The CommitID of the current tip of the Stream that the update should be applied on top of.
   * @param oldContent - The current content of the Stream.
   * @param newContent - The new content to update the Stream with.
   * @param header - New commit header, used to update the stream's metadata.  Metadata fields not specified will be left alone with their current values.
   */
  static makeUpdateCommit<T>(
    signer: CeramicSigner,
    prev: CommitID,
    oldContent: T | null,
    newContent: T | null,
    header?: Partial<CommitHeader>
  ): Promise<CeramicCommit> {
    const commit = ModelInstanceDocument._makeRawCommit(prev, oldContent, newContent, header)
    return signer.createDagJWS(commit)
  }

  /**
   * Helper function for makeUpdateCommit() to allow unit tests to update the commit before it is signed.
   */
  private static _makeRawCommit<T>(
    prev: CommitID,
    oldContent: T | null,
    newContent: T | null,
    header?: Partial<CommitHeader>
  ): RawCommit {
    const patch = jsonpatch.compare(oldContent ?? {}, newContent ?? {})
    const rawCommit: RawCommit = {
      data: patch,
      prev: prev.commit,
      id: prev.baseID.cid,
    }
    // Null check is necessary to avoid `undefined` value that can't be encoded with IPLD
    if (header != null) {
      rawCommit.header = header
    }
    return rawCommit
  }

  /**
   * Create genesis commit.
   * @param context - Object containing the DID making (and signing) the commit
   * @param content - genesis content
   * @param metadata - genesis metadata
   * @param unique - optional array of strings to set the unique header value
   */
  static async makeGenesis<T>(
    context: IntoSigner,
    content: T | null,
    metadata: ModelInstanceDocumentMetadataArgs,
    unique?: Array<string>
  ): Promise<SignedCommitContainer | GenesisCommit> {
    const commit = await this._makeRawGenesis(context.signer, content, metadata, unique)
    if (metadata.deterministic) {
      // Check if we can encode it in cbor. Should throw an error when invalid payload.
      // See https://github.com/ceramicnetwork/ceramic/issues/205 for discussion on why we do this.
      dagCbor.encode(commit)
      // No signature needed for deterministic genesis commits (which cannot have content)
      return commit
    } else {
      return context.signer.createDagJWS(commit)
    }
  }

  private static async _makeRawGenesis<T>(
    signer: CeramicSigner,
    content: T,
    metadata: ModelInstanceDocumentMetadataArgs,
    unique?: Array<string>
  ): Promise<GenesisCommit> {
    if (!metadata.model) {
      throw new Error(`Must specify a 'model' when creating a ModelInstanceDocument`)
    }

    validateContentLength(content)

    let controller = metadata.controller
    if (!controller) {
      controller = await signer.asController()
    }

    const header: GenesisHeader = {
      controllers: [controller],
      model: metadata.model.bytes,
      sep: 'model', // See CIP-120 for more details on this field
    }
    if (metadata.deterministic) {
      // Convert and use unique values for the deterministic bytes if provided (SET account relation)
      if (Array.isArray(unique)) {
        header.unique = fromString(unique.join('|'), 'utf8')
      }
      // Don't set any unique byte otherwise (SINGLE account relation)
    } else {
      // Generate random bytes to ensure stream is unique (LIST account relation)
      header.unique = randomBytes(12)
    }
    if (metadata.context) {
      if (!metadata.context?.bytes) {
        throw new Error('Context must be a StreamID')
      }
      header.context = metadata.context.bytes
    }

    return { data: content, header }
  }
}

/**
 * Validate that content does not exceed a specified maximum
 * @param content Content to validate
 * @param maxLength
 */
export function validateContentLength<T>(content: T | null) {
  if (content) {
    const contentLength = sizeof(content)
    if (contentLength > ModelInstanceDocument.MAX_DOCUMENT_SIZE) {
      throw new Error(
        `Content has length of ${contentLength}B which exceeds maximum size of ${ModelInstanceDocument.MAX_DOCUMENT_SIZE}B`
      )
    }
  }
}
