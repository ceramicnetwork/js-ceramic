import type { StreamID } from '@ceramicnetwork/streamid'
import type { StreamState } from './stream.js'

/**
 * Allowed ordering for an indexing query.
 */
export enum Ordering {
  /**
   * `last_anchored_at DESC NULLS FIRST, created_at DESC`
   */
  CHRONOLOGICAL = 'chronological',
  /**
   * `created_at DESC` = when an entry was added to the index
   */
  INSERTION = 'insertion',
}

/**
 * Traverse from the most recent to the last, according to selected ordering.
 */
export interface ForwardPagination {
  readonly first: number
  readonly after?: string
}

/**
 * Traverse from the last to the most recent, according to selected ordering.
 * Gets the oldest entries but the results get newer as you iterate.
 */
export interface BackwardPagination {
  readonly last: number
  readonly before?: string
}

/**
 * Part of an indexing query related to pagination.
 * Could be either forward (first, after) or backward (last, before).
 */
export type Pagination = ForwardPagination | BackwardPagination

/**
 * Base query to the index. Disregards pagination.
 */
export interface BaseQuery {
  readonly model: StreamID | string
  readonly account?: string
  readonly order?: Ordering // default: CHRONOLOGICAL_DESC
}

/**
 * API to query an index.
 */
export interface IndexClientApi {
  queryIndex(query: BaseQuery & Pagination): Promise<Page<StreamState>>
}

/**
 * Response from indexing api. Contains entries `T` and clues for the next or previous page.
 */
export interface Page<T> {
  readonly entries: Array<T>
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
