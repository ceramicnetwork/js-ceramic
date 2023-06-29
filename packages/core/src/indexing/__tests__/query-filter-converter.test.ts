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
        a: { type: 'value', op: '=', value: 1 },
      },
    })

    expect(query).toEqual(
      `select '${DATA_FIELD}' from 'test' where (((cast(${DATA_FIELD}->>'a' as int)=1)))`
    )
  })
  test('that are composed of a single doc filter with multiple values', () => {
    const query = createQuery({
      type: 'where',
      value: {
        a: { type: 'value', op: '=', value: 1 },
        b: { type: 'value', op: 'in', value: [2, 3] },
      },
    })
    expect(query).toEqual(
      `select '${DATA_FIELD}' from 'test' where (((cast(${DATA_FIELD}->>'a' as int)=1)) and (cast(stream_content->>'b' as int) in (2,3)))`
    )
  })
  test('that are composed of and doc filters', () => {
    const query = createQuery({
      type: 'and',
      value: [
        {
          type: 'where',
          value: {
            a: { type: 'value', op: '=', value: 1 },
          },
        },
        {
          type: 'where',
          value: {
            b: { type: 'value', op: 'in', value: [2, 3] },
          },
        },
      ],
    })
    expect(query).toEqual(
      `select '${DATA_FIELD}' from 'test' where ((((cast(${DATA_FIELD}->>'a' as int)=1))) and ((cast(stream_content->>'b' as int) in (2,3))))`
    )
  })
  test('that are composed of or doc filters', () => {
    const query = createQuery({
      type: 'or',
      value: [
        {
          type: 'where',
          value: {
            a: { type: 'value', op: '=', value: 1 },
          },
        },
        {
          type: 'where',
          value: {
            b: { type: 'value', op: 'in', value: [2, 3] },
          },
        },
      ],
    })
    expect(query).toEqual(
      `select '${DATA_FIELD}' from 'test' where ((((cast(${DATA_FIELD}->>'a' as int)=1))) or ((cast(stream_content->>'b' as int) in (2,3))))`
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
              a: { type: 'value', op: '=', value: 1 },
            },
          },
          {
            type: 'where',
            value: {
              b: { type: 'value', op: 'in', value: [2, 3] },
            },
          },
        ],
      },
    })
    expect(query).toEqual(
      `select '${DATA_FIELD}' from 'test' where ((not ((cast(${DATA_FIELD}->>'a' as int)=1))) or ((cast(stream_content->>'b' as int) not in (2,3))))`
    )
  })
})
