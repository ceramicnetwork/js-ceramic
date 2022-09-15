import type { StreamID } from '@ceramicnetwork/streamid'
import type { BaseQuery, Pagination, Page } from '@ceramicnetwork/common'
import type { CID } from 'multiformats/cid'

export interface IndexStreamArgs {
  readonly streamID: StreamID
  readonly model: StreamID
  readonly controller: string
  readonly streamContent: Record<string, any>
  readonly tip: CID
  readonly lastAnchor: Date | null
  readonly firstAnchor: Date | null
}

/**
 * Interface for an index backend.
 */
export interface DatabaseIndexApi {
  /**
   * Prepare the database to begin indexing the given models.  This generally involves creating
   * the necessary database tables and indexes.
   * @param models
   */
  indexModels(models: Array<StreamID>): Promise<void>

  /**
   * This method inserts the stream if it is not present in the index, or updates
   * the 'content' if the stream already exists in the index.
   * @param args
   */
  indexStream(args: IndexStreamArgs): Promise<void>

  /**
   * Get all models to be actively indexed by node
   */
  getActiveModelsToIndex(): Array<StreamID>

  /**
   * Query the index.
   */
  page(query: BaseQuery & Pagination): Promise<Page<StreamID>>

  /**
   * Stop connection to a database.
   */
  close(): Promise<void>
}
