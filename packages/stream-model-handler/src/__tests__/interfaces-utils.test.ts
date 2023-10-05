import { hasUncaughtExceptionCaptureCallback } from 'process'
import {
  areMatchingSchemaTypes,
  createResolvers,
  isValidArraySchema,
  isValidNumberSchema,
  isValidObjectSchema,
  isValidRelationsImplementation,
  isValidSchemaType,
  isValidStringSchema,
  isValidSchemaImplementation,
  isValidViewsImplementation,
  validateImplementedInterfaces,
  validateInterface,
  validateInterfaceImplementation,
} from '../interfaces-utils.js'

describe('validateInterface()', () => {
  test('throws if the interface does not have schema properties or views', () => {
    expect(() => {
      // @ts-expect-error
      validateInterface({ schema: { type: 'object' } })
    }).toThrow('Invalid interface: a least one propery or view must be present')
  })

  test('passes if the model schema has properties', () => {
    expect(() => {
      validateInterface({
        schema: { type: 'object', properties: { foo: { type: 'string' } } },
      } as any)
    }).not.toThrow()
  })

  test('passes if the model views object is not empty', () => {
    expect(() => {
      validateInterface({ views: { model: { did: { type: 'documentAccount' } } } } as any)
    }).not.toThrow()
  })
})

describe('schema validation', () => {
  const defaultResolvers = createResolvers({}, {})

  describe('isValidNumberSchema()', () => {
    test('handles const value', () => {
      expect(isValidNumberSchema({ const: 5 }, {})).toBe(false)
      expect(isValidNumberSchema({ const: 5 }, { const: 2 })).toBe(false)
      expect(isValidNumberSchema({}, { const: 5 })).toBe(true)
      expect(isValidNumberSchema({ const: 5 }, { const: 5 })).toBe(true)
    })

    test('handles maximum value', () => {
      expect(isValidNumberSchema({ maximum: 5 }, {})).toBe(false)
      expect(isValidNumberSchema({ maximum: 5 }, { maximum: 7 })).toBe(false)
      expect(isValidNumberSchema({ maximum: 5 }, { const: 7 })).toBe(false)
      expect(isValidNumberSchema({}, { maximum: 5 })).toBe(true)
      expect(isValidNumberSchema({ maximum: 5 }, { maximum: 5 })).toBe(true)
      expect(isValidNumberSchema({ maximum: 5 }, { maximum: 3 })).toBe(true)
      expect(isValidNumberSchema({ maximum: 5 }, { const: 3 })).toBe(true)
    })

    test('handles minimum value', () => {
      expect(isValidNumberSchema({ minimum: 5 }, {})).toBe(false)
      expect(isValidNumberSchema({ minimum: 5 }, { minimum: 1 })).toBe(false)
      expect(isValidNumberSchema({ minimum: 5 }, { const: 1 })).toBe(false)
      expect(isValidNumberSchema({}, { minimum: 5 })).toBe(true)
      expect(isValidNumberSchema({ minimum: 5 }, { minimum: 5 })).toBe(true)
      expect(isValidNumberSchema({ minimum: 5 }, { minimum: 6 })).toBe(true)
      expect(isValidNumberSchema({ minimum: 5 }, { const: 5 })).toBe(true)
    })

    test('handles exclusiveMaximum value', () => {
      expect(isValidNumberSchema({ exclusiveMaximum: 5 }, {})).toBe(false)
      expect(isValidNumberSchema({ exclusiveMaximum: 5 }, { exclusiveMaximum: 7 })).toBe(false)
      expect(isValidNumberSchema({ exclusiveMaximum: 5 }, { const: 5 })).toBe(false)
      expect(isValidNumberSchema({}, { exclusiveMaximum: 5 })).toBe(true)
      expect(isValidNumberSchema({ exclusiveMaximum: 5 }, { exclusiveMaximum: 5 })).toBe(true)
      expect(isValidNumberSchema({ exclusiveMaximum: 5 }, { exclusiveMaximum: 3 })).toBe(true)
      expect(isValidNumberSchema({ exclusiveMaximum: 5 }, { const: 3 })).toBe(true)
    })

    test('handles exclusiveMinimum value', () => {
      expect(isValidNumberSchema({ exclusiveMinimum: 5 }, {})).toBe(false)
      expect(isValidNumberSchema({ exclusiveMinimum: 5 }, { exclusiveMinimum: 1 })).toBe(false)
      expect(isValidNumberSchema({ exclusiveMinimum: 5 }, { const: 5 })).toBe(false)
      expect(isValidNumberSchema({}, { exclusiveMinimum: 5 })).toBe(true)
      expect(isValidNumberSchema({ exclusiveMinimum: 5 }, { exclusiveMinimum: 5 })).toBe(true)
      expect(isValidNumberSchema({ exclusiveMinimum: 5 }, { exclusiveMinimum: 6 })).toBe(true)
      expect(isValidNumberSchema({ exclusiveMinimum: 5 }, { const: 6 })).toBe(true)
    })
  })

  describe('isValidStringSchema()', () => {
    test('handles const value', () => {
      expect(isValidStringSchema({ const: 'foo' }, {})).toBe(false)
      expect(isValidStringSchema({ const: 'foo' }, { const: 'bar' })).toBe(false)
      expect(isValidStringSchema({}, { const: 'foo' })).toBe(true)
      expect(isValidStringSchema({ const: 'foo' }, { const: 'foo' })).toBe(true)
    })

    test('handles pattern value', () => {
      expect(isValidStringSchema({ pattern: '^[0-9]{2}$' }, {})).toBe(false)
      expect(isValidStringSchema({ pattern: '^[0-9]{2}$' }, { pattern: '^[0-9]{3}$' })).toBe(false)
      expect(isValidStringSchema({}, { pattern: '^[0-9]{2}$' })).toBe(true)
      expect(isValidStringSchema({ pattern: '^[0-9]{2}$' }, { pattern: '^[0-9]{2}$' })).toBe(true)
    })

    test('handles maxLength value', () => {
      expect(isValidStringSchema({ maxLength: 5 }, {})).toBe(false)
      expect(isValidStringSchema({ maxLength: 5 }, { maxLength: 7 })).toBe(false)
      expect(isValidStringSchema({ maxLength: 5 }, { const: 'foobar' })).toBe(false)
      expect(isValidStringSchema({}, { maxLength: 5 })).toBe(true)
      expect(isValidStringSchema({ maxLength: 5 }, { maxLength: 5 })).toBe(true)
      expect(isValidStringSchema({ maxLength: 5 }, { maxLength: 3 })).toBe(true)
      expect(isValidStringSchema({ maxLength: 5 }, { const: 'foo' })).toBe(true)
    })

    test('handles minLength value', () => {
      expect(isValidStringSchema({ minLength: 5 }, {})).toBe(false)
      expect(isValidStringSchema({ minLength: 5 }, { minLength: 1 })).toBe(false)
      expect(isValidStringSchema({ minLength: 5 }, { const: 'foo' })).toBe(false)
      expect(isValidStringSchema({}, { minLength: 5 })).toBe(true)
      expect(isValidStringSchema({ minLength: 5 }, { minLength: 5 })).toBe(true)
      expect(isValidStringSchema({ minLength: 5 }, { minLength: 6 })).toBe(true)
      expect(isValidStringSchema({ minLength: 5 }, { const: 'foobar' })).toBe(true)
    })
  })

  describe('isValidArraySchema()', () => {
    test('items schema must be defined', () => {
      expect(isValidArraySchema({}, { items: { type: 'string' } }, defaultResolvers)).toBe(false)
      expect(isValidArraySchema({ items: { type: 'string' } }, {}, defaultResolvers)).toBe(false)
      expect(
        isValidArraySchema(
          { items: { type: 'string' } },
          { items: { type: 'string' } },
          defaultResolvers
        )
      ).toBe(true)
    })

    test('handles maxItems value', () => {
      expect(
        isValidArraySchema(
          { items: { type: 'string' }, maxItems: 5 },
          { items: { type: 'string' } },
          defaultResolvers
        )
      ).toBe(false)
      expect(
        isValidArraySchema(
          { items: { type: 'string' }, maxItems: 5 },
          { items: { type: 'string' }, maxItems: 7 },
          defaultResolvers
        )
      ).toBe(false)
      expect(
        isValidArraySchema(
          { items: { type: 'string' } },
          { items: { type: 'string' }, maxItems: 5 },
          defaultResolvers
        )
      ).toBe(true)
      expect(
        isValidArraySchema(
          { items: { type: 'string' }, maxItems: 5 },
          { items: { type: 'string' }, maxItems: 5 },
          defaultResolvers
        )
      ).toBe(true)
      expect(
        isValidArraySchema(
          { items: { type: 'string' }, maxItems: 5 },
          { items: { type: 'string' }, maxItems: 3 },
          defaultResolvers
        )
      ).toBe(true)
    })

    test('handles minItems value', () => {
      expect(
        isValidArraySchema(
          { items: { type: 'string' }, minItems: 5 },
          { items: { type: 'string' } },
          defaultResolvers
        )
      ).toBe(false)
      expect(
        isValidArraySchema(
          { items: { type: 'string' }, minItems: 5 },
          { items: { type: 'string' }, minItems: 3 },
          defaultResolvers
        )
      ).toBe(false)
      expect(
        isValidArraySchema(
          { items: { type: 'string' } },
          { items: { type: 'string' }, minItems: 5 },
          defaultResolvers
        )
      ).toBe(true)
      expect(
        isValidArraySchema(
          { items: { type: 'string' }, minItems: 5 },
          { items: { type: 'string' }, minItems: 5 },
          defaultResolvers
        )
      ).toBe(true)
      expect(
        isValidArraySchema(
          { items: { type: 'string' }, minItems: 5 },
          { items: { type: 'string' }, minItems: 7 },
          defaultResolvers
        )
      ).toBe(true)
    })

    test('handles items schema', () => {
      const expected = {
        $defs: { stringSchema: { title: 'Foo', type: 'string' } },
        items: { $ref: '#/$defs/stringSchema' },
      }
      expect(
        isValidArraySchema(expected, { items: { type: 'string' } }, createResolvers(expected, {}))
      ).toBe(false)
      expect(isValidArraySchema(expected, { items: { type: 'string' } }, defaultResolvers)).toBe(
        false
      )
      const implementedInvalid = {
        $defs: { stringSchema: { title: 'Bar', type: 'string' } },
        items: { $ref: '#/$defs/stringSchema' },
      }
      expect(
        isValidArraySchema(
          expected,
          implementedInvalid,
          createResolvers(expected, implementedInvalid)
        )
      ).toBe(false)
      expect(isValidArraySchema(expected, implementedInvalid, createResolvers(expected, {}))).toBe(
        false
      )
      const implementedValid = {
        $defs: { stringSchema: { title: 'Foo', type: 'string' } },
        items: { $ref: '#/$defs/stringSchema' },
      }
      expect(
        isValidArraySchema(expected, implementedValid, createResolvers(expected, implementedValid))
      ).toBe(true)
      expect(
        isValidArraySchema(
          expected,
          { items: { title: 'Foo', type: 'string' } },
          createResolvers(expected, {})
        )
      ).toBe(true)
    })
  })

  describe('isValidObjectSchema()', () => {
    test('handles expected required properties', () => {
      expect(
        isValidObjectSchema({ required: ['foo'] }, { required: ['bar'] }, defaultResolvers)
      ).toBe(false)
      expect(
        isValidObjectSchema({ required: ['foo'] }, { required: ['foo', 'bar'] }, defaultResolvers)
      ).toBe(true)
      expect(isValidObjectSchema({}, { required: ['foo'] }, defaultResolvers)).toBe(true)
    })

    test('handles expected properties', () => {
      expect(
        isValidObjectSchema({ properties: { foo: { type: 'number' } } }, {}, defaultResolvers)
      ).toBe(false)
      expect(
        isValidObjectSchema(
          { properties: { foo: { type: 'number' } } },
          { properties: { foo: { type: 'string' } } },
          defaultResolvers
        )
      ).toBe(false)
      expect(
        isValidObjectSchema(
          { properties: { foo: { type: 'number' }, bar: { type: 'string' } } },
          { properties: { foo: { type: 'number' }, bar: { type: 'string' } } },
          defaultResolvers
        )
      ).toBe(true)
    })
  })

  test('areValidSchemaTypes()', () => {
    const expectedList = [{ type: 'string' }, { type: 'null' }, { type: 'number' }]
    expect(areMatchingSchemaTypes(expectedList, [{ type: 'string' }], defaultResolvers)).toBe(false)
    expect(
      areMatchingSchemaTypes(
        expectedList,
        [{ type: 'number' }, { type: 'string' }, { type: 'boolean' }],
        defaultResolvers
      )
    ).toBe(false)
    expect(
      areMatchingSchemaTypes(
        expectedList,
        [{ type: 'number' }, { type: 'string' }, { type: 'null' }],
        defaultResolvers
      )
    ).toBe(true)
  })

  describe('isValidSchemaType()', () => {
    test('handles boolean schemas', () => {
      expect(isValidSchemaType(true, false, defaultResolvers)).toBe(false)
      expect(isValidSchemaType(true, { type: 'boolean' }, defaultResolvers)).toBe(false)
      expect(isValidSchemaType({ type: 'boolean' }, false, defaultResolvers)).toBe(false)
      expect(isValidSchemaType(true, true, defaultResolvers)).toBe(true)
      expect(isValidSchemaType(false, false, defaultResolvers)).toBe(true)
    })

    test('validates type match', () => {
      expect(isValidSchemaType({ type: 'string' }, { type: 'number' }, defaultResolvers)).toBe(
        false
      )
      expect(isValidSchemaType({ type: 'string' }, { type: 'string' }, defaultResolvers)).toBe(true)
    })

    test('validates title match when provided', () => {
      expect(
        isValidSchemaType({ type: 'string', title: 'foo' }, { type: 'string' }, defaultResolvers)
      ).toBe(false)
      expect(
        isValidSchemaType(
          { type: 'string', title: 'foo' },
          { type: 'string', title: 'bar' },
          defaultResolvers
        )
      ).toBe(false)
      expect(
        isValidSchemaType(
          { type: 'string', title: 'foo' },
          { type: 'string', title: 'foo' },
          defaultResolvers
        )
      ).toBe(true)
      expect(
        isValidSchemaType({ type: 'string' }, { type: 'string', title: 'bar' }, defaultResolvers)
      ).toBe(true)
    })

    test('validates allOf schemas', () => {
      expect(
        isValidSchemaType(
          { allOf: [{ type: 'string' }, { type: 'string', maxLength: 4 }] },
          { type: 'string', maxLength: 4 },
          defaultResolvers
        )
      ).toBe(false)
      expect(
        isValidSchemaType(
          { allOf: [{ type: 'string' }, { type: 'string', maxLength: 10 }] },
          { allOf: [{ type: 'string', maxLength: 4 }] },
          defaultResolvers
        )
      ).toBe(false)
      expect(
        isValidSchemaType(
          { allOf: [{ type: 'null' }, { type: 'string', maxLength: 10 }] },
          { allOf: [{ type: 'null' }, { type: 'string', maxLength: 6 }] },
          defaultResolvers
        )
      ).toBe(true)
    })

    test.todo('anyOf array')
    test.todo('oneOf array')
    test.todo('array type')
    test.todo('object type')
    test.todo('integer type')
    test.todo('number type')
    test.todo('boolean type')
    test.todo('number type')
    test.todo('fallback error')
  })
})
