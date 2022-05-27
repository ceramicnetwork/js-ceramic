import type { StreamID } from '@ceramicnetwork/streamid'

export interface IndexStreamArgs {
  readonly streamID: StreamID
  readonly model: StreamID
  readonly controller: string
  readonly lastAnchor: Date | null
}

export enum Ordering {
  CHRONOLOGICAL = 'chronological', // last_anchored_at DESC NULLS FIRST, created_at DESC
  INSERTION = 'insertion', // created_at DESC = when an entry was added to the index
}

export interface BaseQuery {
  readonly model: StreamID | string
  readonly account?: string
  readonly order?: Ordering // default: CHRONOLOGICAL_DESC
}

export interface ForwardPagination {
  readonly first: number
  readonly after?: string
}

export interface BackwardPagination {
  readonly last: number
  readonly before?: string
}

export type Pagination = ForwardPagination | BackwardPagination

export interface Page<T> {
  readonly entries: Array<T>
  readonly pageInfo: PageInfo
}

export type PageInfo = {
  readonly hasNextPage: boolean
  readonly hasPreviousPage: boolean
  readonly startCursor?: string
  readonly endCursor?: string
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
