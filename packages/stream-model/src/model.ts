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
import { CID } from 'multiformats/cid'
import { create } from 'multiformats/hashes/digest'
import { code, encode } from '@ipld/dag-cbor'
import { identity } from 'multiformats/hashes/identity'
import { asDIDString } from '@ceramicnetwork/codecs'
import { decode } from 'codeco'

import { ModelDefinition, type ModelMetadata, ModelRelationsDefinition } from './codecs.js'

export const MODEL_VERSION_REGEXP = /^[0-9]+\.[0-9]+$/

export function parseModelVersion(version: string): [number, number] {
  if (!MODEL_VERSION_REGEXP.test(version)) {
    throw new Error(`Unsupported version format: ${version}`)
  }
  const [major, minor] = version.split('.').map((part) => parseInt(part, 10))
  return [major, minor]
}

/**
 * Arguments used to generate the metadata for Model streams.
 */
export interface ModelMetadataArgs {
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
 * Version check to satisfy:
 * - 'major': only major version match needs to be satisfied
 * - 'minor': both major and minor versions matches need to be satisfied
 */
export type ValidVersionSatisfies = 'major' | 'minor'

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
    const multihash = identity.digest(data)
    const digest = create(code, multihash.bytes)
    const cid = CID.createV1(code, digest)
    return new StreamID('UNLOADABLE', cid)
  })()

  static readonly VERSION = '1.0'

  private _isReadOnly = false

  get content(): ModelDefinition {
    return super.content
  }

  get metadata(): ModelMetadata {
    return {
      controller: asDIDString(this.state$.value.metadata.controllers[0]),
      model: Model.MODEL,
    }
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
    Model.assertVersionValid(content, 'minor')

    const opts: CreateOpts = {
      publish: true,
      anchor: true,
      sync: SyncOptions.NEVER_SYNC,
    }
    const commit = await Model._makeGenesis(ceramic, content, metadata)
    const model = await ceramic.createStreamFromGenesis<Model>(Model.STREAM_TYPE_ID, commit, opts)
    return model
  }

  /**
   * Asserts that all the required fields for the Model are set, and throws an error if not.
   * @param content
   * @param streamId
   */
  static assertComplete(content: ModelDefinition, _streamId?: StreamID | CommitID | string): void {
    decode(ModelDefinition, content)
  }

  /**
   * Asserts that the version of the model definition is supported.
   * @param content - Model definition object
   * @param satisfies - Version range to satisfy
   */
  static assertVersionValid(
    content: ModelDefinition,
    satisfies: ValidVersionSatisfies = 'minor'
  ): void {
    const [expectedMajor, expectedMinor] = parseModelVersion(Model.VERSION)
    const [major, minor] = parseModelVersion(content.version)

    if (
      major > expectedMajor ||
      (satisfies === 'minor' && major === expectedMajor && minor > expectedMinor)
    ) {
      throw new Error(
        `Unsupported version ${content.version} for model ${content.name}, the maximum version supported by the Ceramic node is ${Model.VERSION}. Please update your Ceramic node to a newer version supporting at least version ${content.version} of the Model definition.`
      )
    }
  }

  /**
   * Asserts that the relations properties of the given ModelDefinition are well formed, and throws
   * an error if not.
   */
  static assertRelationsValid(content: ModelDefinition) {
    if (content.relations != null) {
      decode(ModelRelationsDefinition, content.relations)
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
      sep: 'model', // See CIP-120 for more details on this field
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
