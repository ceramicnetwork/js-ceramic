import { jest } from '@jest/globals'
import pkg from 'knex'
const { knex } = pkg
import { convertQueryFilter } from '../query-filter-converter.js'
import { QueryFilters } from '@ceramicnetwork/common'

function createQuery(query: QueryFilters, addlSelect: Array<string>): string {
  const result = convertQueryFilter(query)
  return knex('test')
    .from('test')
    .select(result.select.concat(addlSelect))
    .where(result.where)
    .toQuery()
}
describe('Should convert query filters', () => {
  test('that are composed of a single doc filter', () => {
    const query = createQuery(
      {
        type: 'doc',
        value: {
          a: { type: 'scalar', op: '=', value: 1 },
        },
      },
      []
    )

    expect(query).toEqual('select `a` from `test` where (((`a` = 1)))')
  })
  test('that are composed of a single doc filter with multiple values', () => {
    const query = createQuery(
      {
        type: 'doc',
        value: {
          a: { type: 'scalar', op: '=', value: 1 },
          b: { type: 'scalar', op: 'in', value: [2, 3] },
        },
      },
      []
    )
    expect(query).toEqual('select `a`, `b` from `test` where (((`a` = 1)) and (`b` in (2, 3)))')
  })
  test('that are composed of and doc filters', () => {
    const query = createQuery(
      {
        type: 'and',
        value: [
          {
            type: 'doc',
            value: {
              a: { type: 'scalar', op: '=', value: 1 },
            },
          },
          {
            type: 'doc',
            value: {
              b: { type: 'scalar', op: 'in', value: [2, 3] },
            },
          },
        ],
      },
      []
    )
    expect(query).toEqual('select `a`, `b` from `test` where ((((`a` = 1))) and ((`b` in (2, 3))))')
  })
  test('that are composed of or doc filters', () => {
    const query = createQuery(
      {
        type: 'or',
        value: [
          {
            type: 'doc',
            value: {
              a: { type: 'scalar', op: '=', value: 1 },
            },
          },
          {
            type: 'doc',
            value: {
              b: { type: 'scalar', op: 'in', value: [2, 3] },
            },
          },
        ],
      },
      []
    )
    expect(query).toEqual('select `a`, `b` from `test` where ((((`a` = 1))) or ((`b` in (2, 3))))')
  })
  test('that are composed of or doc filters negated', () => {
    const query = createQuery(
      {
        type: 'not',
        value: {
          type: 'or',
          value: [
            {
              type: 'doc',
              value: {
                a: { type: 'scalar', op: '=', value: 1 },
              },
            },
            {
              type: 'doc',
              value: {
                b: { type: 'scalar', op: 'in', value: [2, 3] },
              },
            },
          ],
        },
      },
      []
    )
    expect(query).toEqual(
      'select `a`, `b` from `test` where ((not ((`a` = 1))) or ((`b` not in (2, 3))))'
    )
  })
})
