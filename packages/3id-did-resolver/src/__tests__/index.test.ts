jest.mock('cross-fetch', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mockedCalls = require('./vectors.json')['http-mock']
  return jest.fn(async (url, opts = {}) => ({
      ok: true,
      json: async () => {
        const call = mockedCalls[url]
        if (opts.method === 'post') {
          const result = call.find(({ expectedBody }) => opts.body === JSON.stringify(expectedBody))
          if (result?.response) {
            return result.response
          } else {
            throw new Error('Could not find response for http body: ' + opts.body)
          }
        }
        return call.response
      }
    }))
})

import ThreeIdResolver from '../index'
import { Resolver } from 'did-resolver'
import CeramicClient from '@ceramicnetwork/http-client'

const DID_LD_JSON = 'application/did+ld+json'

import vectors from './vectors.json'

const v1 = '3IDv1'
const v0 = '3IDv0'
const v0NoUpdates = '3IDv0-no-updates'

const toLdFormat = result => {
  const newResult = { ...result }
  newResult.didResolutionMetadata.contentType = DID_LD_JSON
  newResult.didDocument['@context'] = 'https://w3id.org/did/v1'
  return newResult
}

describe('3ID DID Resolver', () => {
  jest.setTimeout(20000)
  let ceramic

  beforeAll(async () => {
    ceramic = new CeramicClient()
  })

  describe('3IDv1', () => {
    test('getResolver works correctly', async () => {
      const threeIdResolver = ThreeIdResolver.getResolver(ceramic)
      expect(Object.keys(threeIdResolver)).toEqual(['3'])
    })

    test.each(vectors[v1].queries)('resolves 3id documents correctly %#', async (query) => {
      const threeIdResolver = ThreeIdResolver.getResolver(ceramic)
      const resolver = new Resolver(threeIdResolver)
      const did = vectors[v1].did + query.params[0]
      expect(await resolver.resolve(did)).toEqual(query.result)
      if (query.params[1]) {
        const didVTime = vectors[v1].did + query.params[1]
        expect(await resolver.resolve(didVTime)).toEqual(query.result)
      }
      expect(await resolver.resolve(did, { accept: DID_LD_JSON })).toEqual(toLdFormat(query.result))
    })
  })

  describe('3IDv0', () => {
    test('resolves 3id with no updates', async () => {
      const threeIdResolver = ThreeIdResolver.getResolver(ceramic)
      const resolver = new Resolver(threeIdResolver)
      const query = vectors[v0NoUpdates].query
      const did = vectors[v0NoUpdates].did + query.params[0]
      expect(await resolver.resolve(did)).toEqual(query.result)
    })

    test.each(vectors[v0].queries)('resolves 3id documents correctly %#', async (query) => {
      const threeIdResolver = ThreeIdResolver.getResolver(ceramic)
      const resolver = new Resolver(threeIdResolver)
      const did = vectors[v0].did + query.params[0]
      expect(await resolver.resolve(did)).toEqual(query.result)
      if (query.params[1]) {
        const didVTime = vectors[v0].did + query.params[1]
        expect(await resolver.resolve(didVTime)).toEqual(query.result)
      }
      expect(await resolver.resolve(did, { accept: DID_LD_JSON })).toEqual(toLdFormat(query.result))
    })
  })
})
