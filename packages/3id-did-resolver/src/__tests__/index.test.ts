import { getResolver } from '../index'
import { Resolver } from 'did-resolver'

const ceramicMock = {
  loadDocument: async (): Promise<any> => ({
    content: {
      publicKeys: {
        signing: 'fake signing key',
        encryption: 'fake encryption key',
      },
    },
  }),
}

const ceramicMockWithIDX = {
  loadDocument: async (): Promise<any> => ({
    content: {
      publicKeys: {
        signing: 'fake signing key',
        encryption: 'fake encryption key',
      },
      idx: 'ceramic://rootId',
    },
  }),
}

describe('3ID DID Resolver', () => {
  it('getResolver works correctly', async () => {
    const threeIdResolver = getResolver(ceramicMock)
    expect(Object.keys(threeIdResolver)).toEqual(['3'])
  })

  it('resolver works correctly', async () => {
    const threeIdResolver = getResolver(ceramicMock)
    const resolver = new Resolver(threeIdResolver)
    const fake3ID = 'did:3:bafyiuh3f97hqef97h'
    expect(await resolver.resolve(fake3ID)).toMatchSnapshot()
  })

  it('resolver adds IDX root as service', async () => {
    const threeIdResolver = getResolver(ceramicMockWithIDX)
    const resolver = new Resolver(threeIdResolver)
    const fake3ID = 'did:3:bafyiuh3f97hqef97h'
    expect(await resolver.resolve(fake3ID)).toMatchSnapshot()
  })
})
