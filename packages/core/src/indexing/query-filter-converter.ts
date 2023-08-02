import { Knex } from 'knex'
import {
  getValueType,
  NonBooleanValueFilterType,
  ObjectFilter,
  QueryFilters,
  ValueFilterType,
} from './query-filter-parser.js'

export const DATA_FIELD = 'stream_content'

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

function typeAsCast(tpe: ValueFilterType): string {
  switch (tpe) {
    case 'boolean':
      return 'boolean'
    default:
      return nonBooleanTypeAsCast(tpe)
  }
}

function nonBooleanTypeAsCast(tpe: NonBooleanValueFilterType): string {
  switch (tpe) {
    case 'number':
      return 'numeric'
    case 'string':
      return 'varchar'
  }
}

function handleIn<T extends number | string>(
  query: DBQuery,
  key: string,
  tpe: NonBooleanValueFilterType,
  value: Array<T>,
  first: boolean,
  negated: boolean,
  combinator?: Combinator
): DBQuery {
  const arrValue = value.map((v) => v.toString()).join(',')
  const cast = nonBooleanTypeAsCast(tpe)
  const inner = (bldr) => {
    let op = ' in '
    if (negated) {
      op = ` not${op}`
    }
    const raw = bldr.client.raw(`cast(${key} as ${cast})${op}(${arrValue})`)
    bldr.whereRaw(raw)
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
  for (const filterKey in state.filter) {
    select.push(filterKey)
    const value = state.filter[filterKey]
    const key = `${DATA_FIELD}->>'${filterKey}'`

    switch (value.op) {
      case 'null': {
        const isFirst = first
        const old = where
        where = (bldr) => {
          const b = old(bldr)
          let nullQuery = 'is not null'
          if (value.value) {
            nullQuery = 'is null'
          }
          return handleQuery(
            b,
            (b) => {
              const raw = b.client.raw(`${key} ${nullQuery}`)
              return b.whereRaw(raw)
            },
            isFirst,
            state.negated,
            state.combinator
          )
        }
        break
      }
      case 'in':
      case 'nin': {
        if (value.value.length == 0) {
          throw new Error('Expected an array with at least one item')
        }
        const isFirst = first
        const old = where
        let negated = state.negated
        if (value.op == 'nin') {
          negated = !negated
        }
        where = (bldr) => {
          const b = old(bldr)
          return handleIn(b, key, value.type, value.value, isFirst, negated, state.combinator)
        }
        break
      }
      default: {
        const isFirst = first
        const cast = typeAsCast(getValueType(value.value))
        const old = where
        where = (bldr) => {
          const b = old(bldr)
          let queryValue = value.value
          if (cast == 'varchar') {
            queryValue = `'${queryValue}'`
          }
          return handleQuery(
            b,
            (b) => {
              const raw = b.client.raw(`cast(${key} as ${cast})${value.op}${queryValue}`)
              return b.whereRaw(raw)
            },
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
