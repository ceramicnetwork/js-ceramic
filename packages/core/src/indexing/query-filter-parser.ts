import {
  QueryFilters as ApiQueryFilters,
  ObjectFilter as ApiObjectFilter,
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
export function parseObjectFilter(filter: ApiObjectFilter): ObjectFilter {
  const entries: Record<string, AllValueFilter> = {}
  const keys = Object.keys(filter)
  for (const key of keys) {
    const childFilter = filter[key]
    if ('isNull' in childFilter) {
      const value = childFilter.isNull
      entries[key] = {
        type: getValueType(value),
        op: 'null',
        value: value,
      }
    } else if ('equalTo' in childFilter) {
      const value = childFilter.equalTo
      entries[key] = {
        type: getValueType(value),
        op: '=',
        value: value,
      }
    } else if ('notEqualTo' in childFilter) {
      const value = childFilter.notEqualTo
      entries[key] = {
        type: getValueType(value),
        op: '!=',
        value: value,
      }
    } else if ('lessThan' in childFilter) {
      const value = childFilter.lessThan
      entries[key] = {
        type: getNonBooleanValueType(value),
        op: '<',
        value: value,
      }
    } else if ('lessThanOrEqualTo' in childFilter) {
      const value = childFilter.lessThanOrEqualTo
      entries[key] = {
        type: getNonBooleanValueType(value),
        op: '<=',
        value: value,
      }
    } else if ('greaterThan' in childFilter) {
      const value = childFilter.greaterThan
      entries[key] = {
        type: getNonBooleanValueType(value),
        op: '>',
        value: value,
      }
    } else if ('greaterThanOrEqualTo' in childFilter) {
      const value = childFilter.greaterThanOrEqualTo
      entries[key] = {
        type: getNonBooleanValueType(value),
        op: '>=',
        value: value,
      }
    } else if ('in' in childFilter) {
      const value = childFilter.in
      if (value.length == 0) {
        throw new Error('In query specified without array values')
      }
      entries[key] = {
        type: getNonBooleanValueType(value[0]),
        op: 'in',
        value: value,
      }
    } else if ('notIn' in childFilter) {
      const value = childFilter.notIn
      if (value.length == 0) {
        throw new Error('Not In query specified without array values')
      }
      entries[key] = {
        type: getNonBooleanValueType(value[0]),
        op: 'nin',
        value: value,
      }
    }
  }
  return entries
}

export function parseQueryFilters(filter: ApiQueryFilters): QueryFilters {
  if ('where' in filter) {
    const value = parseObjectFilter(filter.where as ApiObjectFilter)
    return {
      type: 'where',
      value,
    }
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
}
