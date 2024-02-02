import type { PublishOpts } from './streamopts.js'
import type { StreamID } from '@ceramicnetwork/streamid'
import { NodeStatusResponse } from './node-status-interface.js'
import { StreamReader } from './stream-reader.js'
import { StreamWriter } from './stream-writer.js'

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

export interface StreamReaderWriter extends StreamReader, StreamWriter {}
