import { DID } from 'dids'
import { CID } from 'multiformats/cid'
import { jest } from '@jest/globals'
import { fetchJson, CommitType, StreamState } from '@ceramicnetwork/common'
import { CeramicClient } from '../ceramic-http-client.js'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { randomBytes } from '@stablelib/random'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import KeyResolver from 'key-did-resolver'

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

describe('URL constructor', () => {
  test('build instances of Streamtype from URLs with extensions', async () => {
    for (const URL of API_URLS) {
      const client = new CeramicClient(URL)
      const a = client.buildStreamFromState(initial)
      expect(a).toBeInstanceOf(TileDocument)
      expect(a.id.cid).toEqual(FAKE_CID_1)
    }
  })
  test('setDID()', async () => {
    for (const URL of API_URLS) {
      const seed = randomBytes(32)
      const provider = new Ed25519Provider(seed)
      const actingDid = new DID({ provider, resolver: KeyResolver.getResolver() })
      await actingDid.authenticate()
      const did = actingDid
      const client = new CeramicClient(URL)
      const getDidFn = () => {
        return did
      }
      client.did = getDidFn()
      expect(client.did).toEqual(getDidFn())
    }
  })
  test('getSupportedChains()', async () => {
    for (const API_URL of API_URLS) {
      const client = new CeramicClient(API_URL)

      const fauxFetch = jest.fn(async () => GET_RESPONSE) as typeof fetchJson
      ;(client as any)._fetchJson = fauxFetch

      await client.getSupportedChains()
      expect(fauxFetch.mock.calls[0][0]).toEqual(new URL('./api/v0/node/chains', API_URL))
    }
  })
  test('requestAnchor()', async () => {
    for (const API_URL of API_URLS) {
      const client = new CeramicClient(API_URL)
      const a = client.buildStreamFromState(initial)

      const fauxFetch = jest.fn(async () => GET_RESPONSE) as typeof fetchJson
      ;(client as any)._fetchJson = fauxFetch

      await client.requestAnchor(a.id)
      expect(fauxFetch.mock.calls[0][0].toString()).toEqual(
        new URL(`./api/v0/streams/${a.id}/anchor`, API_URL).toString()
      )
    }
  })
})
