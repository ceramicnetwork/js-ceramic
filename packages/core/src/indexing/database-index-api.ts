import type { StreamID } from '@ceramicnetwork/streamid'
import type { BaseQuery, Pagination, Page } from '@ceramicnetwork/common'
import type { CID } from 'multiformats/cid'
import { ModelRelationsDefinition } from '@ceramicnetwork/stream-model'

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
 * Arguments for telling the index database that it should be ready to index streams of a new model.
 * Should include everything necessary for the database to start receiving `indexStream` calls with
 * MIDs belonging to the model.  This likely involves setting up the necessary database tables with
 * whatever columns, indexes, etc are needed.
 */
export interface IndexModelArgs {
  readonly model: StreamID
  readonly relations?: ModelRelationsDefinition
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
  indexModels(models: Array<IndexModelArgs>): Promise<void>

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
