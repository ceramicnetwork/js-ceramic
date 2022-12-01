import {
  CreateOpts,
  LoadOpts,
  Stream,
  StreamConstructor,
  StreamStatic,
  SyncOptions,
  CeramicCommit,
  GenesisCommit,
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
export interface ModelMetadataArgs {
  /**
   * The DID that is allowed to author updates to this Model
   */
  controller: string
}

/**
 * Metadata for a Model Stream
 */
export interface ModelMetadata {
  /**
   * The DID that is allowed to author updates to this Model
   */
  controller: string

  /**
   * The StreamID that all Model streams have as their 'model' for indexing purposes. Note that
   * this StreamID doesn't refer to a valid Stream and cannot be loaded, it's just a way to index
   * all Models.
   */
  model: StreamID
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
export type ModelAccountRelation = { type: 'list' } | { type: 'single' }

/**
 * Identifies types of properties that are supported as relations by the indexing service.
 *
 * Currently supported types of relation properties:
 * - 'account': references a DID property
 * - 'document': references a StreamID property with associated 'model' the related document must use
 *
 */
export type ModelRelationDefinition = { type: 'account' } | { type: 'document'; model: string }

/**
 * A mapping between model's property names and types of relation properties
 *
 * It indicates which properties of a model are relation properties and of what type
 */
export type ModelRelationsDefinition = Record<string, ModelRelationDefinition>

export type ModelDocumentMetadataViewDefinition =
  | { type: 'documentAccount' }
  | { type: 'documentVersion' }

export type ModelRelationViewDefinition =
  | { type: 'relationDocument'; model: string; property: string }
  | { type: 'relationFrom'; model: string; property: string }
  | { type: 'relationCountFrom'; model: string; property: string }

/**
 * Identifies types of properties that are supported as view properties at DApps' runtime
 *
 * A view-property is one that is not stored in related MIDs' content, but is derived from their other properties
 *
 * Currently supported types of view properties:
 * - 'documentAccount': view properties of this type have the MID's controller DID as values
 * - 'documentVersion': view properties of this type have the MID's commit ID as values
 * - 'relationDocument': view properties of this type represent document relations identified by the given 'property' field
 * - 'relationFrom': view properties of this type represent inverse relations identified by the given 'model' and 'property' fields
 * - 'relationCountFrom': view properties of this type represent the number of inverse relations identified by the given 'model' and 'property' fields
 *
 */
export type ModelViewDefinition = ModelDocumentMetadataViewDefinition | ModelRelationViewDefinition

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
  relations?: ModelRelationsDefinition
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
  // The StreamID uses the "UNLOADABLE" StreamType, and has string representation: "kh4q0ozorrgaq2mezktnrmdwleo1d"
  static readonly MODEL: StreamID = (function () {
    const data = encode('model-v1')
    const multihash = multihashes.encode(data, 'identity')
    const digest = create(code, multihash)
    const cid = CID.createV1(code, digest)
    return new StreamID('UNLOADABLE', cid)
  })()

  private _isReadOnly = false

  get content(): ModelDefinition {
    return super.content
  }

  get metadata(): ModelMetadata {
    return { controller: this.state$.value.metadata.controllers[0], model: Model.MODEL }
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
    metadata?: ModelMetadataArgs
  ): Promise<Model> {
    Model.assertComplete(content)
    Model.assertRelationsValid(content)

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
   * Asserts that the relations properties of the given ModelDefinition are well formed, and throws
   * an error if not.
   */
  static assertRelationsValid(content: ModelDefinition) {
    if (!content.relations) {
      return
    }

    for (const [fieldName, relationDefinition] of Object.entries(content.relations)) {
      switch (relationDefinition.type) {
        case 'account':
          continue
        case 'document':
          try {
            StreamID.fromString(relationDefinition.model)
          } catch (err) {
            throw new Error(`Relation on field ${fieldName} has invalid model: ${err.toString()}`)
          }
          continue
        default:
          throw new Error(
            // @ts-ignore
            `Relation on field ${fieldName} has unexpected type ${relationDefinition.type}`
          )
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
    return model
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
    metadata?: ModelMetadataArgs
  ): Promise<SignedCommitContainer> {
    const commit: GenesisCommit = await this._makeRawGenesis(signer, content, metadata)
    return Model._signDagJWS(signer, commit)
  }

  /**
   * Helper function for _makeGenesis() to allow unit tests to update the commit before it is signed.
   */
  private static async _makeRawGenesis(
    signer: CeramicSigner,
    content: Partial<ModelDefinition>,
    metadata?: ModelMetadataArgs
  ): Promise<GenesisCommit> {
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

    const header: GenesisHeader = {
      controllers: [metadata.controller],
      model: Model.MODEL.bytes,
    }
    return { data: content, header }
  }

  /**
   * Makes this document read-only. After this has been called any future attempts to call
   * mutation methods on the instance will throw.
   */
  makeReadOnly() {
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
