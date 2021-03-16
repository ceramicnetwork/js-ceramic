jest.mock('cross-fetch', () => {
  const mockedCalls = require('./vectors.json')['http-mock']
  return jest.fn(async (url, opts) => ({
      ok: true,
      json: async () => {
        const call = mockedCalls[url]
        console.log('u', url)
        if (call.expectedBody && (
            opts.method !== 'post' ||
            opts.body !== JSON.stringify(call.expectedBody)
        )) {
          throw new Error('invalid http request for mock')
        }
        return call.response
      }
    }))
})
import fetch from 'cross-fetch'

import ThreeIdResolver from '../index'
import { Resolver } from 'did-resolver'
import DocID from '@ceramicnetwork/docid'
import CeramicClient from '@ceramicnetwork/http-client'

const DID_LD_JSON = 'application/did+ld+json'

const vectors = require('./vectors.json')

const v1 = '3IDv1'
const v0 = '3IDv0'

const toLdFormat = result => {
  const newResult = { ...result }
  newResult.didResolutionMetadata.contentType = DID_LD_JSON
  newResult.didDocument['@context'] = 'https://w3id.org/did/v1'
  return newResult
}

describe('3ID DID Resolver', () => {
  jest.setTimeout(10000)
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
      expect(await resolver.resolve(did, { accept: DID_LD_JSON })).toEqual(toLdFormat(query.result))
    })
  })

  describe('3IDv0', () => {
    test.each(vectors[v0].queries)('resolves 3id documents correctly %#', async (query) => {
      const threeIdResolver = ThreeIdResolver.getResolver(ceramic)
      const resolver = new Resolver(threeIdResolver)
      const did = vectors[v0].did + query.params[0]
      const res = await resolver.resolve(did)
      console.log('resu', JSON.stringify(res))
      expect(res).toEqual(query.result)
      expect(await resolver.resolve(did, { accept: DID_LD_JSON })).toEqual(toLdFormat(query.result))
    })
  })
})
