import jsonpatch from 'fast-json-patch'
import type { Operation } from 'fast-json-patch'
import * as dagCbor from '@ipld/dag-cbor'
import { randomBytes } from '@stablelib/random'
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
  CeramicApi,
  SignedCommitContainer,
  CeramicSigner,
  GenesisHeader,
} from '@ceramicnetwork/common'
import { CommitID, StreamID, StreamRef } from '@ceramicnetwork/streamid'

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
}

const DEFAULT_CREATE_OPTS = {
  anchor: true,
  publish: true,
  pin: true,
  sync: SyncOptions.NEVER_SYNC,
  syncTimeoutSeconds: 0,
}
const DEFAULT_DETERMINISTIC_OPTS = {
  anchor: false,
  publish: false,
  pin: true,
  sync: SyncOptions.PREFER_CACHE,
}
const DEFAULT_LOAD_OPTS = { sync: SyncOptions.PREFER_CACHE }
const DEFAULT_UPDATE_OPTS = { anchor: true, publish: true, throwOnInvalidCommit: true }

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

  private _isReadOnly = false

  get content(): T {
    return super.content
  }

  get metadata(): ModelInstanceDocumentMetadata {
    const metadata = this.state$.value.metadata
    return { controller: metadata.controllers[0], model: metadata.model }
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
    opts = { ...DEFAULT_UPDATE_OPTS, ...opts }
    const signer: CeramicSigner = opts.asDID ? { did: opts.asDID } : this.api
    const updateCommit = await this._makeCommit(signer, content)
    const updated = await this.api.applyCommit(this.id, updateCommit, opts)
    this.state$.next(updated.state)
  }

  /**
   * Update the contents of an existing Model Instance Document based on a JSON-patch diff from the existing
   * contents to the desired new contents
   * @param jsonPatch - JSON patch diff of document contents
   * @param opts - Additional options
   */
  async patch(jsonPatch: Operation[], opts: UpdateOpts = {}): Promise<void> {
    opts = { ...DEFAULT_UPDATE_OPTS, ...opts }
    const rawCommit: RawCommit = {
      data: jsonPatch,
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
   */
  private _makeCommit(signer: CeramicSigner, newContent: T | null): Promise<CeramicCommit> {
    const commit = this._makeRawCommit(newContent)
    return ModelInstanceDocument._signDagJWS(signer, commit)
  }

  /**
   * Helper function for _makeCommit() to allow unit tests to update the commit before it is signed.
   * @param newContent
   */
  private _makeRawCommit(newContent: T | null): RawCommit {
    const patch = jsonpatch.compare(this.content, newContent || {})
    return {
      data: patch,
      prev: this.tip,
      id: this.state.log[0].cid,
    }
  }

  /**
   * Create genesis commit.
   * @param signer - Object containing the DID making (and signing) the commit
   * @param content - genesis content
   * @param metadata - genesis metadata
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
