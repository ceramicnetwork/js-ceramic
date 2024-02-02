import { DidTestUtils } from '../index.js'

describe('DidTestUtils', () => {
  it('should create a did', async () => {
    expect(await DidTestUtils.generateDID({})).toMatchSnapshot
  })
})
