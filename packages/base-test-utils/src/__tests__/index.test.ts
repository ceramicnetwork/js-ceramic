import { BaseTestUtils } from '../index.js'

describe('BaseTestUtils', () => {
  it('should generate a random CID', () => {
    expect(BaseTestUtils.randomCID().version).toEqual(1)
  })
})
