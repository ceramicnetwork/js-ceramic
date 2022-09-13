import { base64urlToJSON, JSONToBase64Url } from '../utils/uint8array-utils.js'

describe('utils', () => {
  test('base64Url encoding round-trip', () => {
    const obj = {
      a: 1,
      b: '1',
      c: 'one',
      d: [0, '1', 'two'],
      e: { one: 1, two: '2', three: 'three' },
    }

    const base64Str = JSONToBase64Url(obj)

    const decodedObj = base64urlToJSON(base64Str)

    expect(decodedObj).toEqual(obj)
  })
})
