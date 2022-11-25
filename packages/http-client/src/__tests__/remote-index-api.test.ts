import { jest } from '@jest/globals'
import { RemoteIndexApi } from '../remote-index-api.js'
import { CommitType, fetchJson, Page, StreamState, TestUtils } from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'

const FAUX_ENDPOINT = new URL('https://example.com')
const MODEL = new StreamID(1, TestUtils.randomCID())

const EMPTY_RESPONSE: Page<StreamState> = {
  edges: [],
  pageInfo: {
    hasPreviousPage: false,
    hasNextPage: false,
  },
}
const FAUX_STREAM_STATE = {
  type: 0,
  log: [
    {
      type: CommitType.GENESIS,
      cid: TestUtils.randomCID(),
    },
  ],
} as unknown as StreamState

test('model in query', async () => {
  const fauxFetch = jest.fn(async () => EMPTY_RESPONSE) as typeof fetchJson
  const indexApi = new RemoteIndexApi(FAUX_ENDPOINT)
  ;(indexApi as any)._fetchJson = fauxFetch
  const result = await indexApi.query({ model: MODEL, first: 5 })
  expect(result).toEqual(EMPTY_RESPONSE)
  expect(fauxFetch).toBeCalledWith(new URL(`https://example.com/collection`), {
    method: 'POST',
    body: {
      model: MODEL.toString(),
      first: 5,
    },
  })
})

test('model, account in query', async () => {
  const fauxFetch = jest.fn(async () => EMPTY_RESPONSE) as typeof fetchJson
  const indexApi = new RemoteIndexApi(FAUX_ENDPOINT)
  ;(indexApi as any)._fetchJson = fauxFetch
  const account = 'did:key:foo'
  const result = await indexApi.query({ model: MODEL, account, first: 5 })
  expect(result).toEqual(EMPTY_RESPONSE)
  expect(fauxFetch).toBeCalledWith(new URL(`https://example.com/collection`), {
    method: 'POST',
    body: { model: MODEL.toString(), first: 5, account },
  })
})

test('serialize stream state', async () => {
  const response: Page<StreamState> = {
    ...EMPTY_RESPONSE,
    edges: [
      {
        cursor: 'some-opaque-string',
        node: FAUX_STREAM_STATE,
      },
    ],
  }
  const fauxFetch = jest.fn(async () => response) as typeof fetchJson
  const indexApi = new RemoteIndexApi(FAUX_ENDPOINT)
  ;(indexApi as any)._fetchJson = fauxFetch
  const result = await indexApi.query({ model: MODEL, account: 'did:key:foo', first: 5 })
  expect(result.edges[0].node).toEqual(FAUX_STREAM_STATE)
})
