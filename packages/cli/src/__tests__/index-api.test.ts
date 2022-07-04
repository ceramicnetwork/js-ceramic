import { jest } from '@jest/globals'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import {
  CommitType,
  fetchJson,
  IpfsApi,
  StreamState,
  StreamUtils,
  TestUtils,
} from '@ceramicnetwork/common'
import { CeramicDaemon } from '../ceramic-daemon.js'
import { makeCeramicCore } from './make-ceramic-core.js'
import { makeCeramicDaemon } from './make-ceramic-daemon.js'
import { makeDID } from './make-did.js'
import tmp from 'tmp-promise'
import { Ceramic } from '@ceramicnetwork/core'
import { StreamID } from '@ceramicnetwork/streamid'
import { CeramicClient } from '@ceramicnetwork/http-client'
import { randomString } from '@stablelib/random'

const MODEL_STREAM_ID = new StreamID(1, TestUtils.randomCID())
const SEED = 'SEED'

let ipfs: IpfsApi
let daemon: CeramicDaemon
let tmpFolder: tmp.DirectoryResult
let core: Ceramic
let client: CeramicClient

beforeAll(async () => {
  ipfs = await createIPFS()
})

afterAll(async () => {
  await ipfs.stop()
})

beforeEach(async () => {
  tmpFolder = await tmp.dir({ unsafeCleanup: true })
  core = await makeCeramicCore(ipfs, tmpFolder.path, [MODEL_STREAM_ID].map(String))
  daemon = await makeCeramicDaemon(core)
  const apiUrl = `http://localhost:${daemon.port}`
  client = new CeramicClient(apiUrl, { syncInterval: 500 })

  await core.setDID(makeDID(core, SEED))
  await client.setDID(makeDID(client, SEED))
})

afterEach(async () => {
  await client.close()
  await daemon.close()
  await core.close()
  await tmpFolder.cleanup()
})

describe('index api', () => {
  describe('getCollection calls IndexAPI', () => {
    test('model in query', async () => {
      const query = new URL(`http://localhost:${daemon.port}/api/v0/collection`)
      query.searchParams.set('model', MODEL_STREAM_ID.toString())
      query.searchParams.set('first', '100')
      const indexSpy = jest.spyOn(daemon.ceramic.index, 'queryIndex')
      await fetchJson(query.toString())
      expect(indexSpy).toBeCalledWith({
        first: 100,
        model: MODEL_STREAM_ID,
      })
    })
    test('too much entries requested: forward pagination', async () => {
      const query = new URL(`http://localhost:${daemon.port}/api/v0/collection`)
      query.searchParams.set('model', MODEL_STREAM_ID.toString())
      query.searchParams.set('first', '20000')
      await expect(fetchJson(query.toString())).rejects.toThrow(/Requested too many entries: 20000/)
    })
    test('too much entries requested: forward pagination', async () => {
      const query = new URL(`http://localhost:${daemon.port}/api/v0/collection`)
      query.searchParams.set('model', MODEL_STREAM_ID.toString())
      query.searchParams.set('last', '20000')
      await expect(fetchJson(query.toString())).rejects.toThrow(/Requested too many entries: 20000/)
    })
    test('model, account in query', async () => {
      const query = new URL(`http://localhost:${daemon.port}/api/v0/collection`)
      query.searchParams.set('model', MODEL_STREAM_ID.toString())
      const account = `did:key:${randomString(10)}`
      query.searchParams.set('account', account)
      query.searchParams.set('first', '100')
      const indexSpy = jest.spyOn(daemon.ceramic.index, 'queryIndex')
      await fetchJson(query.toString())
      expect(indexSpy).toBeCalledWith({
        first: 100,
        model: MODEL_STREAM_ID,
        account: account,
      })
    })
    test('serialize StreamState', async () => {
      const query = new URL(`http://localhost:${daemon.port}/api/v0/collection`)
      query.searchParams.set('model', MODEL_STREAM_ID.toString())
      query.searchParams.set('first', '100')
      const original = daemon.ceramic.index.queryIndex.bind(daemon.ceramic.index)
      const fauxStreamState = {
        type: 0,
        log: [
          {
            type: CommitType.GENESIS,
            cid: TestUtils.randomCID(),
          },
        ],
      } as unknown as StreamState
      // Return faux but serializable StreamState
      daemon.ceramic.index.queryIndex = async () => {
        return {
          edges: [
            {
              cursor: 'opaque-cursor',
              node: fauxStreamState,
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
          },
        }
      }
      // It gets serialized
      const response = await fetchJson(query.toString())
      expect(response.edges.length).toEqual(1)
      // Check if it is indeed the same serialized state
      expect(response.edges[0].node).toEqual(StreamUtils.serializeState(fauxStreamState))
      // Get the original queryIndex method back
      daemon.ceramic.index.queryIndex = original
    })
  })
})
