import { CeramicCliUtils } from '../ceramic-cli-utils'
import assert from 'assert'

describe('Remove undefined fields helper', () => {
  test('top level', () => {
    const obj = CeramicCliUtils.removeUndefinedFields({ a: 1, b: null, c: undefined })
    assert.deepStrictEqual(obj, {
      a: 1,
      b: null,
    })
  })

  test('one level nesting', () => {
    const obj = CeramicCliUtils.removeUndefinedFields({
      a: 0,
      b: undefined,
      nested: { foo: 'hi', bar: null, baz: undefined },
    })

    assert.deepStrictEqual(obj, {
      a: 0,
      nested: {
        foo: 'hi',
        bar: null,
      },
    })
  })

  test('multi-level nesting', () => {
    const obj = CeramicCliUtils.removeUndefinedFields({
      a: 0,
      nested: { foo: null, doubleNested: { hello: 'world', skip: undefined } },
    })
    assert.deepStrictEqual(obj, {
      a: 0,
      nested: {
        foo: null,
        doubleNested: { hello: 'world' },
      },
    })
  })
})
