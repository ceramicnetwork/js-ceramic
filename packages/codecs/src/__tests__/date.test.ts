import { validate, isRight, type Right } from 'codeco'

import { date } from '../date.js'

describe('date', () => {
  const isoString = '2022-12-13T14:15:16.789Z'
  const now = new Date(isoString)

  describe('decode', () => {
    test('from ISO string', () => {
      const decoded = validate(date, isoString)
      expect(isRight(decoded)).toBeTruthy()
      expect((decoded as Right<Date>).right).toEqual(now)
    })
    test('from JS Date', () => {
      const decoded = validate(date, now)
      expect(isRight(decoded)).toBeTruthy()
      expect((decoded as Right<Date>).right).toEqual(now)
    })
  })
  test('encode', () => {
    expect(date.encode(now)).toEqual(isoString)
  })
})
