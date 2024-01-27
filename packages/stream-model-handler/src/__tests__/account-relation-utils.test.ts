import { validateSetFields } from '../account-relations-utils.js'

describe('validateSetFields()', () => {
  test('throws if no fields are defined', () => {
    expect(() => {
      validateSetFields([], { type: 'object' })
    }).toThrow('At least one field must be defined for the SET account relation')
  })

  test('throws if a field is missing', () => {
    let error: Error = new Error('Test failed')
    try {
      validateSetFields(['one', 'two'], {
        type: 'object',
        properties: { one: { type: 'string' } },
        required: ['one', 'two'],
      })
    } catch (err) {
      error = err
    }
    expect(error.message).toBe('Invalid schema fields for SET account relation')
    expect(error.errors[0].message).toBe('Field not found in schema: two')
  })

  test('throws if a field type is missing', () => {
    let error: Error = new Error('Test failed')
    try {
      validateSetFields(['one', 'two'], {
        type: 'object',
        properties: { one: { type: 'string' }, two: {} },
        required: ['one', 'two'],
      })
    } catch (err) {
      error = err
    }
    expect(error.message).toBe('Invalid schema fields for SET account relation')
    expect(error.errors[0].message).toBe('Missing type for field: two')
  })

  test('throws if an unsupported type is used', () => {
    let error: Error = new Error('Test failed')
    try {
      validateSetFields(['one', 'two'], {
        type: 'object',
        properties: { one: { type: 'array' }, two: { type: 'object' } },
        required: ['one', 'two'],
      })
    } catch (err) {
      error = err
    }
    expect(error.message).toBe('Invalid schema fields for SET account relation')
    expect(error.errors[0].message).toBe(
      'Unsupported type array for field one set in the account relation, only the following types are supported: boolean, integer, number, string'
    )
    expect(error.errors[1].message).toBe(
      'Unsupported type object for field two set in the account relation, only the following types are supported: boolean, integer, number, string'
    )
  })

  test('throws if a relation field is not required', () => {
    let error: Error = new Error('Test failed')
    try {
      validateSetFields(['one', 'two'], {
        type: 'object',
        properties: { one: { type: 'string' }, two: { type: 'string' } },
      })
    } catch (err) {
      error = err
    }
    expect(error.message).toBe('Invalid schema fields for SET account relation')
    expect(error.errors[0].message).toBe(
      'Field one must be required to be used for the SET account relation'
    )
    expect(error.errors[1].message).toBe(
      'Field two must be required to be used for the SET account relation'
    )
  })

  test('supports boolean type', () => {
    expect(() => {
      validateSetFields(['one', 'two'], {
        type: 'object',
        properties: { one: { type: 'boolean' }, two: { $ref: '#/$defs/refSchema' } },
        required: ['one', 'two'],
        $defs: { refSchema: { type: 'boolean' } },
      })
    }).not.toThrow()
  })

  test('supports integer type', () => {
    expect(() => {
      validateSetFields(['one', 'two'], {
        type: 'object',
        properties: { one: { type: 'integer' }, two: { $ref: '#/$defs/refSchema' } },
        required: ['one', 'two'],
        $defs: { refSchema: { type: 'integer' } },
      })
    }).not.toThrow()
  })

  test('supports number type', () => {
    expect(() => {
      validateSetFields(['one', 'two'], {
        type: 'object',
        properties: { one: { type: 'number' }, two: { $ref: '#/$defs/refSchema' } },
        required: ['one', 'two'],
        $defs: { refSchema: { type: 'number' } },
      })
    }).not.toThrow()
  })

  test('supports string type', () => {
    expect(() => {
      validateSetFields(['one', 'two'], {
        type: 'object',
        properties: { one: { type: 'string' }, two: { $ref: '#/$defs/refSchema' } },
        required: ['one', 'two'],
        $defs: { refSchema: { type: 'string' } },
      })
    }).not.toThrow()
  })
})
