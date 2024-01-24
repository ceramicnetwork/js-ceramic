import jsonpatch from 'fast-json-patch'
import cloneDeep from 'lodash.clonedeep'
import * as dagCbor from '@ipld/dag-cbor'
import type { Operation } from 'fast-json-patch'
import * as uint8arrays from 'uint8arrays'
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
  CommitHeader,
  GenesisCommit,
  RawCommit,
  StreamMetadata,
  CeramicSigner,
  GenesisHeader,
  StreamWriter,
  StreamReader,
  IntoSigner,
} from '@ceramicnetwork/common'
import { CommitID, StreamID, StreamRef } from '@ceramicnetwork/streamid'

/**
 * Arguments used to generate the metadata for Tile documents
 */
export interface TileMetadataArgs {
  /**
   * The DID(s) that are allowed to author updates to this TileDocument
   */
  controllers?: Array<string>

  /**
   * Allows grouping similar documents into "families". Primarily used by indexing services.
   */
  family?: string

  /**
   * Allows tagging documents with additional information. Primarily used by indexing services.
   */
  tags?: Array<string>

  /**
   * If specified, must refer to another TileDocument whose contents are a JSON-schema specification.
   * The content of this document will then be enforced to conform to the linked schema.
   */
  schema?: CommitID | string

  /**
   * If true, then two calls to TileDocument.create() with the same content and the same metadata
   * will only create a single document with the same StreamID. If false, then otherwise
   * identical documents will generate unique StreamIDs and be able to be updated independently.
   * @deprecated use deterministic function instead
   */
  deterministic?: boolean

  /**
   * If true, all changes to the 'controllers' array are disallowed.  This guarantees that the
   * Stream will always have the same controller. Especially useful for Streams controlled by
   * DIDs that can have ownership changes within the DID itself, such as did:nft, as setting this
   * would prevent the current holder of the NFT from changing the Stream's controller to that
   * user's personal DID, which would prevent the ownership of the Stream from changing the next
   * time the NFT is traded.
   */
  forbidControllerChange?: boolean
}

const DEFAULT_CREATE_OPTS = {
  anchor: true,
  publish: true,
  sync: SyncOptions.PREFER_CACHE,
}
const DEFAULT_LOAD_OPTS = { sync: SyncOptions.PREFER_CACHE }
const DEFAULT_UPDATE_OPTS = { anchor: true, publish: true }

/**
 * Converts from metadata format into CommitHeader format to be put into a CeramicCommit
 * @param metadata
 * @param genesis - True if this is for a genesis header, false if it's for a signed commit header
 */
function headerFromMetadata(
  metadata: TileMetadataArgs | StreamMetadata,
  genesis: boolean
): CommitHeader {
  if (typeof metadata?.schema === 'string') {
    try {
      CommitID.fromString(metadata.schema)
    } catch {
      throw new Error('Schema must be a CommitID')
    }
  }

  const header: CommitHeader = {
    // @ts-ignore TODO(CDB-1950) Problem with CommitHeader type
    controllers: metadata?.controllers,
    family: metadata?.family,
    schema: metadata?.schema?.toString(),
    tags: metadata?.tags,
  }

  // Handle properties that can only be set on the genesis commit.
  if (genesis) {
    if (!metadata?.deterministic) {
      header['unique'] = uint8arrays.toString(randomBytes(12), 'base64')
    }
    if (metadata?.forbidControllerChange) {
      header['forbidControllerChange'] = true
    }
  } else {
    // These throws aren't strictly necessary as we can just leave these fields out of the header
    // object we return, but throwing here gives more useful feedback to users.

    if (metadata?.deterministic !== undefined || (metadata as any)?.unique !== undefined) {
      throw new Error("Cannot change 'deterministic' or 'unique' properties on existing Streams")
    }

    if (metadata?.forbidControllerChange !== undefined) {
      throw new Error("Cannot change 'forbidControllerChange' property on existing Streams")
    }
  }

  // Delete undefined keys from header
  Object.keys(header).forEach((key) => header[key] === undefined && delete header[key])
  return header
}

async function throwReadOnlyError(): Promise<void> {
  throw new Error(
    'Historical stream commits cannot be modified. Load the stream without specifying a commit to make updates.'
  )
}

export type TileMetadata = StreamMetadata

/**
 * TileDocument stream implementation
 */
@StreamStatic<StreamConstructor<TileDocument>>()
export class TileDocument<T = Record<string, any>> extends Stream {
  static STREAM_TYPE_NAME = 'tile'
  static STREAM_TYPE_ID = 0

  private _isReadOnly = false

  override get content(): T {
    return super.content
  }

  get metadata(): TileMetadata {
    const { next, metadata } = this.state$.value
    return cloneDeep(next?.metadata ?? metadata)
  }

  get controllers(): Array<string> {
    return this.metadata.controllers
  }

  /**
   * Creates a Tile document.
   * @param ceramic - Interface to write to ceramic network
   * @param content - Genesis contents. If 'null', then no signature is required to make the genesis commit
   * @param metadata - Genesis metadata
   * @param opts - Additional options
   */
  static override async create<T>(
    ceramic: StreamWriter,
    content: T | null | undefined,
    metadata?: TileMetadataArgs,
    opts: CreateOpts = {}
  ): Promise<TileDocument<T>> {
    opts = { ...DEFAULT_CREATE_OPTS, ...opts }
    if (!metadata?.deterministic && opts.syncTimeoutSeconds == undefined) {
      // By default you don't want to wait to sync doc state from pubsub when creating a unique
      // document as there shouldn't be any existing state for this doc on the network.
      opts.syncTimeoutSeconds = 0
    }
    const signer: CeramicSigner = opts.asDID
      ? CeramicSigner.fromDID(opts.asDID)
      : opts.signer || ceramic.signer
    const commit = await TileDocument.makeGenesis(signer, content, metadata)
    return ceramic.createStreamFromGenesis<TileDocument<T>>(
      TileDocument.STREAM_TYPE_ID,
      commit,
      opts
    )
  }

  /**
   * Create Tile document from genesis commit
   * @param ceramic - Interface to write to ceramic network
   * @param genesisCommit - Genesis commit (first commit in document log)
   * @param opts - Additional options
   */
  static async createFromGenesis<T>(
    ceramic: StreamWriter,
    genesisCommit: GenesisCommit,
    opts: CreateOpts = {}
  ): Promise<TileDocument<T>> {
    opts = { ...DEFAULT_CREATE_OPTS, ...opts }
    const signer: CeramicSigner = opts.asDID
      ? CeramicSigner.fromDID(opts.asDID)
      : opts.signer || ceramic.signer
    if (genesisCommit.header?.unique && opts.syncTimeoutSeconds == undefined) {
      // By default you don't want to wait to sync doc state from pubsub when creating a unique
      // document as there shouldn't be any existing state for this doc on the network.
      opts.syncTimeoutSeconds = 0
    }
    const commit = genesisCommit.data ? await signer.createDagJWS(genesisCommit) : genesisCommit
    return ceramic.createStreamFromGenesis<TileDocument<T>>(
      TileDocument.STREAM_TYPE_ID,
      commit,
      opts
    )
  }

  /**
   * Creates a deterministic Tile document.
   * @param ceramic - Interface to write to ceramic network
   * @param metadata - Genesis metadata
   * @param opts - Additional options
   */
  static async deterministic<T>(
    ceramic: StreamWriter,
    metadata: TileMetadataArgs,
    opts: CreateOpts = {}
  ): Promise<TileDocument<T>> {
    opts = { ...DEFAULT_CREATE_OPTS, ...opts }
    metadata = { ...metadata, deterministic: true }
    const signer: CeramicSigner = opts.asDID
      ? CeramicSigner.fromDID(opts.asDID)
      : opts.signer || ceramic.signer

    if (metadata.family == null && metadata.tags == null) {
      throw new Error('Family and/or tags are required when creating a deterministic tile document')
    }
    const commit = await TileDocument.makeGenesis(signer, null, metadata)
    return ceramic.createStreamFromGenesis<TileDocument<T>>(
      TileDocument.STREAM_TYPE_ID,
      commit,
      opts
    )
  }

  /**
   * Loads a Tile document from a given StreamID
   * @param ceramic - Interface for reading streams from ceramic network
   * @param streamId - StreamID to load.  Must correspond to a TileDocument
   * @param opts - Additional options
   */
  static async load<T>(
    ceramic: StreamReader,
    streamId: StreamID | CommitID | string,
    opts: LoadOpts = {}
  ): Promise<TileDocument<T>> {
    opts = { ...DEFAULT_LOAD_OPTS, ...opts }
    const streamRef = StreamRef.from(streamId)
    if (streamRef.type != TileDocument.STREAM_TYPE_ID) {
      throw new Error(
        `StreamID ${streamRef.toString()} does not refer to a '${
          TileDocument.STREAM_TYPE_NAME
        }' stream, but to a ${streamRef.typeName}`
      )
    }

    return ceramic.loadStream<TileDocument<T>>(streamRef, opts)
  }

  /**
   * Update an existing Tile document.
   * @param content - New content to replace old content
   * @param metadata - Changes to make to the metadata.  Only fields that are specified will be changed.
   * @param opts - Additional options
   */
  async update(
    content: T | null | undefined,
    metadata?: TileMetadataArgs,
    opts: UpdateOpts = {}
  ): Promise<void> {
    opts = { ...DEFAULT_UPDATE_OPTS, ...opts }
    const signer: CeramicSigner = opts.asDID
      ? CeramicSigner.fromDID(opts.asDID)
      : opts.signer || this.api.signer
    const updateCommit = await this.makeCommit(signer, content, metadata)
    const updated = await this.api.applyCommit(this.id, updateCommit, opts)
    this.state$.next(updated.state)
  }

  /**
   * Update the contents of an existing Tile document based on a JSON-patch diff from the existing
   * contents to the desired new contents
   * @param jsonPatch - JSON patch diff of document contents
   * @param opts - Additional options
   */
  async patch(jsonPatch: Operation[], opts: UpdateOpts = {}): Promise<void> {
    opts = { ...DEFAULT_UPDATE_OPTS, ...opts }
    const signer: CeramicSigner = opts.asDID
      ? CeramicSigner.fromDID(opts.asDID)
      : opts.signer || this.api.signer
    const header = headerFromMetadata(this.metadata, false)
    const rawCommit: RawCommit = {
      header,
      data: jsonPatch,
      prev: this.tip,
      id: this.id.cid,
    }
    const commit = await signer.createDagJWS(rawCommit)
    const updated = await this.api.applyCommit(this.id, commit, opts)
    this.state$.next(updated.state)
  }

  /**
   * Makes this document read-only. After this has been called any future attempts to call
   * mutation methods on the instance will throw.
   */
  makeReadOnly() {
    this.update = throwReadOnlyError
    this.patch = throwReadOnlyError
    this.sync = throwReadOnlyError
    this._isReadOnly = true
  }

  get isReadOnly(): boolean {
    return this._isReadOnly
  }

  /**
   * Make a commit to update the document
   * @param context - Object containing the DID making (and signing) the commit
   * @param newContent
   * @param newMetadata
   */
  async makeCommit(
    context: IntoSigner,
    newContent: T | null | undefined,
    newMetadata?: TileMetadataArgs
  ): Promise<CeramicCommit> {
    const commit = await this._makeRawCommit(newContent, newMetadata)
    return context.signer.createDagJWS(commit)
  }

  /**
   * Helper function for makeCommit() to sanity check input values and
   * allow unit tests to update newMetadata before signing.
   * @param newContent
   * @param newMetadata
   */
  private async _makeRawCommit(
    newContent: T | null | undefined,
    newMetadata?: TileMetadataArgs | undefined | null
  ): Promise<RawCommit> {
    newMetadata ||= {}
    const header = headerFromMetadata(newMetadata, false)

    if (newContent == null) {
      newContent = this.content
    }

    if (header.controllers) {
      if (header.controllers.length !== 1) {
        throw new Error('Exactly one controller must be specified')
      }
      if (!header.controllers[0]) {
        throw new Error('Controller cannot be updated to an undefined value.')
      }
    }

    const patch = jsonpatch.compare(this.content, newContent)
    const genesisLogEntry = this.state.log[0]
    return {
      header,
      data: patch,
      prev: this.tip,
      id: genesisLogEntry.cid,
    }
  }

  /**
   * Create genesis commit.
   * @param context - Object containing the DID making (and signing) the commit
   * @param content - genesis content
   * @param metadata - genesis metadata
   */
  static async makeGenesis<T>(
    context: IntoSigner,
    content: T | null | undefined,
    metadata: TileMetadataArgs | undefined | null
  ): Promise<CeramicCommit> {
    metadata ||= {}
    if (!metadata.controllers || metadata.controllers.length === 0) {
      metadata.controllers = [await context.signer.asController()]
    }
    if (metadata.controllers?.length !== 1) {
      throw new Error('Exactly one controller must be specified')
    }

    const header: GenesisHeader = headerFromMetadata(metadata, true)
    if (metadata?.deterministic && content) {
      throw new Error('Initial content must be null when creating a deterministic Tile document')
    }

    if (content == null) {
      const result = { header }
      // Check if we can encode it in cbor. Should throw an error when invalid payload.
      dagCbor.encode(result)
      // No signature needed if no genesis content
      return result
    }
    const commit: GenesisCommit = { data: content, header }
    return context.signer.createDagJWS(commit)
  }
}
