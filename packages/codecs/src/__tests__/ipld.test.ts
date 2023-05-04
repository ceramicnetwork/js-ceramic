import { describe, test, expect } from '@jest/globals'
import { validate, isRight, type Right } from 'codeco'
import type { CID } from 'multiformats/cid'

import { cidAsString } from '../ipld.js'

import { randomCID } from './test-utils.js'

describe('cidAsString', () => {
  const cid = randomCID()
  test('decode: ok', () => {
    const result = validate(cidAsString, cid.toString())
    expect(isRight(result)).toEqual(true)
    expect((result as Right<CID>).right).toEqual(cid)
  })
  test('decode: not ok', () => {
    const result = validate(cidAsString, 'garbage')
    expect(isRight(result)).toEqual(false)
  })
  test('encode', () => {
    const result = cidAsString.encode(cid)
    expect(result).toEqual(cid.toString())
  })
})
