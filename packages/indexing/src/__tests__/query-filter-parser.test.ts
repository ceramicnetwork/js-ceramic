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
  test('that are composed of a single in query', () => {
    const parsed = parseQueryFilters({
      where: {
        a: { in: ['b', 'c'] },
      },
    })
    expect(parsed).toEqual({
      type: 'where',
      value: {
        a: { type: 'string', op: 'in', value: ['b', 'c'] },
      },
    })
  })
  test('that are composed of a null query', () => {
    const parsed = parseQueryFilters({
      where: {
        a: { isNull: true },
      },
    })
    expect(parsed).toEqual({
      type: 'where',
      value: {
        a: { type: 'boolean', op: 'null', value: true },
      },
    })
  })
  test('that are composed of a negated null query', () => {
    const parsed = parseQueryFilters({
      where: {
        a: { isNull: false },
      },
    })
    expect(parsed).toEqual({
      type: 'where',
      value: {
        a: { type: 'boolean', op: 'null', value: false },
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
  test('that are composed of an or query', () => {
    const parsed = parseQueryFilters({
      or: [
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
      type: 'or',
      value: [
        { type: 'where', value: { a: { type: 'number', op: '=', value: 5 } } },
        { type: 'where', value: { b: { type: 'string', op: '!=', value: '10' } } },
      ],
    })
  })
  test('that are composed of a where query with multiple conditions per key', () => {
    const parsed = parseQueryFilters({
      where: {
        a: { lessThan: 23, greaterThanOrEqualTo: 4 },
      },
    })
    expect(parsed).toEqual({
      type: 'and',
      value: [
        {
          type: 'where',
          value: {
            a: { type: 'number', op: '>=', value: 4 },
          },
        },
        {
          type: 'where',
          value: {
            a: { type: 'number', op: '<', value: 23 },
          },
        },
      ],
    })
  })
  test('that are composed of a or query where with multiple condition/key pairs', () => {
    const parsed = parseQueryFilters({
      where: {
        a: { equalTo: 5 },
        b: { lessThanOrEqualTo: 22 },
      },
    })
    expect(parsed).toEqual({
      type: 'and',
      value: [
        {
          type: 'where',
          value: {
            a: { type: 'number', op: '=', value: 5 },
          },
        },
        {
          type: 'where',
          value: {
            b: { type: 'number', op: '<=', value: 22 },
          },
        },
      ],
    })
  })
  test('that are composed of an or query containing where queries multiple condition/key pairs', () => {
    const parsed = parseQueryFilters({
      or: [
        {
          where: {
            a: { equalTo: 5 },
            b: { isNull: true },
          },
        },
        {
          where: {
            c: { notEqualTo: '10' },
          },
        },
      ],
    })
    expect(parsed).toEqual({
      type: 'or',
      value: [
        {
          type: 'and',
          value: [
            {
              type: 'where',
              value: {
                a: { type: 'number', op: '=', value: 5 },
              },
            },
            {
              type: 'where',
              value: {
                b: { type: 'boolean', op: 'null', value: true },
              },
            },
          ],
        },
        {
          type: 'where',
          value: {
            c: { type: 'string', op: '!=', value: '10' },
          },
        },
      ],
    })
  })
  test('that are composed of an or query containing where queries multiple condition/key pairs, negated', () => {
    const parsed = parseQueryFilters({
      not: {
        and: [
          {
            where: {
              c: { notEqualTo: '10' },
            },
          },
          {
            where: {
              a: { equalTo: 5 },
              b: { isNull: true },
            },
          },
        ],
      },
    })
    expect(parsed).toEqual({
      type: 'not',
      value: {
        type: 'and',
        value: [
          {
            type: 'where',
            value: {
              c: { type: 'string', op: '!=', value: '10' },
            },
          },
          {
            type: 'and',
            value: [
              {
                type: 'where',
                value: {
                  a: { type: 'number', op: '=', value: 5 },
                },
              },
              {
                type: 'where',
                value: {
                  b: { type: 'boolean', op: 'null', value: true },
                },
              },
            ],
          },
        ],
      },
    })
  })
})

describe('Should fail to parse queries', () => {
  test('that are composed of a where query with multiple incompatible ops to combine', () => {
    expect(() =>
      parseQueryFilters({
        where: {
          a: { in: [5], greaterThan: 10 },
        },
      })
    ).toThrow(/Can only combine value filters representing valid range boundaries/)
  })
  test('that are composed of a where query with too many ops to combine', () => {
    expect(() =>
      parseQueryFilters({
        where: {
          a: { notIn: [3], greaterThan: 2, lessThan: 11 },
        },
      })
    ).toThrow(/Cannot combine more than 2 value filters/)
  })
  test('that provides an unknown query', () => {
    expect(() =>
      parseQueryFilters({
        what: {
          a: { notIn: [3], greaterThan: 2, lessThan: 11 },
        },
      } as any)
    ).toThrow(/Invalid query/)
  })
  test('that provides an unknown op', () => {
    expect(() =>
      parseQueryFilters({
        where: {
          a: { cheese: [3] },
        },
      } as any)
    ).toThrow(/Invalid op/)
  })
  test('has multiple filters at the same level', () => {
    expect(() =>
      parseQueryFilters({
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
        not: {
          where: {
            c: { equalTo: 2 },
          },
        },
      })
    ).toThrow(/Only one of where, and, or, and not can be used per query filter level/)
  })
})
