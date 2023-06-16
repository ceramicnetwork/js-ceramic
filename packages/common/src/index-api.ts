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
 * Boolean field value filter
 */
export type BooleanValueFilter = { isNull: boolean } | { equalTo: boolean }

/**
 * Enum field value filter
 */
export type EnumValueFilter =
  | { isNull: boolean }
  | { equalTo: string }
  | { notEqualTo: string }
  | { in: Array<string> }
  | { notIn: Array<string> }

/**
 * String or number field value filter
 */
export type ScalarValueFilter<T extends string | number = string | number> =
  | { isNull: boolean }
  | { equalTo: T }
  | { notEqualTo: T }
  | { in: Array<T> }
  | { notIn: Array<T> }
  | { lessThan: T }
  | { lessThanOrEqualTo: T }
  | { greaterThan: T }
  | { greaterThanOrEqualTo: T }

/**
 * Any supported field value filter on an object
 */
export type AnyValueFilter = BooleanValueFilter | EnumValueFilter | ScalarValueFilter

/**
 * Mapping of object keys to value filter
 */
export type ObjectFilter = Record<string, AnyValueFilter>

/**
 * Advanced query filters on a document fields
 */
export type QueryFilters =
  | { doc: ObjectFilter }
  | { and: Array<QueryFilters> }
  | { or: Array<QueryFilters> }
  | { not: QueryFilters }

/**
 * Field sort order, 'ASC' for ascending, 'DESC' for descending
 */
export type SortOrder = 'ASC' | 'DESC'

/**
 * Mapping of object keys to value sort order
 */
export type Sorting = Record<string, SortOrder>

/**
 * Base query to the index. Disregards pagination.
 */
export type BaseQuery = {
  model: StreamID | string
  account?: string
  /**
   * @deprecated relation filters used by ComposeDB <= 0.4
   */
  filter?: Record<string, string>
  queryFilters?: QueryFilters
  sorting?: Sorting
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
