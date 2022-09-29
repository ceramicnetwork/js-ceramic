import { jest } from '@jest/globals'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import tmp from 'tmp-promise'
import { Ceramic } from '@ceramicnetwork/core'
import { CeramicClient } from '@ceramicnetwork/http-client'
import { randomString } from '@stablelib/random'
import { CommitType, IpfsApi, StreamState, TestUtils } from '@ceramicnetwork/common'
import { CeramicDaemon } from '../ceramic-daemon.js'
import { makeCeramicCore } from './make-ceramic-core.js'
import { makeCeramicDaemon } from './make-ceramic-daemon.js'
import { makeDID } from './make-did.js'
import { Model, ModelDefinition } from '@ceramicnetwork/stream-model'

const SEED = randomString(32)

const MODEL_DEFINITION: ModelDefinition = {
  name: 'MyModel',
  accountRelation: { type: 'list' },
  schema: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    additionalProperties: false,
    properties: {
      myData: {
        type: 'integer',
        maximum: 10000,
        minimum: 0,
      },
    },
    required: ['myData'],
  },
}

let ipfs: IpfsApi
let daemon: CeramicDaemon
let tmpFolder: tmp.DirectoryResult
let core: Ceramic
let client: CeramicClient
let modelStreamId

beforeAll(async () => {
  ipfs = await createIPFS()
})

afterAll(async () => {
  await ipfs.stop()
})

beforeEach(async () => {
  process.env.CERAMIC_ENABLE_EXPERIMENTAL_COMPOSE_DB = 'true'

  tmpFolder = await tmp.dir({ unsafeCleanup: true })
  core = await makeCeramicCore(ipfs, tmpFolder.path)
  daemon = await makeCeramicDaemon(core)
  const apiUrl = `http://localhost:${daemon.port}`
  client = new CeramicClient(apiUrl, { syncInterval: 500 })

  await core.setDID(makeDID(core, SEED))
  await client.setDID(makeDID(client, SEED))

  const model = await Model.create(core, MODEL_DEFINITION)
  modelStreamId = model.id

  await core.index.indexModels([modelStreamId])
})

afterEach(async () => {
  await client.close()
  await daemon.close()
  await core.close()
  await tmpFolder.cleanup()
})

test('count', async () => {
  const indexSpy = jest.spyOn(daemon.ceramic.index, 'count')
  const returnCount = Math.random()
  indexSpy.mockReturnValueOnce(Promise.resolve(returnCount))
  const query = {
    model: modelStreamId,
  }
  const result = await client.index.count(query)
  expect(result).toEqual(returnCount)
  expect(indexSpy).toBeCalled()
})

test('model in query', async () => {
  const indexSpy = jest.spyOn(daemon.ceramic.index, 'query')
  await client.index.query({
    model: modelStreamId,
    first: 100,
  })
  expect(indexSpy).toBeCalledWith({
    first: 100,
    model: modelStreamId,
  })
})
test('too much entries requested: forward pagination', async () => {
  await expect(
    client.index.query({
      model: modelStreamId,
      first: 20000,
    })
  ).rejects.toThrow(/Requested too many entries: 20000/)
})
test('too much entries requested: forward pagination', async () => {
  await expect(
    client.index.query({
      model: modelStreamId,
      last: 20000,
    })
  ).rejects.toThrow(/Requested too many entries: 20000/)
})
test('model, account in query', async () => {
  const account = `did:key:${randomString(10)}`
  const indexSpy = jest.spyOn(daemon.ceramic.index, 'query')
  await client.index.query({
    model: modelStreamId,
    account: account,
    first: 100,
  })
  expect(indexSpy).toBeCalledWith({
    first: 100,
    model: modelStreamId,
    account: account,
  })
})
test('serialize StreamState', async () => {
  const query = new URL(`http://localhost:${daemon.port}/api/v0/collection`)
  query.searchParams.set('model', modelStreamId.toString())
  query.searchParams.set('first', '100')
  const original = daemon.ceramic.index.query.bind(daemon.ceramic.index)
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
  daemon.ceramic.index.query = async () => {
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
  const response = await client.index.query({
    model: modelStreamId,
    first: 100,
  })
  // const response = await fetchJson(query.toString())
  expect(response.edges.length).toEqual(1)
  // Check if it is indeed the same state
  expect(response.edges[0].node).toEqual(fauxStreamState)
  // Get the original query method back
  daemon.ceramic.index.query = original
})
