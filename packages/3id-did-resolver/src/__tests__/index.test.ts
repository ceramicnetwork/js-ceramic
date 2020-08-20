import ThreeIdResolver from '../index'
import { Resolver } from 'did-resolver'

const ceramicMock = {
  loadDocument: async (): Promise<any> => ({
    content: {
      publicKeys: {
        signing: 'zQ3shwsCgFanBax6UiaLu1oGvM7vhuqoW88VBUiUTCeHbTeTV',
        encryption: 'z6LSfQabSbJzX8WAm1qdQcHCHTzVv8a2u6F7kmzdodfvUCo9'
      }
    }
  })
}

const ceramicMockOld = { // to be removed
  loadDocument: async (): Promise<any> => ({
    content: {
      publicKeys: {
        signing: 'fake signing key',
        encryption: 'fake encryption key'
      }
    }
  })
}

const ceramicMockWithIDX = {
  loadDocument: async (): Promise<any> => ({
    content: {
      publicKeys: {
        signing: 'zQ3shwsCgFanBax6UiaLu1oGvM7vhuqoW88VBUiUTCeHbTeTV',
        encryption: 'z6LSfQabSbJzX8WAm1qdQcHCHTzVv8a2u6F7kmzdodfvUCo9'
      },
      idx: 'ceramic://rootId'
    }
  })
}

describe('3ID DID Resolver', () => {

  it('getResolver works correctly', async () => {
    const threeIdResolver = ThreeIdResolver.getResolver(ceramicMock)
    expect(Object.keys(threeIdResolver)).toEqual(['3'])
  })

  it('resolver works correctly (old format)', async () => {
    const threeIdResolver = ThreeIdResolver.getResolver(ceramicMockOld)
    const resolver = new Resolver(threeIdResolver)
    const fake3ID = 'did:3:bafyiuh3f97hqef97h'
    expect(await resolver.resolve(fake3ID)).toMatchSnapshot()
  })

  it('resolves 3id document correctly', async () => {
    const threeIdResolver = ThreeIdResolver.getResolver(ceramicMock)
    const resolver = new Resolver(threeIdResolver)
    const fake3ID = 'did:3:bafyiuh3f97hqef97h'
    expect(await resolver.resolve(fake3ID)).toMatchSnapshot()
  })

  it('adds IDX root as service', async () => {
    const threeIdResolver = ThreeIdResolver.getResolver(ceramicMockWithIDX)
    const resolver = new Resolver(threeIdResolver)
    const fake3ID = 'did:3:bafyiuh3f97hqef97h'
    expect(await resolver.resolve(fake3ID)).toMatchSnapshot()
  })
})
