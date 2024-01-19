import { BaseTestUtils } from '../index.ts'

describe('BaseTestUtils', () => {
  it('should generate a random CID', () => {
    expect(BaseTestUtils.randomCID().version).toEqual(1)
  })
})
