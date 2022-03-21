import { jest } from '@jest/globals'
import { readFileSync } from 'node:fs'

const VECTORS_PATH = new URL('./vectors.json', import.meta.url)
const vectors = JSON.parse(readFileSync(VECTORS_PATH, 'utf-8'))

jest.unstable_mockModule('cross-fetch', () => {
  const mockedCalls = vectors['http-mock']
  const fetchFunc = jest.fn(async (url: string, opts: any = {}) => ({
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
    },
  }))
  return {
    default: fetchFunc
  }
})

import { Resolver } from 'did-resolver'

const DID_LD_JSON = 'application/did+ld+json'
const v1 = '3IDv1'
const v1unanchored = '3IDv1-unanchored'
const v0 = '3IDv0'
const v0NoUpdates = '3IDv0-no-updates'

const toLdFormat = (result) => {
  const newResult = { ...result }
  newResult.didResolutionMetadata.contentType = DID_LD_JSON
  newResult.didDocument['@context'] = 'https://www.w3.org/ns/did/v1'
  return newResult
}

describe('3ID DID Resolver', () => {
  jest.setTimeout(20000)
  let ceramic

  beforeAll(async () => {
    const { CeramicClient } = await import('@ceramicnetwork/http-client')
    ceramic = new CeramicClient()
  })

  describe('3IDv1', () => {
    test('getResolver works correctly', async () => {
      const ThreeIdResolver = await import('../index.js')
      const threeIdResolver = ThreeIdResolver.getResolver(ceramic)
      expect(Object.keys(threeIdResolver)).toEqual(['3'])
    })

    test.each(vectors[v1].queries)('resolves 3id documents correctly %#', async (query) => {
      const ThreeIdResolver = await import('../index.js')
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

    test.each(vectors[v1unanchored].queries)(
      'resolves unanchored 3id documents correctly %#',
      async (query) => {
        const ThreeIdResolver = await import('../index.js')
        const threeIdResolver = ThreeIdResolver.getResolver(ceramic)
        const resolver = new Resolver(threeIdResolver)
        const did = vectors[v1unanchored].did + query.params[0]
        expect(await resolver.resolve(did)).toEqual(query.result)
        expect(await resolver.resolve(did, { accept: DID_LD_JSON })).toEqual(
          toLdFormat(query.result)
        )
      }
    )

    test('no commit found', async () => {
      const ThreeIdResolver = await import('../index.js')
      const threeIdResolver = ThreeIdResolver.getResolver(ceramic)
      const resolver = new Resolver(threeIdResolver)
      const did =
        'did:3:kjzl6cwe1jw1490n1846tytf2fypoqb8aokqxl6n0lgyp1undfilllca3ztltho?version-id=0'
      await expect(resolver.resolve(did)).resolves.toEqual({
        didResolutionMetadata: {
          error: 'invalidDid',
          message:
            'Error: No resolution for commit k3y52l7qbv1fry84jsppsl3l75diunv3uzyrjiun7o8omq55y7ic9ljrbweqj5pmo',
        },
        didDocument: null,
        didDocumentMetadata: {},
      })
    })
  })

  describe('3IDv0', () => {
    test('resolves 3id with no updates', async () => {
      const ThreeIdResolver = await import('../index.js')
      const threeIdResolver = ThreeIdResolver.getResolver(ceramic)
      const resolver = new Resolver(threeIdResolver)
      const query = vectors[v0NoUpdates].query
      const did = vectors[v0NoUpdates].did + query.params[0]
      expect(await resolver.resolve(did)).toEqual(query.result)
    })

    test.each(vectors[v0].queries)('resolves 3id documents correctly %#', async (query) => {
      const ThreeIdResolver = await import('../index.js')
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
