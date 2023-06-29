import { jest } from '@jest/globals'
import { parseQueryFilters } from '../query-filter-parser.js'

describe('Should parse query filters', () => {
  test('that are composed of a single where query', () => {
    const parsed = parseQueryFilters({
      where: {
        a: { equalTo: 5 },
      },
    })
    expect(parsed).toEqual({
      type: 'where',
      value: {
        a: { type: 'number', op: '=', value: 5 },
      },
    })
  })
  test('that are composed of an and query', () => {
    const parsed = parseQueryFilters({
      and: [
        {
          where: {
            a: { equalTo: 5 },
          },
        },
        {
          where: {
            b: { notEqualTo: '10' },
          },
        },
      ],
    })
    expect(parsed).toEqual({
      type: 'and',
      value: [
        { type: 'where', value: { a: { type: 'number', op: '=', value: 5 } } },
        { type: 'where', value: { b: { type: 'string', op: '!=', value: '10' } } },
      ],
    })
  })
})
