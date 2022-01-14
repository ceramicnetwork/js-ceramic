import { CID } from 'multiformats/cid'
import {
  CeramicCommit,
  CommitType,
  StreamState,
  StreamUtils,
  TestUtils,
} from '@ceramicnetwork/common'
import { Document } from '../document.js'
import { CeramicClient } from '../ceramic-http-client.js'
import { StreamID } from '@ceramicnetwork/streamid'
import { TileDocument } from '@ceramicnetwork/stream-tile'

const API_URL = 'https://example.com'
const FAKE_CID_1 = CID.parse('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_CID_2 = CID.parse('bafybeig6xv5nwphfmvcnektpnojts44jqcuam7bmye2pb54adnrtccjlsu')
const initial = {
  type: 0,
  log: [
    {
      type: CommitType.GENESIS,
      cid: FAKE_CID_1,
    },
  ],
} as unknown as StreamState
const second = {
  ...initial,
  log: [
    ...initial.log,
    {
      type: CommitType.SIGNED,
      cid: FAKE_CID_2,
    },
  ],
} as unknown as StreamState
const streamId = new StreamID(0, FAKE_CID_1)

describe('applyCommit', () => {
  describe('document not in cache', () => {
    test('add to cache', async () => {
      const document = new Document(initial, API_URL, 1000)
      Document.applyCommit = jest.fn(async () => document)

      const client = new CeramicClient(API_URL)
      const streamCache = (client as any)._streamCache as Map<string, Document>
      expect(streamCache.size).toEqual(0)
      const commit = {} as CeramicCommit
      await client.applyCommit(streamId, commit)
      expect(streamCache.size).toEqual(1)
      expect(streamCache.get(document.id.toString())).toBe(document)
    })
  })

  describe('document in cache', () => {
    test('update existing document', async () => {
      const document1 = new Document(initial, API_URL, 1000)
      const document2 = new Document(second, API_URL, 1000)
      Document.applyCommit = jest.fn(async () => document2)

      const client = new CeramicClient(API_URL)
      const streamCache = (client as any)._streamCache as Map<string, Document>
      expect(streamCache.size).toEqual(0)
      streamCache.set(document1.id.toString(), document1)

      const commit = {} as CeramicCommit
      await client.applyCommit(streamId, commit)
      expect(streamCache.size).toEqual(1)
      const cachedDocument = streamCache.get(document1.id.toString())
      expect(cachedDocument).toBe(document1)
      expect(cachedDocument.state).toBe(document2.state)
    })
    test('emit update', async () => {
      const document1 = new Document(initial, API_URL, 1000)
      const document2 = new Document(second, API_URL, 1000)
      Document.applyCommit = jest.fn(async () => document2)

      const client = new CeramicClient(API_URL)
      const streamCache = (client as any)._streamCache as Map<string, Document>
      // Prepopulate the cache
      streamCache.set(document1.id.toString(), document1)
      // Accessor for TestUtils.waitForState
      const tile = new TileDocument(document1, {})

      // Make sure it does not do HTTP requests
      document1._syncState = jest.fn()

      const commit = {} as CeramicCommit
      await client.applyCommit(streamId, commit)
      await TestUtils.waitForState(
        tile,
        1000,
        (state) => StreamUtils.statesEqual(state, second),
        () => {
          throw new Error('Expect stream state to be updated')
        }
      )
    })
  })
})
