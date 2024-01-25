import jsonpatch from 'fast-json-patch'
import type { Operation } from 'fast-json-patch'
import * as dagCbor from '@ipld/dag-cbor'
import { randomBytes } from '@stablelib/random'
import sizeof from 'object-sizeof'
import {
  CreateOpts,
  LoadOpts,
  UpdateOpts as CommonUpdateOpts,
  Stream,
  StreamConstructor,
  StreamStatic,
  SyncOptions,
  CeramicCommit,
  GenesisCommit,
  RawCommit,
  CeramicApi,
  SignedCommitContainer,
  CeramicSigner,
  GenesisHeader,
  CommitHeader,
} from '@ceramicnetwork/common'
import { CommitID, StreamID, StreamRef } from '@ceramicnetwork/streamid'

export interface UpdateOpts extends CommonUpdateOpts {
  shouldIndex?: boolean
}

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

async function _ensureAuthenticated(signer: CeramicSigner) {
  if (signer.did == null) {
    throw new Error('No DID provided')
  }
  if (!signer.did.authenticated) {
    await signer.did.authenticate()
    if (signer.loggerProvider) {
      signer.loggerProvider.getDiagnosticsLogger().imp(`Now authenticated as DID ${signer.did.id}`)
    }
  }
}

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

  get content(): T {
    return super.content
  }

  get metadata(): ModelInstanceDocumentMetadata {
    const metadata = this.state$.value.metadata
    return {
      controller: metadata.controllers[0],
      model: metadata.model,
      shouldIndex: metadata.shouldIndex,
    }
  }

  /**
   * Creates a Model Instance Document.
   * @param ceramic - Instance of CeramicAPI used to communicate with the Ceramic network
   * @param content - Genesis contents. If 'null', then no signature is required to make the genesis commit
   * @param metadata - Genesis metadata, including the model that this document belongs to
   * @param opts - Additional options
   */
  static async create<T>(
    ceramic: CeramicApi,
    content: T | null,
    metadata: ModelInstanceDocumentMetadataArgs,
    opts: CreateOpts = {}
  ): Promise<ModelInstanceDocument<T>> {
    opts = { ...DEFAULT_CREATE_OPTS, ...opts }
    const signer: CeramicSigner = opts.asDID ? { did: opts.asDID } : ceramic
    const commit = await ModelInstanceDocument._makeGenesis(signer, content, metadata)

    return ceramic.createStreamFromGenesis<ModelInstanceDocument<T>>(
      ModelInstanceDocument.STREAM_TYPE_ID,
      commit,
      opts
    )
  }

  /**
   * Creates a deterministic ModelInstanceDocument with a 'single' accountRelation.
   * @param ceramic - Instance of CeramicAPI used to communicate with the Ceramic network
   * @param metadata - Genesis metadata
   * @param opts - Additional options
   */
  static async single<T>(
    ceramic: CeramicApi,
    metadata: ModelInstanceDocumentMetadataArgs,
    opts: CreateOpts = {}
  ): Promise<ModelInstanceDocument<T>> {
    opts = { ...DEFAULT_DETERMINISTIC_OPTS, ...opts }
    const signer: CeramicSigner = opts.asDID ? { did: opts.asDID } : ceramic
    metadata = { ...metadata, deterministic: true }

    const commit = await ModelInstanceDocument._makeGenesis(signer, null, metadata)
    return ceramic.createStreamFromGenesis<ModelInstanceDocument<T>>(
      ModelInstanceDocument.STREAM_TYPE_ID,
      commit,
      opts
    )
  }

  /**
   * Loads a Model Instance Document from a given StreamID
   * @param ceramic - Instance of CeramicAPI used to communicate with the Ceramic network
   * @param streamId - StreamID to load.  Must correspond to a ModelInstanceDocument
   * @param opts - Additional options
   */
  static async load<T>(
    ceramic: CeramicApi,
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

    return ceramic.loadStream<ModelInstanceDocument<T>>(streamRef, opts)
  }

  /**
   * Update an existing Model Instance Document by replacing its content
   * @param content - New content to replace old content
   * @param opts - Additional options
   */
  async replace(content: T | null, opts: UpdateOpts = {}): Promise<void> {
    const { shouldIndex, ...options } = { ...DEFAULT_UPDATE_OPTS, ...opts }
    validateContentLength(content)
    const signer: CeramicSigner = options.asDID ? { did: options.asDID } : this.api
    let header: Partial<CommitHeader> | undefined = undefined
    if (shouldIndex != null) {
      header = {
        shouldIndex: shouldIndex,
      }
    }
    const updateCommit = await this._makeCommit(signer, content, header)
    const updated = await this.api.applyCommit(this.id, updateCommit, options)
    this.state$.next(updated.state)
  }

  /**
   * Update the contents of an existing Model Instance Document based on a JSON-patch diff from the existing
   * contents to the desired new contents
   * @param jsonPatch - JSON patch diff of document contents
   * @param opts - Additional options
   */
  async patch(jsonPatch: Operation[], opts: UpdateOpts = {}): Promise<void> {
    const { shouldIndex, ...options } = { ...DEFAULT_UPDATE_OPTS, ...opts }
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
    if (shouldIndex != null) {
      rawCommit.header = {
        shouldIndex: shouldIndex,
      }
    }
    const commit = await ModelInstanceDocument._signDagJWS(this.api, rawCommit)
    const updated = await this.api.applyCommit(this.id, commit, options)
    this.state$.next(updated.state)
  }

  /**
   * Set the index metadata field for the stream
   * @param shouldIndex - Whether the stream should be indexed or not
   * @param opts - Additional options
   */
  async shouldIndex(shouldIndex: boolean, opts: CommonUpdateOpts = {}): Promise<void> {
    // No-op if the wanted value is the current one
    if (this.metadata.shouldIndex === shouldIndex) {
      return
    }

    const rawCommit: RawCommit = {
      header: { shouldIndex: shouldIndex }, // Only the index parameter can be provided, others are immutable
      data: [], // No data change
      prev: this.tip,
      id: this.id.cid,
    }
    const commit = await ModelInstanceDocument._signDagJWS(this.api, rawCommit)
    const updated = await this.api.applyCommit(this.id, commit, opts)
    this.state$.next(updated.state)
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
   * Make a commit to update the document
   * @param signer - Object containing the DID making (and signing) the commit
   * @param newContent
   * @param header - Optional header
   */
  private _makeCommit(
    signer: CeramicSigner,
    newContent: T | null,
    header?: Partial<CommitHeader>
  ): Promise<CeramicCommit> {
    const commit = this._makeRawCommit(newContent, header)
    return ModelInstanceDocument._signDagJWS(signer, commit)
  }

  /**
   * Helper function for _makeCommit() to allow unit tests to update the commit before it is signed.
   * @param newContent
   * @param header - Optional header
   */
  private _makeRawCommit(newContent: T | null, header?: Partial<CommitHeader>): RawCommit {
    const patch = jsonpatch.compare(this.content, newContent || {})
    const rawCommit: RawCommit = {
      data: patch,
      prev: this.tip,
      id: this.state.log[0].cid,
    }
    // Null check is necessary to avoid `undefined` value that can't be encoded with IPLD
    if (header != null) {
      rawCommit.header = header
    }
    return rawCommit
  }

  /**
   * Create genesis commit.
   * @param signer - Object containing the DID making (and signing) the commit
   * @param content - genesis content
   * @param metadata - genesis metadata
   * @param maxContentLength - maximum content length in bytes of content in genesis commit
   */
  private static async _makeGenesis<T>(
    signer: CeramicSigner,
    content: T,
    metadata: ModelInstanceDocumentMetadataArgs
  ): Promise<SignedCommitContainer | GenesisCommit> {
    const commit = await this._makeRawGenesis(signer, content, metadata)
    if (metadata.deterministic) {
      // Check if we can encode it in cbor. Should throw an error when invalid payload.
      // See https://github.com/ceramicnetwork/ceramic/issues/205 for discussion on why we do this.
      dagCbor.encode(commit)
      // No signature needed for deterministic genesis commits (which cannot have content)
      return commit
    } else {
      return ModelInstanceDocument._signDagJWS(signer, commit)
    }
  }

  private static async _makeRawGenesis<T>(
    signer: CeramicSigner,
    content: T,
    metadata: ModelInstanceDocumentMetadataArgs
  ): Promise<GenesisCommit> {
    if (!metadata.model) {
      throw new Error(`Must specify a 'model' when creating a ModelInstanceDocument`)
    }

    validateContentLength(content)

    let controller = metadata.controller
    if (!controller) {
      if (signer.did) {
        await _ensureAuthenticated(signer)
        // When did has a parent, it has a capability, and the did issuer (parent) of the capability
        // is the stream controller
        controller = signer.did.hasParent ? signer.did.parent : signer.did.id
      } else {
        throw new Error('No controller specified')
      }
    }

    const header: GenesisHeader = {
      controllers: [controller],
      model: metadata.model.bytes,
      sep: 'model', // See CIP-120 for more details on this field
    }
    if (!metadata.deterministic) {
      header.unique = randomBytes(12)
    }

    return { data: content, header }
  }

  /**
   * Sign a ModelInstanceDocument commit with the currently authenticated DID.
   * @param signer - Object containing the DID to use to sign the commit
   * @param commit - Commit to be signed
   * @private
   */
  private static async _signDagJWS(
    signer: CeramicSigner,
    commit: CeramicCommit
  ): Promise<SignedCommitContainer> {
    await _ensureAuthenticated(signer)
    return signer.did.createDagJWS(commit)
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
