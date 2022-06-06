import type { BaseQuery, ForwardPagination, Pagination } from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'

/**
 * Check if +input+ is a positive integer.
 */
function isPositiveInteger(input: unknown): input is number {
  return typeof input === 'number' && Math.floor(input) === input && input > 0
}

/**
 * Parse +params+ and select only fields relevant to +ForwardPagination+ or +BackwardPagination+.
 *
 * If no relevant fields found, return +byDefault+.
 */
export function parsePagination(
  params: Record<string, any>,
  byDefault: ForwardPagination
): Pagination {
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
    return byDefault
  }
}

/**
 * Return index query based on the query string params from HTTP request.
 *
 * @throws If parsed +query.model+ is not a valid StreamID.
 */
export function collectionQuery(
  query: Record<string, any>,
  defaultPagination: ForwardPagination
): BaseQuery & Pagination {
  try {
    const pagination = parsePagination(query, defaultPagination)
    return {
      model: StreamID.fromString(query.model),
      account: query.account,
      ...pagination,
    }
  } catch (e) {
    throw new Error(`Invalid request to collection input`)
  }
}
