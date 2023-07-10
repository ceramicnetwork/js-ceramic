import type { BaseQuery, Pagination } from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'

/**
 * Maximum number of indexing entries requested.
 */
const MAX_ENTRIES_ALLOWED = 1000

/**
 * Check if +input+ is a positive integer.
 */
function isPositiveInteger(input: unknown): input is number {
  return typeof input === 'number' && Math.floor(input) === input && input > 0
}

export class InvalidPaginationError extends Error {
  constructor() {
    super(`Can not parse pagination fields: either "first" or "last" should be positive integers`)
  }
}

/**
 * Thrown if requested number of entries is larger than +MAX_ENTRIES_ALLOWED+.
 */
export class MaxEntriesError extends Error {
  constructor(requestedEntries: number) {
    super(`Requested too many entries: ${requestedEntries}. Maximum is ${MAX_ENTRIES_ALLOWED}`)
  }
}

/**
 * @param requestedEntries Number of entries requested: either `first` for forward pagination or `last` for backward pagination.
 * @throws MaxEntriesError if `requestedEntries > MAX_ENTRIES_ALLOWED`.
 */
function assertPageLimit(requestedEntries: number) {
  if (requestedEntries > MAX_ENTRIES_ALLOWED) {
    throw new MaxEntriesError(requestedEntries)
  }
}

/**
 * Parse +params+ and select only fields relevant to +ForwardPagination+ or +BackwardPagination+.
 *
 * @throws if no relevant fields found, or if requested more than allowed (see +assertPageLimit+)
 */
export function parsePagination(params: Record<string, any>): Pagination {
  if (isPositiveInteger(params.first)) {
    assertPageLimit(params.first)
    return {
      first: params.first,
      after: params.after,
    }
  } else if (isPositiveInteger(params.last)) {
    assertPageLimit(params.last)
    return {
      last: params.last,
      before: params.before,
    }
  } else {
    throw new InvalidPaginationError()
  }
}

/**
 * Return index query based on the query string params from HTTP request.
 *
 * @throws If parsed +query.model+ is not a valid StreamID, or if pagination is absent.
 */
export function collectionQuery(query: Record<string, any>): BaseQuery & Pagination {
  try {
    const pagination = parsePagination(query)
    return {
      model: StreamID.fromString(query.model),
      account: query.account,
      filter: query.filter,
      ...pagination,
    }
  } catch (e) {
    throw new Error(`Invalid input in collection request: ${e.message}`)
  }
}

export function countQuery(query: Record<string, any>): BaseQuery {
  return {
    model: StreamID.fromString(query.model),
    account: query.account,
    filter: query.filter,
  }
}
