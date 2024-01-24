import { CommitID, StreamID } from '@ceramicnetwork/streamid'
import { LoadOpts, Stream, GenesisCommit } from './index.js'

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
   * Additional options for the loadStream operation.
   */
  opts?: LoadOpts
}

export interface StreamReader {
  /**
   * Loads Stream instance
   * @param streamId - Stream ID
   * @param opts - Initialization options
   */
  loadStream<T extends Stream>(streamId: StreamID | CommitID | string, opts?: LoadOpts): Promise<T>

  /**
   * Load all stream types instances for given multiqueries
   * @param queries - Array of MultiQueries
   * @param timeout - Timeout in milliseconds
   */
  multiQuery(queries: Array<MultiQuery>, timeout?: number): Promise<Record<string, Stream>>
}
