import { CommonTestUtils } from '../index.js'

describe('CommonTestUtils', () => {
  it('makes a stream state', () => {
    expect(CommonTestUtils.makeStreamState().type).toEqual(0)
  })
})
