import type { DID } from 'dids'
import type { Stream, StreamHandler, CeramicCommit, StreamState } from './stream.js'
import type { AnchorOpts, CreateOpts, LoadOpts, PublishOpts, UpdateOpts } from './streamopts.js'
import type { StreamID, CommitID } from '@ceramicnetwork/streamid'
import type { LoggerProvider } from './logger-provider.js'
import type { GenesisCommit } from './index.js'
import type { IndexApi } from './index-api.js'
import { NodeStatusResponse } from './node-status-interface.js'
import type { AnchorStatus } from '@ceramicnetwork/common'

/**
 * Field definition for index
 */
export type Field = {
  path: Array<string>
}

/**
 * Index for a model
 */
export type FieldsIndex = {
  fields: Array<Field>
}

/**
 * Data for a model. Contains
 *  * streamID: StreamID of the model
 *  * indices: Array of field indices
 */
export type ModelData = {
  streamID: StreamID
  indices?: Array<FieldsIndex>
}

/**
 * Describes Ceramic pinning functionality
 */
export interface PinApi {
  /**
   * Pin stream
   * @param streamId - Stream ID
   * @param force - If true, re-pins all stream content even if the node already believes the stream
   +  to be pinned.
   */
  add(streamId: StreamID, force?: boolean): Promise<void>

  /**
   * Unpin stream
   * @param streamId - Stream ID
   * @param opts - can be set to make the node publish the stream's current tip before unpinning it,
   *   giving other nodes on the network one last chance to capture the stream's current state before
   *   this node forgets about it.
   */
  rm(streamId: StreamID, opts?: PublishOpts): Promise<void>

  /**
   * List pinned streams
   * @param streamId - Stream ID for filtering
   */
  ls(streamId?: StreamID): Promise<AsyncIterable<string>>
}

/**
 * Describes DID provider instance
 */
export type { DIDProvider } from 'dids'

interface CeramicCommon {
  loggerProvider?: LoggerProvider
}

/**
 * Interface for an object that contains a DID that can be used to sign Ceramic commits.
 * Any implementation of CeramicAPI will match this interface, though if no CeramicAPI instance is
 * available users can provide any object containing an authenticated DID instance.
 */
export interface CeramicSigner extends CeramicCommon {
  did: DID | undefined

  [index: string]: any // allow arbitrary properties
}

export function convertModelIdsToModelData(modelIds: Array<StreamID>): Array<ModelData> {
  return modelIds.map((streamID) => {
    return {
      streamID,
    }
  })
}

/**
 * Describes Ceramic Admin API functionality
 */
export interface AdminApi {
  /**
   * Returns a JSON object with various diagnostic and introspection information about the running
   * node.
   */
  nodeStatus(): Promise<NodeStatusResponse>

  /**
   * @deprecated
   * List indexed model streams
   */
  getIndexedModels(): Promise<Array<StreamID>>

  /**
   * List indexed model streams with additional model data (such as the defined field indices)
   */
  getIndexedModelData(): Promise<Array<ModelData>>

  /**
   * Adds model streams to index
   *
   * @deprecated
   * @param modelsIDs - array of model stream IDs to add to index. This parameter is deprecated
   * and indices should be specified instead
   */
  startIndexingModels(modelsIDs: Array<StreamID>): Promise<void>

  /**
   * Adds model streams to index as specified by ModelData
   * @param modelData - array of model streams with field indices to index
   */
  startIndexingModelData(modelData: Array<ModelData>): Promise<void>

  /**
   * @deprecated
   * Removes model streams from index
   *
   * @param modelsIDs - array of model stream IDs to remove from index
   */

  stopIndexingModels(modelsIDs: Array<StreamID>): Promise<void>

  /**
   * Removes model streams from index
   *
   * @param modelData - array of model data to remove from index
   */
  stopIndexingModelData(modelData: Array<ModelData>): Promise<void>

  pin: PinApi
}

/**
 * Describes Ceramic node API
 */
export interface CeramicApi extends CeramicSigner {
  // loggerProvider: LoggerProvider; // TODO uncomment once logger is available on http-client

  readonly index: IndexApi

  readonly admin: AdminApi

  /**
   * Register Stream handler
   * @param streamHandler - StreamHandler instance
   */
  addStreamHandler<T extends Stream>(streamHandler: StreamHandler<T>): void

  /**
   * Create Stream from genesis commit
   * @param type - Stream type
   * @param genesis - Genesis commit
   * @param opts - Initialization options
   */
  createStreamFromGenesis<T extends Stream>(
    type: number,
    genesis: any,
    opts?: CreateOpts
  ): Promise<T>

  /**
   * Loads Stream instance
   * @param streamId - Stream ID
   * @param opts - Initialization options
   */
  loadStream<T extends Stream>(streamId: StreamID | CommitID | string, opts?: LoadOpts): Promise<T>

  /**
   * Load all stream commits by stream ID
   * @param streamId - Stream ID
   */
  loadStreamCommits(streamId: StreamID | string): Promise<Array<Record<string, any>>>

  /**
   * Load all stream types instances for given multiqueries
   * @param queries - Array of MultiQueries
   * @param timeout - Timeout in milliseconds
   */
  multiQuery(queries: Array<MultiQuery>, timeout?: number): Promise<Record<string, Stream>>

  /**
   * Applies commit on the existing stream
   * @param streamId - Stream ID
   * @param commit - Commit to be applied
   * @param opts - Initialization options
   */
  applyCommit<T extends Stream>(
    streamId: StreamID | string,
    commit: CeramicCommit,
    opts?: UpdateOpts
  ): Promise<T>

  /**
   * Requests an anchor for the given StreamID if the Stream isn't already anchored.
   * Returns the new AnchorStatus for the Stream.
   * @param streamId
   * @param opts used to load the current Stream state
   */
  requestAnchor(streamId: StreamID | string, opts?: LoadOpts & AnchorOpts): Promise<AnchorStatus>

  /**
   * Sets the DID instance that will be used to author commits to stream. The DID instance
   * also includes the DID Resolver that will be used to verify commits from others.
   * @param did
   */
  setDID(did: DID): Promise<void>

  /**
   * @returns An array of the CAIP-2 chain IDs of the blockchains that are supported for anchoring
   * stream.
   */
  getSupportedChains(): Promise<Array<string>>

  /**
   * Turns +state+ into a Stream instance of the appropriate StreamType.
   * Does not add the resulting instance to a cache.
   * @param state StreamState for a stream.
   */
  buildStreamFromState<T extends Stream = Stream>(state: StreamState): T

  /**
   * Closes Ceramic instance
   */
  close(): Promise<void> // gracefully close the ceramic instance
}

export interface MultiQuery {
  /**
   * The genesis content for the queried stream. Useful in cases where the stream might not exist and you want to avoid timing out trying to load the genesis commit from IPFS.
   */
  genesis?: GenesisCommit
  /**
   * The StreamID of the stream to load
   */
  streamId: CommitID | StreamID | string

  /**
   * An array of paths used to look for linked stream
   */
  paths?: Array<string>

  /**
   * Load a previous version of the stream based on unix timestamp.
   * @deprecated Use opts.atTime instead.
   */
  atTime?: number // TODO(CDB-2417): Remove this

  /**
   * Additional options for the loadStream operation.
   */
  opts?: LoadOpts
}

export type CeramicCoreApi = {
  /**
   * Loads Stream instance
   * @param streamId - Stream ID
   * @param opts - Initialization options
   */
  loadStream<T extends Stream>(streamId: StreamID | CommitID | string, opts?: LoadOpts): Promise<T>
  /**
   * Loads Stream state
   * @param streamId - Stream ID
   */
  loadStreamState(streamId: StreamID): Promise<StreamState | undefined>
}
