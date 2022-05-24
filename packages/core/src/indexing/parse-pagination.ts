import type { Pagination } from './types'

export enum PaginationKind {
  FORWARD,
  BACKWARD,
}

export type ForwardPaginationQuery = {
  kind: PaginationKind.FORWARD
  first: number
  after?: string
}

export type BackwardPaginationQuery = {
  kind: PaginationKind.BACKWARD
  last: number
  before?: string
}

export type PaginationQuery = ForwardPaginationQuery | BackwardPaginationQuery

export function parsePagination(query: Pagination): PaginationQuery {
  if ('first' in query) {
    return {
      kind: PaginationKind.FORWARD,
      first: query.first,
      after: query.after,
    }
  } else {
    return {
      kind: PaginationKind.BACKWARD,
      last: query.last,
      before: query.before,
    }
  }
}
