import type { StreamID } from '@ceramicnetwork/streamid'

export interface IndexStreamArgs {
  streamID: StreamID
  model: StreamID
  controller: string
  lastAnchor: Date | null
}

export enum Ordering {
  CHRONOLOGICAL = 'chronological', // last_anchored_at DESC NULLS FIRST, created_at DESC
  INSERTION = 'insertion', // created_at DESC = when an entry was added to the index
}

export interface BaseQuery {
  model: StreamID | string
  account?: string
  order?: Ordering // default: CHRONOLOGICAL_DESC
}

export interface ForwardPagination {
  first: number
  after?: string
}

export interface BackwardPagination {
  last: number
  before?: string
}

export type Pagination = ForwardPagination | BackwardPagination

export interface Page<T> {
  entries: Array<T>
  pageInfo: PageInfo
}

export type PageInfo = {
  hasNextPage: boolean
  hasPreviousPage: boolean
  startCursor: string
  endCursor: string
}

// Per database
export interface DatabaseIndexAPI {
  /**
   * This method inserts the stream if it is not present in the index, or updates
   * the 'content' if the stream already exists in the index.
   * @param args
   */
  indexStream(args: IndexStreamArgs): Promise<void>

  /**
   * Query the index
   */
  page(query: BaseQuery & Pagination): Promise<Page<StreamID>>

  /**
   * Initialize connection to a database.
   */
  init(): Promise<void>
}
