import {
  QueryFilters as ApiQueryFilters,
  ObjectFilter as ApiObjectFilter,
  NonEmptyArray,
} from '@ceramicnetwork/common'

export type NonBooleanValueFilterType = 'number' | 'string'
export type ValueFilterType = 'boolean' | 'number' | 'string'
export type ValueFilter<T extends boolean | number | string = boolean | number | string> =
  | { type: ValueFilterType; op: 'null'; value: boolean }
  | { type: ValueFilterType; op: '='; value: T }
  | { type: ValueFilterType; op: '!='; value: T }

export type NonBooleanValueFilter<T extends number | string = number | string> =
  | { type: NonBooleanValueFilterType; op: 'in'; value: Array<T> }
  | { type: NonBooleanValueFilterType; op: 'nin'; value: Array<T> }
  | { type: NonBooleanValueFilterType; op: '>'; value: T }
  | { type: NonBooleanValueFilterType; op: '>='; value: T }
  | { type: NonBooleanValueFilterType; op: '<'; value: T }
  | { type: NonBooleanValueFilterType; op: '<='; value: T }

export type AllValueFilter = ValueFilter | NonBooleanValueFilter

type ParsedObjectFilter = Record<string, NonEmptyArray<AllValueFilter>>

/**
 * Mapping of object keys to value filter
 */
export type ObjectFilter = Record<string, AllValueFilter>

/**
 * Advanced query filters on a document fields
 */
export type QueryFilters =
  | { type: 'where'; value: ObjectFilter }
  | { type: 'and'; value: Array<QueryFilters> }
  | { type: 'or'; value: Array<QueryFilters> }
  | { type: 'not'; value: QueryFilters }

export function getNonBooleanValueType<T extends number | string>(
  value: T
): NonBooleanValueFilterType {
  if (typeof value == 'number') {
    return 'number'
  } else {
    return 'string'
  }
}

export function getValueType<T extends boolean | number | string>(value: T): ValueFilterType {
  if (typeof value == 'boolean') {
    return 'boolean'
  } else {
    return getNonBooleanValueType(value)
  }
}

function validateCombinedOps(ops: string[]): void {
  if (ops.length <= 1) {
    return
  }

  if (ops.length > 2) {
    throw new Error('Cannot combine more than 2 value filters')
  }

  ops.sort()

  if (!ops[0].startsWith('greaterThan') || !ops[1].startsWith('lessThan')) {
    throw new Error(
      'Can only combine value filters representing valid range boundaries ex. greaterThan[orEqualto] and lessThan[orEqualTo]'
    )
  }
}

export function parseObjectFilter(filter: ApiObjectFilter): ParsedObjectFilter {
  const entries: Record<string, AllValueFilter[]> = {}
  const keys = Object.keys(filter)
  for (const key of keys) {
    const childFilter = filter[key]
    const childKeys = Object.keys(childFilter)
    if (childKeys.length > 1) {
      validateCombinedOps(childKeys)
    }

    entries[key] = []
    for (const childKey of childKeys) {
      if (childKey === 'isNull' && 'isNull' in childFilter) {
        const value = childFilter.isNull
        entries[key].push({
          type: getValueType(value),
          op: 'null',
          value: value,
        })
      } else if (childKey === 'equalTo' && 'equalTo' in childFilter) {
        const value = childFilter.equalTo
        entries[key].push({
          type: getValueType(value),
          op: '=',
          value: value,
        })
      } else if (childKey === 'notEqualTo' && 'notEqualTo' in childFilter) {
        const value = childFilter.notEqualTo
        entries[key].push({
          type: getValueType(value),
          op: '!=',
          value: value,
        })
      } else if (childKey === 'lessThan' && 'lessThan' in childFilter) {
        const value = childFilter.lessThan
        entries[key].push({
          type: getNonBooleanValueType(value),
          op: '<',
          value: value,
        })
      } else if (childKey === 'lessThanOrEqualTo' && 'lessThanOrEqualTo' in childFilter) {
        const value = childFilter.lessThanOrEqualTo
        entries[key].push({
          type: getNonBooleanValueType(value),
          op: '<=',
          value: value,
        })
      } else if (childKey === 'greaterThan' && 'greaterThan' in childFilter) {
        const value = childFilter.greaterThan
        entries[key].push({
          type: getNonBooleanValueType(value),
          op: '>',
          value: value,
        })
      } else if (childKey === 'greaterThanOrEqualTo' && 'greaterThanOrEqualTo' in childFilter) {
        const value = childFilter.greaterThanOrEqualTo
        entries[key].push({
          type: getNonBooleanValueType(value),
          op: '>=',
          value: value,
        })
      } else if (childKey === 'in' && 'in' in childFilter) {
        const value = childFilter.in
        if (value.length == 0) {
          throw new Error('In query specified without array values')
        }
        entries[key].push({
          type: getNonBooleanValueType(value[0]),
          op: 'in',
          value: value,
        })
      } else if (childKey === 'notIn' && 'notIn' in childFilter) {
        const value = childFilter.notIn
        if (value.length == 0) {
          throw new Error('Not In query specified without array values')
        }
        entries[key].push({
          type: getNonBooleanValueType(value[0]),
          op: 'nin',
          value: value,
        })
      } else {
        throw new Error(`Invalid op ${childKey}`)
      }
    }
  }
  return entries as ParsedObjectFilter
}

export function parseQueryFilters(filter: ApiQueryFilters): QueryFilters {
  const keys = Object.keys(filter)
  if (keys.length > 1) {
    throw new Error('Only one of where, and, or, and not can be used per query filter level')
  }

  if ('where' in filter) {
    const value = parseObjectFilter(filter.where as ApiObjectFilter)

    // if there are multiple keys, combine them via "and"
    const childWhereValues: Array<QueryFilters> = Object.entries(value).map(
      ([childKey, childValue]) => {
        // if there are multiple entries per key, combine them via "and"
        if (childValue.length > 1) {
          return {
            type: 'and',
            value: childValue.map((subChildValue) => ({
              type: 'where',
              value: { [childKey]: subChildValue },
            })),
          }
        }
        return {
          type: 'where',
          value: { [childKey]: childValue[0] },
        }
      }
    )

    if (childWhereValues.length > 1) {
      return {
        type: 'and',
        value: childWhereValues,
      }
    }

    return childWhereValues[0]
  } else if ('and' in filter) {
    const value = filter.and.map(parseQueryFilters)
    return {
      type: 'and',
      value,
    }
  } else if ('or' in filter) {
    const value = filter.or.map(parseQueryFilters)
    return {
      type: 'or',
      value,
    }
  } else if ('not' in filter) {
    const value = parseQueryFilters(filter.not)
    return {
      type: 'not',
      value,
    }
  }

  throw new Error(`Invalid query: ${keys[0]}`)
}
