import { DidTestUtils } from '../index.ts'

describe('DidTestUtils', () => {
  it('should create a did', () => {
    expect(DidTestUtils.generateDID()).toMatchSnapshot
  })
})
