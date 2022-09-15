import type { StreamID } from '@ceramicnetwork/streamid'
import type { StreamState } from './stream.js'

/**
 * Traverse from the most recent to the last, according to selected ordering.
 */
export type ForwardPagination = {
  first: number
  after?: string
}

/**
 * Traverse from the last to the most recent, according to selected ordering.
 * Gets the oldest entries but the results get newer as you iterate.
 */
export type BackwardPagination = {
  last: number
  before?: string
}

/**
 * Part of an indexing query related to pagination.
 * Could be either forward (first, after) or backward (last, before).
 */
export type Pagination = ForwardPagination | BackwardPagination

/**
 * Base query to the index. Disregards pagination.
 */
export type BaseQuery = {
  model: StreamID | string
  account?: string
  filter?: Record<string, string>
}

export type PaginationQuery = BaseQuery & Pagination

/**
 * API to query an index.
 *
 * Returns null, iff the stream state can't be retrieved from the repository.
 */
export interface IndexApi {
  count(query: BaseQuery): Promise<number>
  query(query: PaginationQuery): Promise<Page<StreamState | null>>
}

export type Edge<T> = {
  cursor: string
  node: T
}

/**
 * Response from indexing api. Contains entries `T` and clues for the next or previous page.
 */
export interface Page<T> {
  readonly edges: Array<Edge<T>>
  readonly pageInfo: PageInfo
}

/**
 * Clues for the next or previous page.
 */
export type PageInfo = {
  readonly hasNextPage: boolean
  readonly hasPreviousPage: boolean
  readonly startCursor?: string
  readonly endCursor?: string
}
