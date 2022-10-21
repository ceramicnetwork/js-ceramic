import { serializeObjectToSearchParams } from '../utils.js'

describe('serializeObjectToSearchParams', () => {
  test('do not modify input URL', () => {
    const originalHref = 'http://example.com/collection'
    const original = new URL(originalHref)
    const result = serializeObjectToSearchParams(original, { hello: 'world' })
    expect(original.href).toEqual(originalHref)
    expect(result.href).toEqual(`${originalHref}?hello=world`)
  })
})
