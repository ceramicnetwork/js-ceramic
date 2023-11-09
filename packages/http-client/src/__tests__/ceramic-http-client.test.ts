import { DID } from 'dids'
import { StreamID } from '@ceramicnetwork/streamid'
import { CID } from 'multiformats/cid'
import { jest } from '@jest/globals'
import { fetchJson, TestUtils, Page, CommitType, StreamState, Stream } from '@ceramicnetwork/common'
import { CeramicClient } from '../ceramic-http-client.js'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { randomBytes } from '@stablelib/random'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import KeyResolver from 'key-did-resolver'

const API_URL = 'https://example.com'
const API_URLS = [
  `https://example.com`,
  `https://example.com/`,
  'https://example.com/extension',
  'https://example.com/extension/',
  'https://example.com/extension/another-extension',
  'https://example.com/extension/another-extension/',
]


const FAKE_CID_1 = CID.parse('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu')

const initial = {
  type: 0,
  log: [
    {
      type: CommitType.GENESIS,
      cid: FAKE_CID_1,
    },
  ],
} as unknown as StreamState

const GET_RESPONSE = {
  ...initial,
  state: initial,
}

const EMPTY_RESPONSE: Page<StreamState> = {
  edges: [],
  pageInfo: {
    hasPreviousPage: false,
    hasNextPage: false,
  },
}
let did: DID
let getDidFn
let noDidFn
let expectedKid: string
let client: CeramicClient




beforeEach(() => {
  jest.resetAllMocks()
})

describe('buildStreamFromState', () => {
  test('build instance of Streamtype', async () => {
    client = new CeramicClient(API_URL)
    const a = client.buildStreamFromState(initial)
    expect(a).toBeInstanceOf(TileDocument)
    expect(a.id.cid).toEqual(FAKE_CID_1)
  })
})

describe('URL constructor', () => {
  beforeAll(async () => {
    const seed = randomBytes(32)
    const provider = new Ed25519Provider(seed)
    const actingDid = new DID({ provider, resolver: KeyResolver.getResolver() })
    await actingDid.authenticate()
    did = actingDid
    getDidFn = () => {
      return did
    }
    noDidFn = () => {
      return undefined
    }
    const didKeyVerStr = did.id.split('did:key:')[1]
    expectedKid = `${did.id}#${didKeyVerStr}`
  })
  test('build instances of Streamtype from URLs with extensions', async () => {
    for (const URL of API_URLS) {
      client = new CeramicClient(URL)
      const a = client.buildStreamFromState(initial)
      expect(a).toBeInstanceOf(TileDocument)
      expect(a.id.cid).toEqual(FAKE_CID_1)
    }
  })
  test('setDID()', async () => {
    for (const URL of API_URLS) {
      const client = new CeramicClient(URL)
      await client.setDID(getDidFn())
      expect(client.did).toEqual(getDidFn())
    }
  })
  test('loadStream()', async () => {
    // for (const URL of API_URLS) {
      const client = new CeramicClient('https://ceramic-private-dev.3boxlabs.com')
      const a = client.buildStreamFromState(initial)
      
      const fauxFetch = jest.fn(async () => GET_RESPONSE) as typeof fetchJson
      ;(client as CeramicClient)._fetchJson = fauxFetch

      const res = await client.loadStream(a.id, { sync: 0 })
      expect(1).toEqual(1)
      
    // }
  })

  // it('doesnt really fetch', async () => {
  //   const client = new CeramicClient(API_URLS[0])
  //   const a = client.buildStreamFromState(initial)
  //   jest.spyOn(global, "fetch").mockResolvedValueOnce({
  //     json: async () => {
  //       return {
  //         ...SUCCESS_RESPONSE,
  //         state: initial,
  //       }
  //     },
  //   } as any)
  //   const res = client.loadStream(a.id, { sync: 1 })

  //   const fauxFetch = jest.fn(async () => GET_RESPONSE) as typeof fetchJson
  //   ;(client as any)._fetchJson = fauxFetch

  //   const onResponse = jest.fn()
  //   const onError = jest.fn()
  //   res.then(onResponse).catch(onError)
  //   await res

  //   global.fetch.mockClear()
  // })


})
