import { collectionQuery, parsePagination } from '../collection-query.js'
import { StreamID } from '@ceramicnetwork/streamid'
import { TestUtils } from '@ceramicnetwork/common'

const DEFAULT_PAGINATION = { first: Math.floor(Math.random() * 100) }

describe('parsePagination', () => {
  test('parse forward pagination', () => {
    const query = { first: 10, after: 'foo', bar: 'baz', before: 'blah' }
    expect(parsePagination(query, DEFAULT_PAGINATION)).toEqual({ first: 10, after: 'foo' })
  })
  test('parse backward pagination', () => {
    const query = { last: 10, before: 'foo', bar: 'baz', after: 'blah' }
    expect(parsePagination(query, DEFAULT_PAGINATION)).toEqual({ last: 10, before: 'foo' })
  })
  test('prefer forward', () => {
    expect(parsePagination({ first: 10, last: 10 }, DEFAULT_PAGINATION)).toEqual({ first: 10 })
  })
  test('use default', () => {
    // Empty input
    expect(parsePagination({}, DEFAULT_PAGINATION)).toEqual(DEFAULT_PAGINATION)
    // Non-integer first
    expect(parsePagination({ first: 0.3 }, DEFAULT_PAGINATION)).toEqual(DEFAULT_PAGINATION)
    // Negative first
    expect(parsePagination({ first: -10 }, DEFAULT_PAGINATION)).toEqual(DEFAULT_PAGINATION)
    // Non-integer last
    expect(parsePagination({ last: 0.3 }, DEFAULT_PAGINATION)).toEqual(DEFAULT_PAGINATION)
    // Negative last
    expect(parsePagination({ last: -10 }, DEFAULT_PAGINATION)).toEqual(DEFAULT_PAGINATION)
  })
})

describe('collectionQuery', () => {
  const model = new StreamID(1, TestUtils.randomCID())
  test('parse model', () => {
    const parsed = collectionQuery({ first: 10, model: model.toString() }, DEFAULT_PAGINATION)
    expect(parsed).toEqual({ first: 10, model: model })
  })
  test('throw on invalid model', () => {
    expect(() => {
      collectionQuery({ first: 10, model: 'garbage' }, DEFAULT_PAGINATION)
    }).toThrow()
  })
  test('pass account', () => {
    const parsed = collectionQuery(
      { first: 10, model: model.toString(), account: 'did:key:foo' },
      DEFAULT_PAGINATION
    )
    expect(parsed).toEqual({ first: 10, model: model, account: 'did:key:foo' })
  })
})
