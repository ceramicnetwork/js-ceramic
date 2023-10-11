import { Knex } from 'knex'
import {
  getValueType,
  NonBooleanValueFilterType,
  ObjectFilter,
  QueryFilters,
  ValueFilterType,
} from './query-filter-parser.js'

export const DATA_FIELD = 'stream_content'

export function contentKey(field: string): string {
  return `${DATA_FIELD}->>'${field}'`
}

type DBQuery = Knex.QueryBuilder
type WhereFunc = (query: DBQuery) => DBQuery

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
  const opFunc = (bldr: Knex.QueryBuilder) => {
    if (first) {
      return bldr.where(func)
    } else if (combinator && combinator == Combinator.Or) {
      return bldr.orWhere(func)
    } else {
      return bldr.andWhere(func)
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
  const cast = nonBooleanTypeAsCast(tpe)
  let arrValue: string
  if (cast == 'varchar') {
    arrValue = value.map((v) => `'${v}'`).join(',')
  } else {
    arrValue = value.map((v) => `${v}`).join(',')
  }
  const inner = (bldr: Knex.QueryBuilder) => {
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
  let where = (bldr: Knex.QueryBuilder) => bldr
  const select = []

  // If there are multiple keys, they are combined via "ands" and the negation is applied over the and
  let combinator = state.combinator
  let negated = state.negated
  if (Object.keys(state.filter).length > 1) {
    combinator = Combinator.And
    negated = false
  }

  for (const filterKey in state.filter) {
    select.push(filterKey)
    const value = state.filter[filterKey]
    const key = contentKey(filterKey)

    switch (value!.op) {
      case 'null': {
        const isFirst = first
        const old = where
        where = (bldr) => {
          const b = old(bldr)
          let nullQuery = 'is not null'
          if (value!.value) {
            nullQuery = 'is null'
          }
          return handleQuery(
            b,
            (b) => {
              const raw = b.client.raw(`${key} ${nullQuery}`)
              return b.whereRaw(raw)
            },
            isFirst,
            negated,
            combinator
          )
        }
        break
      }
      case 'in':
      case 'nin': {
        if ((value!.value as Array<any>).length == 0) {
          throw new Error('Expected an array with at least one item')
        }
        const isFirst = first
        const old = where
        let inNegated = negated
        if (value!.op == 'nin') {
          inNegated = !inNegated
        }
        where = (bldr) => {
          const b = old(bldr)
          return handleIn(
            b,
            key,
            value!.type as any,
            value!.value as any,
            isFirst,
            negated,
            combinator
          )
        }
        break
      }
      default: {
        const isFirst = first
        const cast = typeAsCast(getValueType(value!.value as any))
        const old = where
        where = (bldr) => {
          const b = old(bldr)
          let queryValue = value!.value
          if (cast == 'varchar') {
            queryValue = `'${queryValue}'`
          }
          return handleQuery(
            b,
            (b) => {
              const raw = b.client.raw(`cast(${key} as ${cast})${value!.op}${queryValue}`)
              return b.whereRaw(raw)
            },
            isFirst,
            negated,
            combinator
          )
        }
      }
    }

    first = false
  }

  // apply the not over the entire query if there are implicit "ands"
  if (Object.keys(state.filter).length > 1 && state.negated) {
    const old = where
    where = (bldr) => {
      return bldr.whereNot(old)
    }
  }

  return {
    select,
    where,
  }
}

function handleCombinator(
  state: ConversionState<QueryFilters>,
  negated: boolean
): ConvertedQueryFilter {
  let where = (bldr: Knex.QueryBuilder) => bldr
  let select: Array<string> = []
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

  // apply negation over the entire query
  if (negated) {
    const old = where
    where = (bldr) => {
      return bldr.whereNot(old)
    }
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
      // apply negation after the filter have been combined
      newState.negated = false
      return handleCombinator(newState, state.negated)
    }
    case 'or': {
      const newState = nextState(state, state.filter)
      newState.combinator = Combinator.Or
      // apply negation after the filter have been combined
      newState.negated = false
      return handleCombinator(newState, state.negated)
    }
    case 'not': {
      const next = nextState(state, state.filter.value)
      next.negated = !state.negated
      return convert(next)
    }
  }
}

export type ConvertedQueryFilter = {
  where: (query: DBQuery) => DBQuery
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
