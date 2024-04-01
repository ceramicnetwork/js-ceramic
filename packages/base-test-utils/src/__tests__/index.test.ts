import { BaseTestUtils } from '../index.js'

describe('BaseTestUtils', () => {
  it('should generate a random CID', () => {
    expect(BaseTestUtils.randomCID().version).toEqual(1)
  })
})

describe('waitForConditionOrTimeout errmsg generation', () => {
  const failPredicate = () => Promise.resolve(false)

  it('default errmsg', async () => {
    await expect(BaseTestUtils.waitForConditionOrTimeout(failPredicate, 1)).rejects.toThrow(
      'timed out after 1ms waiting for condition to be true'
    )
  })

  it('specific errmsg', async () => {
    await expect(
      BaseTestUtils.waitForConditionOrTimeout(failPredicate, 1, 'custom errmsg')
    ).rejects.toThrow('timed out after 1ms waiting for condition to be true: custom errmsg')
  })

  it('generated errmsg', async () => {
    await expect(
      BaseTestUtils.waitForConditionOrTimeout(failPredicate, 1, () => 'generated errmsg')
    ).rejects.toThrow('timed out after 1ms waiting for condition to be true: generated errmsg')
  })
})
