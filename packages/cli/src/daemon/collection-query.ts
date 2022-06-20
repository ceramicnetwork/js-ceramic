import type { BaseQuery, Pagination } from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'

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
 * Parse +params+ and select only fields relevant to +ForwardPagination+ or +BackwardPagination+.
 *
 * @throws if no relevant fields found.
 */
export function parsePagination(params: Record<string, any>): Pagination {
  if (isPositiveInteger(params.first)) {
    return {
      first: params.first,
      after: params.after,
    }
  } else if (isPositiveInteger(params.last)) {
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
      ...pagination,
    }
  } catch (e) {
    throw new Error(`Invalid input in collection request: ${e.message}`)
  }
}
