import {
  createResolvers,
  isValidRelationsImplementation,
  isValidViewsImplementation,
  validateAllSchemaTypes,
  validateAnySchemaTypes,
  validateArraySchema,
  validateBooleanSchema,
  validateImplementedInterfaces,
  validateInterface,
  validateInterfaceImplementation,
  validateNumberSchema,
  validateObjectSchema,
  validateSchemaType,
  validateStringSchema,
  validateSchemaImplementation,
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
  const context = { ...createResolvers({}, {}), path: [] }

  describe('validateBooleanSchema()', () => {
    test('handles const value', () => {
      expect(validateBooleanSchema(context, { const: false }, {})).toEqual([
        { path: [], property: 'const', expected: false },
      ])
      expect(validateBooleanSchema(context, { const: false }, { const: true })).toEqual([
        { path: [], property: 'const', expected: false, actual: true },
      ])
      expect(validateBooleanSchema(context, {}, {})).toHaveLength(0)
      expect(validateBooleanSchema(context, { const: true }, { const: true })).toHaveLength(0)
    })
  })

  describe('validateNumberSchema()', () => {
    test('handles const value', () => {
      expect(validateNumberSchema(context, { const: 5 }, {})).toEqual([
        { path: [], property: 'const', expected: 5 },
      ])
      expect(validateNumberSchema(context, { const: 5 }, { const: 2 })).toEqual([
        { path: [], property: 'const', expected: 5, actual: 2 },
      ])
      expect(validateNumberSchema(context, {}, { const: 5 })).toHaveLength(0)
      expect(validateNumberSchema(context, { const: 5 }, { const: 5 })).toHaveLength(0)
    })

    test('handles maximum value', () => {
      expect(validateNumberSchema(context, { maximum: 5 }, {})).toEqual([
        { path: [], property: 'maximum', expected: 5 },
      ])
      expect(validateNumberSchema(context, { maximum: 5 }, { maximum: 7 })).toEqual([
        { path: [], property: 'maximum', expected: 5, actual: 7 },
      ])
      expect(validateNumberSchema(context, { maximum: 5 }, { const: 7 })).toEqual([
        { path: [], property: 'maximum', expected: 5, actual: 7 },
      ])
      expect(validateNumberSchema(context, {}, { maximum: 5 })).toHaveLength(0)
      expect(validateNumberSchema(context, { maximum: 5 }, { maximum: 5 })).toHaveLength(0)
      expect(validateNumberSchema(context, { maximum: 5 }, { maximum: 3 })).toHaveLength(0)
      expect(validateNumberSchema(context, { maximum: 5 }, { const: 3 })).toHaveLength(0)
    })

    test('handles minimum value', () => {
      expect(validateNumberSchema(context, { minimum: 5 }, {})).toEqual([
        { path: [], property: 'minimum', expected: 5 },
      ])
      expect(validateNumberSchema(context, { minimum: 5 }, { minimum: 1 })).toEqual([
        { path: [], property: 'minimum', expected: 5, actual: 1 },
      ])
      expect(validateNumberSchema(context, { minimum: 5 }, { const: 1 })).toEqual([
        { path: [], property: 'minimum', expected: 5, actual: 1 },
      ])
      expect(validateNumberSchema(context, {}, { minimum: 5 })).toHaveLength(0)
      expect(validateNumberSchema(context, { minimum: 5 }, { minimum: 5 })).toHaveLength(0)
      expect(validateNumberSchema(context, { minimum: 5 }, { minimum: 6 })).toHaveLength(0)
      expect(validateNumberSchema(context, { minimum: 5 }, { const: 5 })).toHaveLength(0)
    })

    test('handles exclusiveMaximum value', () => {
      expect(validateNumberSchema(context, { exclusiveMaximum: 5 }, {})).toEqual([
        { path: [], property: 'exclusiveMaximum', expected: 5 },
      ])
      expect(
        validateNumberSchema(context, { exclusiveMaximum: 5 }, { exclusiveMaximum: 7 })
      ).toEqual([{ path: [], property: 'exclusiveMaximum', expected: 5, actual: 7 }])
      expect(validateNumberSchema(context, { exclusiveMaximum: 5 }, { const: 5 })).toEqual([
        { path: [], property: 'exclusiveMaximum', expected: 5, actual: 5 },
      ])
      expect(validateNumberSchema(context, {}, { exclusiveMaximum: 5 })).toHaveLength(0)
      expect(
        validateNumberSchema(context, { exclusiveMaximum: 5 }, { exclusiveMaximum: 5 })
      ).toHaveLength(0)
      expect(
        validateNumberSchema(context, { exclusiveMaximum: 5 }, { exclusiveMaximum: 3 })
      ).toHaveLength(0)
      expect(validateNumberSchema(context, { exclusiveMaximum: 5 }, { const: 3 })).toHaveLength(0)
    })

    test('handles exclusiveMinimum value', () => {
      expect(validateNumberSchema(context, { exclusiveMinimum: 5 }, {})).toEqual([
        { path: [], property: 'exclusiveMinimum', expected: 5 },
      ])
      expect(
        validateNumberSchema(context, { exclusiveMinimum: 5 }, { exclusiveMinimum: 1 })
      ).toEqual([{ path: [], property: 'exclusiveMinimum', expected: 5, actual: 1 }])
      expect(validateNumberSchema(context, { exclusiveMinimum: 5 }, { const: 5 })).toEqual([
        { path: [], property: 'exclusiveMinimum', expected: 5, actual: 5 },
      ])
      expect(validateNumberSchema(context, {}, { exclusiveMinimum: 5 })).toHaveLength(0)
      expect(
        validateNumberSchema(context, { exclusiveMinimum: 5 }, { exclusiveMinimum: 5 })
      ).toHaveLength(0)
      expect(
        validateNumberSchema(context, { exclusiveMinimum: 5 }, { exclusiveMinimum: 6 })
      ).toHaveLength(0)
      expect(validateNumberSchema(context, { exclusiveMinimum: 5 }, { const: 6 })).toHaveLength(0)
    })
  })

  describe('validateStringSchema()', () => {
    test('handles const value', () => {
      expect(validateStringSchema(context, { const: 'foo' }, {})).toEqual([
        { path: [], property: 'const', expected: 'foo' },
      ])
      expect(validateStringSchema(context, { const: 'foo' }, { const: 'bar' })).toEqual([
        { path: [], property: 'const', expected: 'foo', actual: 'bar' },
      ])
      expect(validateStringSchema(context, {}, { const: 'foo' })).toHaveLength(0)
      expect(validateStringSchema(context, { const: 'foo' }, { const: 'foo' })).toHaveLength(0)
    })

    test('handles pattern value', () => {
      expect(validateStringSchema(context, { pattern: '^[0-9]{2}$' }, {})).toEqual([
        { path: [], property: 'pattern', expected: '^[0-9]{2}$' },
      ])
      expect(
        validateStringSchema(context, { pattern: '^[0-9]{2}$' }, { pattern: '^[0-9]{3}$' })
      ).toEqual([{ path: [], property: 'pattern', expected: '^[0-9]{2}$', actual: '^[0-9]{3}$' }])
      expect(validateStringSchema(context, {}, { pattern: '^[0-9]{2}$' })).toHaveLength(0)
      expect(
        validateStringSchema(context, { pattern: '^[0-9]{2}$' }, { pattern: '^[0-9]{2}$' })
      ).toHaveLength(0)
    })

    test('handles maxLength value', () => {
      expect(validateStringSchema(context, { maxLength: 5 }, {})).toEqual([
        { path: [], property: 'maxLength', expected: 5 },
      ])
      expect(validateStringSchema(context, { maxLength: 5 }, { maxLength: 7 })).toEqual([
        { path: [], property: 'maxLength', expected: 5, actual: 7 },
      ])
      expect(validateStringSchema(context, { maxLength: 5 }, { const: 'foobar' })).toEqual([
        { path: [], property: 'maxLength', expected: 5, actual: 'foobar' },
      ])
      expect(validateStringSchema(context, {}, { maxLength: 5 })).toHaveLength(0)
      expect(validateStringSchema(context, { maxLength: 5 }, { maxLength: 5 })).toHaveLength(0)
      expect(validateStringSchema(context, { maxLength: 5 }, { maxLength: 3 })).toHaveLength(0)
      expect(validateStringSchema(context, { maxLength: 5 }, { const: 'foo' })).toHaveLength(0)
    })

    test('handles minLength value', () => {
      expect(validateStringSchema(context, { minLength: 5 }, {})).toEqual([
        { path: [], property: 'minLength', expected: 5 },
      ])
      expect(validateStringSchema(context, { minLength: 5 }, { minLength: 1 })).toEqual([
        { path: [], property: 'minLength', expected: 5, actual: 1 },
      ])
      expect(validateStringSchema(context, { minLength: 5 }, { const: 'foo' })).toEqual([
        { path: [], property: 'minLength', expected: 5, actual: 'foo' },
      ])
      expect(validateStringSchema(context, {}, { minLength: 5 })).toHaveLength(0)
      expect(validateStringSchema(context, { minLength: 5 }, { minLength: 5 })).toHaveLength(0)
      expect(validateStringSchema(context, { minLength: 5 }, { minLength: 6 })).toHaveLength(0)
      expect(validateStringSchema(context, { minLength: 5 }, { const: 'foobar' })).toHaveLength(0)
    })
  })

  describe('validateArraySchema()', () => {
    test('items schema must be defined', () => {
      expect(validateArraySchema(context, {}, { items: { type: 'string' } })).toEqual([
        { path: [], property: 'items', expected: undefined, actual: { type: 'string' } },
      ])
      expect(validateArraySchema(context, { items: { type: 'string' } }, {})).toEqual([
        { path: [], property: 'items', expected: { type: 'string' }, actual: undefined },
      ])
      expect(
        validateArraySchema(context, { items: { type: 'string' } }, { items: { type: 'string' } })
      ).toHaveLength(0)
    })

    test('handles maxItems value', () => {
      expect(
        validateArraySchema(
          context,
          { items: { type: 'string' }, maxItems: 5 },
          { items: { type: 'string' } }
        )
      ).toEqual([{ path: [], property: 'maxItems', expected: 5 }])
      expect(
        validateArraySchema(
          context,
          { items: { type: 'string' }, maxItems: 5 },
          { items: { type: 'string' }, maxItems: 7 }
        )
      ).toEqual([{ path: [], property: 'maxItems', expected: 5, actual: 7 }])
      expect(
        validateArraySchema(
          context,
          { items: { type: 'string' } },
          { items: { type: 'string' }, maxItems: 5 }
        )
      ).toHaveLength(0)
      expect(
        validateArraySchema(
          context,
          { items: { type: 'string' }, maxItems: 5 },
          { items: { type: 'string' }, maxItems: 5 }
        )
      ).toHaveLength(0)
      expect(
        validateArraySchema(
          context,
          { items: { type: 'string' }, maxItems: 5 },
          { items: { type: 'string' }, maxItems: 3 }
        )
      ).toHaveLength(0)
    })

    test('handles minItems value', () => {
      expect(
        validateArraySchema(
          context,
          { items: { type: 'string' }, minItems: 5 },
          { items: { type: 'string' } }
        )
      ).toEqual([{ path: [], property: 'minItems', expected: 5 }])
      expect(
        validateArraySchema(
          context,
          { items: { type: 'string' }, minItems: 5 },
          { items: { type: 'string' }, minItems: 3 }
        )
      ).toEqual([{ path: [], property: 'minItems', expected: 5, actual: 3 }])
      expect(
        validateArraySchema(
          context,
          { items: { type: 'string' } },
          { items: { type: 'string' }, minItems: 5 }
        )
      ).toHaveLength(0)
      expect(
        validateArraySchema(
          context,
          { items: { type: 'string' }, minItems: 5 },
          { items: { type: 'string' }, minItems: 5 }
        )
      ).toHaveLength(0)
      expect(
        validateArraySchema(
          context,
          { items: { type: 'string' }, minItems: 5 },
          { items: { type: 'string' }, minItems: 7 }
        )
      ).toHaveLength(0)
    })

    test('handles items schema', () => {
      const expected = {
        $defs: { stringSchema: { title: 'Foo', type: 'string' } },
        items: { $ref: '#/$defs/stringSchema' },
      }
      expect(
        validateArraySchema({ ...createResolvers(expected, {}), path: [] }, expected, {
          items: { type: 'string' },
        })
      ).toEqual([{ path: ['items'], property: 'title', expected: 'Foo' }])

      const implementedInvalid = {
        $defs: { stringSchema: { title: 'Bar', type: 'string' } },
        items: { $ref: '#/$defs/stringSchema' },
      }
      expect(
        validateArraySchema(
          { ...createResolvers(expected, implementedInvalid), path: [] },
          expected,
          implementedInvalid
        )
      ).toEqual([{ path: ['items'], property: 'title', expected: 'Foo', actual: 'Bar' }])
      expect(
        validateArraySchema(
          { ...createResolvers(expected, {}), path: [] },
          expected,
          implementedInvalid
        )
      ).toEqual([
        { path: [], property: 'items', expected: { title: 'Foo', type: 'string' }, actual: null },
      ])

      const implementedValid = {
        $defs: { stringSchema: { title: 'Foo', type: 'string' } },
        items: { $ref: '#/$defs/stringSchema' },
      }
      expect(
        validateArraySchema(
          { ...createResolvers(expected, implementedValid), path: [] },
          expected,
          implementedValid
        )
      ).toHaveLength(0)
      expect(
        validateArraySchema({ ...createResolvers(expected, {}), path: [] }, expected, {
          items: { title: 'Foo', type: 'string' },
        })
      ).toHaveLength(0)
    })
  })

  describe('validateObjectSchema()', () => {
    test('handles expected required properties', () => {
      expect(validateObjectSchema(context, { required: ['foo'] }, { required: ['bar'] })).toEqual([
        { path: [], property: 'required', expected: 'foo' },
      ])
      expect(
        validateObjectSchema(context, { required: ['foo'] }, { required: ['foo', 'bar'] })
      ).toHaveLength(0)
      expect(validateObjectSchema(context, {}, { required: ['foo'] })).toHaveLength(0)
    })

    test('handles expected properties', () => {
      expect(
        validateObjectSchema(context, { properties: { foo: { type: 'number' } } }, {})
      ).toEqual([{ path: [], property: 'properties', expected: 'foo' }])
      expect(
        validateObjectSchema(
          context,
          { properties: { foo: { type: 'number' } } },
          { properties: { foo: { type: 'string' } } }
        )
      ).toEqual([{ path: ['foo'], property: 'type', expected: 'number', actual: 'string' }])
      expect(
        validateObjectSchema(
          context,
          { properties: { foo: { type: 'number' }, bar: { type: 'string' } } },
          { properties: { foo: { type: 'number' }, bar: { type: 'string' } } }
        )
      ).toHaveLength(0)
    })
  })

  test('validateAllSchemaTypes()', () => {
    const expectedList = [{ type: 'string' }, { type: 'null' }, { type: 'number' }]
    expect(validateAllSchemaTypes(context, expectedList, [{ type: 'string' }])).toEqual([
      { path: [], property: 'length', expected: 3, actual: 1 },
    ])
    expect(
      validateAllSchemaTypes(context, expectedList, [
        { type: 'number' },
        { type: 'string' },
        { type: 'boolean' },
      ])
    ).toEqual([{ path: [], index: 1, expected: { type: 'null' } }])
    expect(
      validateAllSchemaTypes(context, expectedList, [
        { type: 'number' },
        { type: 'string' },
        { type: 'null' },
      ])
    ).toHaveLength(0)
  })

  test('validateAnySchemaTypes()', () => {
    const expectedList = [{ type: 'string' }, { type: 'null' }]
    expect(validateAnySchemaTypes(context, expectedList, [{ type: 'boolean' }])).toEqual([
      { path: [], index: 0, expected: { type: 'string' } },
      { path: [], index: 1, expected: { type: 'null' } },
    ])
    expect(
      validateAnySchemaTypes(context, expectedList, [
        { type: 'number' },
        { type: 'string' },
        { type: 'null' },
      ])
    ).toHaveLength(0)
  })

  describe('validateSchemaType()', () => {
    test('handles boolean schemas', () => {
      expect(validateSchemaType(context, true, false)).toEqual([
        { path: [], expected: true, actual: false },
      ])
      expect(validateSchemaType(context, true, { type: 'boolean' })).toEqual([
        { path: [], expected: true, actual: { type: 'boolean' } },
      ])
      expect(validateSchemaType(context, { type: 'boolean' }, false)).toEqual([
        { path: [], expected: { type: 'boolean' }, actual: false },
      ])
      expect(validateSchemaType(context, true, true)).toHaveLength(0)
      expect(validateSchemaType(context, false, false)).toHaveLength(0)
    })

    test('validates type match', () => {
      expect(validateSchemaType(context, { type: 'string' }, { type: 'number' })).toEqual([
        { path: [], property: 'type', expected: 'string', actual: 'number' },
      ])
      expect(validateSchemaType(context, { type: 'string' }, { type: 'string' })).toHaveLength(0)
    })

    test('validates title match when provided', () => {
      expect(
        validateSchemaType(context, { type: 'string', title: 'foo' }, { type: 'string' })
      ).toEqual([{ path: [], property: 'title', expected: 'foo' }])
      expect(
        validateSchemaType(
          context,
          { type: 'string', title: 'foo' },
          { type: 'string', title: 'bar' }
        )
      ).toEqual([{ path: [], property: 'title', expected: 'foo', actual: 'bar' }])
      expect(
        validateSchemaType(
          context,
          { type: 'string', title: 'foo' },
          { type: 'string', title: 'foo' }
        )
      ).toHaveLength(0)
      expect(
        validateSchemaType(context, { type: 'string' }, { type: 'string', title: 'bar' })
      ).toHaveLength(0)
    })

    test('validates allOf schemas', () => {
      expect(
        validateSchemaType(
          context,
          { allOf: [{ type: 'string' }, { type: 'string', maxLength: 4 }] },
          { type: 'string', maxLength: 4 }
        )
      ).toEqual([
        {
          path: [],
          property: 'allOf',
          expected: [{ type: 'string' }, { type: 'string', maxLength: 4 }],
        },
      ])
      expect(
        validateSchemaType(
          context,
          { allOf: [{ type: 'string' }, { type: 'string', maxLength: 10 }] },
          { allOf: [{ type: 'string', maxLength: 4 }] }
        )
      ).toEqual([{ path: ['allOf'], property: 'length', expected: 2, actual: 1 }])
      expect(
        validateSchemaType(
          context,
          { allOf: [{ type: 'null' }, { type: 'string', maxLength: 10 }] },
          { allOf: [{ type: 'null' }, { type: 'string', maxLength: 6 }] }
        )
      ).toHaveLength(0)
    })

    test('validates anyOf schemas', () => {
      expect(
        validateSchemaType(
          context,
          { anyOf: [{ type: 'string' }, { type: 'null' }] },
          { type: 'number' }
        )
      ).toEqual([
        { path: ['anyOf'], index: 0, expected: { type: 'string' } },
        { path: ['anyOf'], index: 1, expected: { type: 'null' } },
      ])
      expect(
        validateSchemaType(
          context,
          { anyOf: [{ type: 'string' }, { type: 'string', maxLength: 4 }] },
          { type: 'string', maxLength: 4 }
        )
      ).toHaveLength(0)
      expect(
        validateSchemaType(
          context,
          { anyOf: [{ type: 'string' }, { type: 'string', maxLength: 10 }] },
          { anyOf: [{ type: 'string', maxLength: 4 }] }
        )
      ).toHaveLength(0)
      expect(
        validateSchemaType(
          context,
          { anyOf: [{ type: 'null' }, { type: 'string', maxLength: 10 }] },
          { anyOf: [{ type: 'null' }, { type: 'string', maxLength: 6 }] }
        )
      ).toHaveLength(0)
    })

    test('validates oneOf schemas', () => {
      expect(
        validateSchemaType(
          context,
          { oneOf: [{ type: 'string' }, { type: 'string', maxLength: 4 }] },
          { type: 'string', maxLength: 4 }
        )
      ).toEqual([
        {
          path: [],
          property: 'oneOf',
          expected: [{ type: 'string' }, { type: 'string', maxLength: 4 }],
        },
      ])
      expect(
        validateSchemaType(
          context,
          { oneOf: [{ type: 'string' }, { type: 'string', maxLength: 10 }] },
          { oneOf: [{ type: 'string', maxLength: 4 }] }
        )
      ).toEqual([{ path: ['oneOf'], property: 'length', expected: 2, actual: 1 }])
      expect(
        validateSchemaType(
          context,
          { oneOf: [{ type: 'null' }, { type: 'string', maxLength: 10 }] },
          { oneOf: [{ type: 'null' }, { type: 'string', maxLength: 6 }] }
        )
      ).toHaveLength(0)
    })

    test('validates array schemas', () => {
      expect(
        validateSchemaType(
          context,
          { type: 'array', items: { type: 'string' } },
          { type: 'array', items: { type: 'number' } }
        )
      ).toEqual([{ path: ['items'], property: 'type', expected: 'string', actual: 'number' }])
      expect(
        validateSchemaType(
          context,
          { type: 'array', items: { type: 'string' } },
          { type: 'array', items: { type: 'string' } }
        )
      ).toHaveLength(0)
    })

    test('validates object schemas', () => {
      expect(
        validateSchemaType(
          context,
          { type: 'object', properties: { foo: { type: 'string' } } },
          { type: 'object', properties: { bar: { type: 'string' } } }
        )
      ).toEqual([{ path: [], property: 'properties', expected: 'foo' }])
      expect(
        validateSchemaType(
          context,
          { type: 'object', properties: { foo: { type: 'string' } } },
          { type: 'object', properties: { foo: { type: 'string' }, bar: { type: 'string' } } }
        )
      ).toHaveLength(0)
    })

    test('validates integer schemas', () => {
      expect(
        validateSchemaType(context, { type: 'integer', maximum: 5 }, { type: 'integer' })
      ).toEqual([{ path: [], property: 'maximum', expected: 5 }])
      expect(
        validateSchemaType(
          context,
          { type: 'integer', maximum: 5 },
          { type: 'integer', maximum: 4 }
        )
      ).toHaveLength(0)
    })

    test('validates number schemas', () => {
      expect(
        validateSchemaType(context, { type: 'number', maximum: 5 }, { type: 'number' })
      ).toEqual([{ path: [], property: 'maximum', expected: 5 }])
      expect(
        validateSchemaType(context, { type: 'number', maximum: 5 }, { type: 'number', maximum: 4 })
      ).toHaveLength(0)
    })

    test('validates boolean schemas', () => {
      expect(
        validateSchemaType(context, { type: 'boolean', const: true }, { type: 'boolean' })
      ).toEqual([{ path: [], property: 'const', expected: true }])
      expect(
        validateSchemaType(
          context,
          { type: 'boolean', const: true },
          { type: 'boolean', const: true }
        )
      ).toHaveLength(0)
    })

    test('supports null schemas', () => {
      expect(validateSchemaType(context, { type: 'null' }, { type: 'null' })).toHaveLength(0)
    })

    test('throws an error on invalid schema type', () => {
      expect(() => {
        validateSchemaType(context, { type: 'unknown' }, { type: 'unknown' })
      }).toThrow('Unsupported schema type: unknown')
    })
  })
})
