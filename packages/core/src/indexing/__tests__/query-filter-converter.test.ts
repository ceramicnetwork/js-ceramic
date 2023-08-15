import { jest } from '@jest/globals'
import pkg from 'knex'
const { knex } = pkg
import { convertQueryFilter, DATA_FIELD } from '../query-filter-converter.js'
import { QueryFilters } from '@ceramicnetwork/common'

function createQuery(query: QueryFilters): string {
  const result = convertQueryFilter(query)
  return knex('test')
    .from('test')
    .select(DATA_FIELD)
    .where(result.where)
    .toQuery()
    .replaceAll('`', "'")
}

describe('Should convert query filters', () => {
  test('that are composed of a single doc filter', () => {
    const query = createQuery({
      type: 'where',
      value: {
        a: { type: 'integer', op: '=', value: 1 },
      },
    })

    expect(query).toEqual(
      `select '${DATA_FIELD}' from 'test' where (((cast(${DATA_FIELD}->>'a' as numeric)=1)))`
    )
  })
  test('that are composed of a single doc filter with float', () => {
    const query = createQuery({
      type: 'where',
      value: {
        a: { type: 'number', op: '=', value: 1.2 },
      },
    })

    expect(query).toEqual(
      `select '${DATA_FIELD}' from 'test' where (((cast(${DATA_FIELD}->>'a' as numeric)=1.2)))`
    )
  })
  test('that are composed of a single doc filter with in string query', () => {
    const query = createQuery({
      type: 'where',
      value: {
        a: { type: 'string', op: 'in', value: ['a', 'b'] },
      },
    })

    expect(query).toEqual(
      `select '${DATA_FIELD}' from 'test' where ((cast(${DATA_FIELD}->>'a' as varchar) in ('a','b')))`
    )
  })
  test('that are composed of a single doc filter with null', () => {
    const query = createQuery({
      type: 'where',
      value: {
        a: { type: 'integer', op: 'null', value: true },
      },
    })

    expect(query).toEqual(
      `select '${DATA_FIELD}' from 'test' where (((${DATA_FIELD}->>'a' is null)))`
    )
  })
  test('that are composed of a single doc filter with negated null', () => {
    const query = createQuery({
      type: 'where',
      value: {
        a: { type: 'number', op: 'null', value: false },
      },
    })

    expect(query).toEqual(
      `select '${DATA_FIELD}' from 'test' where (((${DATA_FIELD}->>'a' is not null)))`
    )
  })
  test('that are composed of a single doc filter with string equal', () => {
    const query = createQuery({
      type: 'where',
      value: {
        a: { type: 'string', op: '=', value: 'test_str' },
      },
    })

    expect(query).toEqual(
      `select '${DATA_FIELD}' from 'test' where (((cast(${DATA_FIELD}->>'a' as varchar)='test_str')))`
    )
  })
  test('that are composed of a single doc filter with multiple values', () => {
    const query = createQuery({
      type: 'where',
      value: {
        a: { type: 'number', op: '=', value: 1 },
        b: { type: 'number', op: 'in', value: [2, 3] },
      },
    })
    expect(query).toEqual(
      `select '${DATA_FIELD}' from 'test' where (((cast(${DATA_FIELD}->>'a' as numeric)=1)) and (cast(stream_content->>'b' as numeric) in (2,3)))`
    )
  })
  test('that are composed of and doc filters', () => {
    const query = createQuery({
      type: 'and',
      value: [
        {
          type: 'where',
          value: {
            a: { type: 'number', op: '=', value: 1 },
          },
        },
        {
          type: 'where',
          value: {
            b: { type: 'number', op: 'in', value: [2, 3] },
          },
        },
      ],
    })
    expect(query).toEqual(
      `select '${DATA_FIELD}' from 'test' where ((((cast(${DATA_FIELD}->>'a' as numeric)=1))) and ((cast(stream_content->>'b' as numeric) in (2,3))))`
    )
  })
  test('that are composed of or doc filters', () => {
    const query = createQuery({
      type: 'or',
      value: [
        {
          type: 'where',
          value: {
            a: { type: 'number', op: '=', value: 1 },
          },
        },
        {
          type: 'where',
          value: {
            b: { type: 'number', op: 'in', value: [2, 3] },
          },
        },
      ],
    })
    expect(query).toEqual(
      `select '${DATA_FIELD}' from 'test' where ((((cast(${DATA_FIELD}->>'a' as numeric)=1))) or ((cast(stream_content->>'b' as numeric) in (2,3))))`
    )
  })
  test('that are composed of or doc filters negated', () => {
    const query = createQuery({
      type: 'not',
      value: {
        type: 'or',
        value: [
          {
            type: 'where',
            value: {
              a: { type: 'number', op: '=', value: 1 },
            },
          },
          {
            type: 'where',
            value: {
              b: { type: 'number', op: 'in', value: [2, 3] },
            },
          },
        ],
      },
    })
    expect(query).toEqual(
      `select '${DATA_FIELD}' from 'test' where ((not ((cast(${DATA_FIELD}->>'a' as numeric)=1))) or ((cast(stream_content->>'b' as numeric) not in (2,3))))`
    )
  })
})
