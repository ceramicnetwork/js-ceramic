import jsonpatch from 'fast-json-patch'
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
  GenesisCommit,
  RawCommit,
  CeramicApi,
  SignedCommitContainer,
  CeramicSigner,
  GenesisHeader,
} from '@ceramicnetwork/common'
import { CommitID, StreamID, StreamRef } from '@ceramicnetwork/streamid'
import type { JSONSchema } from 'json-schema-typed/draft-2020-12'
import { CID } from 'multiformats/cid'
import { create } from 'multiformats/hashes/digest'
import { code, encode } from '@ipld/dag-cbor'
import multihashes from 'multihashes'

/**
 * Arguments used to generate the metadata for Model streams.
 */
export interface ModelMetadata {
  /**
   * The DID that is allowed to author updates to this Model
   */
  controller: string
}

const DEFAULT_LOAD_OPTS = { sync: SyncOptions.PREFER_CACHE }

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
 * Represents the relationship between an instance of this model and the controller account.
 * 'list' means there can be many instances of this model for a single account. 'single' means
 * there can be only one instance of this model per account (if a new instance is created it
 * overrides the old one).
 */
export enum ModelAccountRelation {
  LIST = 'list',
  SINGLE = 'single',
}

/**
 * Identifies types of properties that are supported as view properties at DApps' runtime
 *
 * A view-property is one that is not stored in related MIDs' content, but is derived from their other properties
 *
 * Currently supported types of view properties:
 * - 'documentAccount': view properties of this type have the MID's controller DID as values
 *
 */
export type ModelViewDefinition = { type: 'documentAccount' }

/**
 * A mapping between model's property names and types of view properties
 *
 * It indicates which properties of a model are view properties and of what type
 */
export type ModelViewsDefinition = Record<string, ModelViewDefinition>

/**
 * Contents of a Model Stream.
 */
export interface ModelDefinition {
  name: string
  description?: string
  schema: JSONSchema.Object
  accountRelation: ModelAccountRelation
  views?: ModelViewsDefinition
}

/**
 * Model stream implementation
 */
@StreamStatic<StreamConstructor<Model>>()
export class Model extends Stream {
  static STREAM_TYPE_NAME = 'model'
  static STREAM_TYPE_ID = 2

  // The hardcoded "model" StreamID that all Model streams have in their metadata. This provides
  // a "model" StreamID that can be indexed to query the set of all published Models.
  static readonly MODEL: StreamID = (function () {
    const data = encode('model-v1')
    const multihash = multihashes.encode(data, 'identity')
    const digest = create(code, multihash)
    const cid = CID.createV1(code, digest)
    return new StreamID(Model.STREAM_TYPE_ID, cid)
  })()

  private _isReadOnly = false

  get content(): ModelDefinition {
    return super.content
  }

  /**
   * Creates a Model.
   * @param ceramic - Instance of CeramicAPI used to communicate with the Ceramic network
   * @param content - contents of the model to create
   * @param metadata
   */
  static async create(
    ceramic: CeramicApi,
    content: ModelDefinition,
    metadata?: ModelMetadata
  ): Promise<Model> {
    Model.assertComplete(content)

    const opts: CreateOpts = {
      publish: true,
      anchor: true,
      pin: true,
      sync: SyncOptions.NEVER_SYNC,
      throwOnInvalidCommit: true,
    }
    const commit = await Model._makeGenesis(ceramic, content, metadata)
    const model = await ceramic.createStreamFromGenesis<Model>(Model.STREAM_TYPE_ID, commit, opts)
    return model
  }

  /**
   * Create an incomplete Model that can be updated later to add the missing required fields
   * and finalize the Model.  This is useful when there is a circular relationship between multiple
   * models and so you need to know a Model's StreamID before finalizing it.
   * @param ceramic
   * @param content
   * @param metadata
   */
  static async createPlaceholder(
    ceramic: CeramicApi,
    content: Partial<ModelDefinition>,
    metadata?: ModelMetadata
  ): Promise<Model> {
    const opts: CreateOpts = {
      publish: false,
      anchor: false,
      pin: false,
      sync: SyncOptions.NEVER_SYNC,
      throwOnInvalidCommit: true,
    }
    const commit = await Model._makeGenesis(ceramic, content, metadata)
    return ceramic.createStreamFromGenesis<Model>(Model.STREAM_TYPE_ID, commit, opts)
  }

  /**
   * Update an existing placeholder Model. Must update the model to its final content, setting
   * all required fields, finalizing and publishing the model, and preventing all future updates.
   * @param content - Final content for the Model
   */
  async replacePlaceholder(content: ModelDefinition): Promise<void> {
    Model.assertComplete(content, this.id)
    const opts: UpdateOpts = { publish: true, anchor: true, pin: true, throwOnInvalidCommit: true }
    const updateCommit = await this._makeCommit(this.api, content)
    const updated = await this.api.applyCommit(this.id, updateCommit, opts)
    this.state$.next(updated.state)
  }

  /**
   * Asserts that all the required fields for the Model are set, and throws an error if not.
   * @param streamId
   * @param content
   */
  static assertComplete(content: ModelDefinition, streamId?: StreamID | CommitID | string): void {
    if (!content.name) {
      if (streamId) {
        throw new Error(`Model with StreamID ${streamId.toString()} is missing a 'name' field`)
      } else {
        throw new Error(`Model is missing a 'name' field`)
      }
    }

    if (!content.schema) {
      if (streamId) {
        throw new Error(
          `Model ${content.name} (${streamId.toString()}) is missing a 'schema' field`
        )
      } else {
        throw new Error(`Model ${content.name} is missing a 'schema' field`)
      }
    }

    if (!content.accountRelation) {
      if (streamId) {
        throw new Error(
          `Model ${content.name} (${streamId.toString()}) is missing a 'accountRelation' field`
        )
      } else {
        throw new Error(`Model ${content.name} is missing a 'accountRelation' field`)
      }
    }
  }

  /**
   * Loads a Model from a given StreamID
   * @param ceramic - Instance of CeramicAPI used to communicate with the Ceramic network
   * @param streamId - StreamID to load.  Must correspond to a Model
   * @param opts - Additional options
   */
  static async load(
    ceramic: CeramicApi,
    streamId: StreamID | CommitID | string,
    opts: LoadOpts = {}
  ): Promise<Model> {
    opts = { ...DEFAULT_LOAD_OPTS, ...opts }

    const streamRef = StreamRef.from(streamId)
    if (streamRef.type != Model.STREAM_TYPE_ID) {
      throw new Error(
        `StreamID ${streamRef.toString()} does not refer to a '${
          Model.STREAM_TYPE_NAME
        }' stream, but to a ${streamRef.typeName}`
      )
    }

    const model = await ceramic.loadStream<Model>(streamRef, opts)
    try {
      Model.assertComplete(model.content, streamId)
    } catch (err) {
      // Add additional context to error message.
      throw new Error(`Incomplete placeholder Models cannot be loaded: ${err.message}`)
    }
    return model
  }

  /**
   * Make a commit to update the Model
   * @param signer - Object containing the DID making (and signing) the commit
   * @param newContent
   */
  private async _makeCommit(
    signer: CeramicSigner,
    newContent: ModelDefinition
  ): Promise<CeramicCommit> {
    const commit = this._makeRawCommit(newContent)
    return Model._signDagJWS(signer, commit)
  }

  /**
   * Helper function for _makeCommit() to allow unit tests to update the commit before it is signed.
   * @param newContent
   */
  private _makeRawCommit(newContent: ModelDefinition): RawCommit {
    if (newContent == null) {
      throw new Error(`Cannot set Model content to null`)
    }

    const patch = jsonpatch.compare(this.content, newContent)
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
  private static async _makeGenesis(
    signer: CeramicSigner,
    content: Partial<ModelDefinition>,
    metadata?: ModelMetadata
  ): Promise<CeramicCommit> {
    if (content == null) {
      throw new Error(`Genesis content cannot be null`)
    }

    if (!metadata || !metadata.controller) {
      if (signer.did) {
        await _ensureAuthenticated(signer)
        // When did has a parent, it has a capability, and the did issuer (parent) of the capability
        // is the stream controller
        metadata = { controller: signer.did.hasParent ? signer.did.parent : signer.did.id }
      } else {
        throw new Error('No controller specified')
      }
    }

    // TODO(NET-1464): enable GenesisHeader to receive 'controller' field directly
    const header: GenesisHeader = {
      controllers: [metadata.controller],
      unique: randomBytes(12),
      model: Model.MODEL.bytes,
    }
    const commit: GenesisCommit = { data: content, header }
    return Model._signDagJWS(signer, commit)
  }

  /**
   * Makes this document read-only. After this has been called any future attempts to call
   * mutation methods on the instance will throw.
   */
  makeReadOnly() {
    this.replacePlaceholder = throwReadOnlyError
    this.sync = throwReadOnlyError
    this._isReadOnly = true
  }

  get isReadOnly(): boolean {
    return this._isReadOnly
  }

  /**
   * Sign a Model commit with the currently authenticated DID.
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
