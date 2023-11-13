import { collectionQuery, InvalidPaginationError, parsePagination } from '../collection-queries.js'
import { StreamID } from '@ceramicnetwork/streamid'
import { TestUtils } from '@ceramicnetwork/common'

describe('parsePagination', () => {
  test('parse forward pagination', () => {
    const query = { first: 10, after: 'foo', bar: 'baz', before: 'blah' }
    expect(parsePagination(query)).toEqual({ first: 10, after: 'foo' })
  })
  test('parse backward pagination', () => {
    const query = { last: 10, before: 'foo', bar: 'baz', after: 'blah' }
    expect(parsePagination(query)).toEqual({ last: 10, before: 'foo' })
  })
  test('prefer forward', () => {
    expect(parsePagination({ first: 10, last: 10 })).toEqual({ first: 10 })
  })
  test('throw if can not parse', () => {
    // Empty input
    expect(() => parsePagination({})).toThrow(InvalidPaginationError)
    // Non-integer first
    expect(() => parsePagination({ first: 0.3 })).toThrow(InvalidPaginationError)
    // Negative first
    expect(() => parsePagination({ first: -10 })).toThrow(InvalidPaginationError)
    // Non-integer last
    expect(() => parsePagination({ last: 0.3 })).toThrow(InvalidPaginationError)
    // Negative last
    expect(() => parsePagination({ last: -10 })).toThrow(InvalidPaginationError)
  })
})

describe('collectionQuery', () => {
  const models = [new StreamID(1, TestUtils.randomCID()).toString()]
  test('parse model', () => {
    const parsed = collectionQuery({ first: 10, models })
    expect(parsed).toEqual({ first: 10, models })
  })
  test('pass account', () => {
    const parsed = collectionQuery({ first: 10, models, account: 'did:key:foo' })
    expect(parsed).toEqual({ first: 10, models, account: 'did:key:foo' })
  })
})
