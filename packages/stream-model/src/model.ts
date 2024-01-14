import {
  CreateOpts,
  LoadOpts,
  Stream,
  StreamConstructor,
  StreamStatic,
  SyncOptions,
  GenesisCommit,
  SignedCommitContainer,
  CeramicSigner,
  GenesisHeader,
  StreamReader,
  StreamWriter,
  IntoSigner,
} from '@ceramicnetwork/common'
import { CommitID, StreamID, StreamRef } from '@ceramicnetwork/streamid'
import { CID } from 'multiformats/cid'
import { create } from 'multiformats/hashes/digest'
import { code, encode } from '@ipld/dag-cbor'
import { identity } from 'multiformats/hashes/identity'
import { asDIDString } from '@ceramicnetwork/codecs'
import { decode } from 'codeco'

import { ModelDefinition, type ModelMetadata, ModelRelationsDefinitionV2 } from './codecs.js'

export type LoadingInterfaceImplements = Record<string, Promise<Array<string>>>

/**
 * Load a model and validate it is an interface, then return the interfaces it implements
 *
 * @param reader - Interface for reading streams from ceramic network
 * @param modelID string
 * @returns Promise<Array<string>>
 */
export async function loadInterfaceImplements(
  reader: StreamReader,
  modelID: string
): Promise<Array<string>> {
  const model = await Model.load(reader, modelID)
  if (model.content.version === '1.0' || !model.content.interface) {
    throw new Error(`Model ${modelID} is not an interface`)
  }
  return model.content.implements ?? []
}

/**
 * Recursively load all the interfaces implemented by the given interfaces input.
 * The output will contain duplicate entries if interfaces are implemented multiple times.
 *
 * @param reader - Interface for reading streams from ceramic network
 * @param interfaces Array<string>
 * @param loading LoadingInterfaceImplements
 * @returns Promise<Array<string>>
 */
export async function loadAllModelInterfaces(
  reader: StreamReader,
  interfaces: Array<string>,
  loading: LoadingInterfaceImplements = {}
): Promise<Array<string>> {
  // The same interfaces could be implemented multiple times so we synchronously keep track of their loading
  const toLoad = interfaces.map((modelID) => {
    if (loading[modelID] == null) {
      loading[modelID] = loadInterfaceImplements(reader, modelID).then((ownImplements) => {
        return loadAllModelInterfaces(reader, ownImplements, loading).then((subImplements) => {
          return [...ownImplements, ...subImplements]
        })
      })
    }
    return loading[modelID]
  })
  const loaded = await Promise.all(toLoad)
  return Array.from(new Set(interfaces.concat(loaded.flat())))
}

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

  static readonly VERSION = '2.0'

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
   * @param ceramic - Interface for writing models to ceramic network
   * @param content - contents of the model to create
   * @param metadata
   */
  static async create(
    ceramic: StreamWriter,
    content: ModelDefinition,
    metadata?: ModelMetadataArgs
  ): Promise<Model> {
    Model.assertVersionValid(content, 'minor')
    Model.assertComplete(content)

    const opts: CreateOpts = {
      publish: true,
      anchor: true,
      sync: SyncOptions.NEVER_SYNC,
    }
    const commit = await Model._makeGenesis(ceramic.signer, content, metadata)
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
    if (content.version == null) {
      throw new Error(`Missing version for model ${content.name}`)
    }
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
      decode(ModelRelationsDefinitionV2, content.relations)
    }
  }

  /**
   * Loads a Model from a given StreamID
   * @param ceramic - Interface for reading streams from ceramic network
   * @param streamId - StreamID to load.  Must correspond to a Model
   * @param opts - Additional options
   */
  static async load(
    ceramic: StreamReader,
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
   * @param context - Object containing the DID making (and signing) the commit
   * @param content - genesis content
   * @param metadata - genesis metadata
   */
  private static async _makeGenesis(
    context: IntoSigner,
    content: Partial<ModelDefinition>,
    metadata?: ModelMetadataArgs
  ): Promise<SignedCommitContainer> {
    const commit: GenesisCommit = await this._makeRawGenesis(context.signer, content, metadata)
    return context.signer.createDagJWS(commit)
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

    if (!metadata) {
      metadata = { controller: await signer.asController() }
    } else if (!metadata.controller) {
      metadata.controller = await signer.asController()
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
}
