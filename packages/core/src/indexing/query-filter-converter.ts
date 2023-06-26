import { AnyValueFilter, ObjectFilter, QueryFilters } from '@ceramicnetwork/common'
import { Knex } from 'knex'

type DBQuery = Knex.QueryBuilder
type WhereFunc = (DBQuery) => DBQuery

enum Combinator {
  And,
  Or,
}

type ConversionState<T> = {
  filter: T
  combinator?: Combinator
  negated: boolean
}

function nextState<Old, New>(state: ConversionState<Old>, next: New): ConversionState<New> {
  return {
    filter: next,
    negated: state.negated,
    combinator: state.combinator,
  }
}

function handleQuery(
  query: DBQuery,
  func: WhereFunc,
  first: boolean,
  negated: boolean,
  combinator?: Combinator
): DBQuery {
  const opFunc = (bldr) => {
    if (first) {
      return bldr.where(func)
    } else if (combinator) {
      if (combinator == Combinator.Or) {
        return bldr.orWhere(func)
      } else {
        return bldr.andWhere(func)
      }
    } else {
      throw new Error('Combinator called without operand')
    }
  }
  if (negated) {
    return query.whereNot(opFunc)
  } else {
    return query.where(opFunc)
  }
}

function handleIn(
  query: DBQuery,
  key: string,
  value: AnyValueFilter,
  first: boolean,
  negated: boolean,
  combinator?: Combinator
): DBQuery {
  const inner = (bldr) => {
    if (negated) {
      bldr.whereNotIn(key, value.value)
    } else {
      bldr.whereIn(key, value.value)
    }
  }
  if (first) {
    return query.where(inner)
  } else if (combinator && combinator == Combinator.Or) {
    return query.orWhere(inner)
  } else {
    return query.andWhere(inner)
  }
}

function handleWhereQuery(state: ConversionState<ObjectFilter>): ConvertedQueryFilter {
  let first = true
  let where = (bldr) => bldr
  const select = []
  for (const key in state.filter) {
    select.push(key)
    const value = state.filter[key]

    switch (value.op) {
      case 'null': {
        const isFirst = first
        const old = where
        where = (bldr) => {
          const b = old(bldr)
          return handleQuery(b, (b) => b.whereNull(key), isFirst, state.negated, state.combinator)
        }
        break
      }
      case 'in':
      case 'nin': {
        const isFirst = first
        const old = where
        let negated = state.negated
        if (value.op == 'nin') {
          negated = !negated
        }
        where = (bldr) => {
          const b = old(bldr)
          return handleIn(b, key, value, isFirst, negated, state.combinator)
        }
        break
      }
      default: {
        const isFirst = first
        const old = where
        where = (bldr) => {
          const b = old(bldr)
          return handleQuery(
            b,
            (b) => b.where(key, value.op, value.value),
            isFirst,
            state.negated,
            state.combinator
          )
        }
      }
    }

    first = false
  }
  return {
    select,
    where,
  }
}

function handleCombinator(state: ConversionState<QueryFilters>): ConvertedQueryFilter {
  let where = (bldr) => bldr
  let select = []
  let first = true
  const filters = state.filter.value as Array<QueryFilters>
  for (const filter of filters) {
    const next = nextState(state, filter)
    const res = convert(next)
    select = select.concat(res.select)
    const old = where
    where = (bldr) => {
      const b = old(bldr)
      if (first) {
        return b.where(res.where)
      } else if (state.combinator && state.combinator == Combinator.Or) {
        return b.orWhere(res.where)
      } else {
        return b.andWhere(res.where)
      }
    }
    first = false
  }
  return {
    where,
    select,
  }
}

function convert(state: ConversionState<QueryFilters>): ConvertedQueryFilter {
  switch (state.filter.type) {
    case 'where': {
      const filter = state.filter.value as ObjectFilter
      return handleWhereQuery(nextState(state, filter))
    }
    case 'and': {
      const newState = nextState(state, state.filter)
      newState.combinator = Combinator.And
      return handleCombinator(newState)
    }
    case 'or': {
      const newState = nextState(state, state.filter)
      newState.combinator = Combinator.Or
      return handleCombinator(newState)
    }
    case 'not': {
      const next = nextState(state, state.filter.value)
      next.negated = !state.negated
      return convert(next)
    }
  }
}

export type ConvertedQueryFilter = {
  where: (DBQuery) => DBQuery
  select: Array<string>
}

export function convertQueryFilter(filter?: QueryFilters): ConvertedQueryFilter {
  if (filter) {
    const state = {
      filter: filter,
      negated: false,
    }
    return convert(state)
  }
  return {
    select: [],
    where: (bldr) => bldr,
  }
}
