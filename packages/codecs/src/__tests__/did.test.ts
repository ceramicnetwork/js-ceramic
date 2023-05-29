import { describe, expect, test } from '@jest/globals'
import { validate, isRight } from 'codeco'

import { didString, isDIDString } from '../did.js'

describe('isDIDString', () => {
  test('ok', () => {
    expect(isDIDString('did:method:foo')).toBeTruthy()
  })
  test('not ok', () => {
    // @ts-ignore `null` goes against TS types
    expect(isDIDString(null)).toBeFalsy()
    // @ts-ignore `undefined` goes against TS types
    expect(isDIDString(undefined)).toBeFalsy()
    expect(isDIDString('')).toBeFalsy()
    expect(isDIDString('did:method')).toBeFalsy()
    expect(isDIDString('did:method:id#fragment')).toBeFalsy()
  })
})

describe('didString', () => {
  test('ok', () => {
    expect(isRight(validate(didString, 'did:method:foo'))).toBeTruthy()
  })
  test('fail', () => {
    expect(isRight(validate(didString, null))).toBeFalsy()
    expect(isRight(validate(didString, undefined))).toBeFalsy()
    expect(isRight(validate(didString, ''))).toBeFalsy()
    expect(isRight(validate(didString, 'did:method'))).toBeFalsy()
    expect(isRight(validate(didString, 'did:method:id#fragment'))).toBeFalsy()
    expect(isRight(validate(didString, 'garbage'))).toBeFalsy()
  })
})
