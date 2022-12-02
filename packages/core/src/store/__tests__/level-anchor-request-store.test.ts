import { Model, ModelDefinition } from '@ceramicnetwork/stream-model'
import { LevelDbStore } from '../level-db-store.js'
import { CeramicApi, GenesisCommit, IpfsApi, Networks, TestUtils } from '@ceramicnetwork/common'
import {
  AnchorRequestData,
  AnchorRequestStore,
  AnchorRequestStoreListResult,
  serializeAnchorRequestData,
} from '../anchor-request-store.js'
import { jest } from '@jest/globals'
import tmp from 'tmp-promise'
import { StreamID } from '@ceramicnetwork/streamid'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { createCeramic } from '../../__tests__/create-ceramic.js'

const MODEL_CONTENT_1: ModelDefinition = {
  name: 'MyModel 1',
  accountRelation: { type: 'list' },
  schema: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    properties: {
      stringPropName: {
        type: 'string',
        maxLength: 80,
      },
    },
    additionalProperties: false,
    required: ['stringPropName'],
  },
}

const MODEL_CONTENT_2: ModelDefinition = {
  name: 'MyModel 2',
  accountRelation: { type: 'single' },
  schema: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    properties: {
      numberPropName: {
        type: 'number',
      },
    },
    additionalProperties: false,
    required: ['numberPropName'],
  },
}

const MODEL_CONTENT_3: ModelDefinition = {
  name: 'MyModel 3',
  accountRelation: { type: 'list' },
  schema: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    properties: {
      numberPropName: {
        type: 'number',
      },
    },
    additionalProperties: false,
  },
}

describe('LevelDB-backed AnchorRequestStore state store', () => {
  let tmpFolder: any
  let levelStore: LevelDbStore
  let anchorRequestStore: AnchorRequestStore
  let ipfs: IpfsApi
  let ceramic: CeramicApi
  let streamId1: StreamID
  let genesisCommit1: GenesisCommit
  let streamId2: StreamID
  let genesisCommit2: GenesisCommit
  let streamId3: StreamID
  let genesisCommit3: GenesisCommit

  beforeAll(async () => {
    process.env.CERAMIC_ENABLE_EXPERIMENTAL_COMPOSE_DB = 'true'
    ipfs = await createIPFS()
    ceramic = await createCeramic(ipfs)

    const model1 = await Model.create(ceramic, MODEL_CONTENT_1)
    streamId1 = model1.id
    genesisCommit1 = await ceramic.dispatcher.retrieveCommit(
      (
        await ceramic.loadStreamCommits(model1.id)
      )[0].cid,
      streamId1
    )

    const model2 = await Model.create(ceramic, MODEL_CONTENT_2)
    streamId2 = model2.id
    genesisCommit2 = await ceramic.dispatcher.retrieveCommit(
      (
        await ceramic.loadStreamCommits(model2.id)
      )[0].cid,
      streamId2
    )

    const model3 = await Model.create(ceramic, MODEL_CONTENT_3)
    streamId3 = model3.id
    genesisCommit3 = await ceramic.dispatcher.retrieveCommit(
      (
        await ceramic.loadStreamCommits(model3.id)
      )[0].cid,
      streamId3
    )
  })

  afterAll(async () => {
    await ceramic.close()
    await ipfs.stop
    process.env.CERAMIC_ENABLE_EXPERIMENTAL_COMPOSE_DB = undefined
  })

  beforeEach(async () => {
    tmpFolder = await tmp.dir({ unsafeCleanup: true })
    levelStore = new LevelDbStore(tmpFolder.path, 'fakeNetwork')
    anchorRequestStore = new AnchorRequestStore()
    await anchorRequestStore.open(levelStore)

    // add a small delay after creating the leveldb instance before trying to use it.
    await TestUtils.delay(100)
  })

  afterEach(async () => {
    await anchorRequestStore.close()
    await levelStore.close()
    await tmpFolder.cleanup()
  })

  test('#save and #load', async () => {
    // @ts-ignore anchorRequestStore.store is protected
    const putSpy = jest.spyOn(anchorRequestStore.store, 'put')

    const anchorRequestData: AnchorRequestData = {
      cid: TestUtils.randomCID(),
      timestamp: Date.now(),
      genesis: genesisCommit1,
    }

    await anchorRequestStore.save(streamId1, anchorRequestData)
    expect(putSpy).toBeCalledWith(
      streamId1.toString(),
      serializeAnchorRequestData(anchorRequestData),
      'anchor-requests'
    )

    const retrieved = await anchorRequestStore.load(streamId1)
    expect(retrieved).toEqual(anchorRequestData)

    putSpy.mockRestore()
  })

  test('#load not found', async () => {
    const retrieved = await anchorRequestStore.load(streamId1)
    expect(retrieved).toBeNull()
  })

  test('#load passes errors', async () => {
    // @ts-ignore anchorRequestStore.store is protected
    const getSpy = jest.spyOn(anchorRequestStore.store, 'get')
    getSpy.mockImplementationOnce(() => {
      throw new Error('something internal to LevelDB')
    })
    await expect(anchorRequestStore.load(streamId1)).rejects.toThrow(
      'something internal to LevelDB'
    )

    await getSpy.mockRestore()
  })

  test('#remove', async () => {
    const anchorRequestData: AnchorRequestData = {
      cid: TestUtils.randomCID(),
      timestamp: Date.now(),
      genesis: genesisCommit1,
    }

    await anchorRequestStore.save(streamId1, anchorRequestData)

    let retrieved = await anchorRequestStore.load(streamId1)
    expect(retrieved).toEqual(anchorRequestData)

    await anchorRequestStore.remove(streamId1)

    retrieved = await anchorRequestStore.load(streamId1)
    expect(retrieved).toBeNull()
  })

  test('#list', async () => {
    const anchorRequestData1: AnchorRequestData = {
      cid: TestUtils.randomCID(),
      timestamp: Date.now(),
      genesis: genesisCommit1,
    }
    await anchorRequestStore.save(streamId1, anchorRequestData1)

    const anchorRequestData2: AnchorRequestData = {
      cid: TestUtils.randomCID(),
      timestamp: Date.now(),
      genesis: genesisCommit2,
    }
    await anchorRequestStore.save(streamId2, anchorRequestData2)

    const anchorRequestData3: AnchorRequestData = {
      cid: TestUtils.randomCID(),
      timestamp: Date.now(),
      genesis: genesisCommit3,
    }
    await anchorRequestStore.save(streamId3, anchorRequestData3)

    const sortByKeyStreamId = (
      a: AnchorRequestStoreListResult,
      b: AnchorRequestStoreListResult
    ) => {
      return a.key.toString().localeCompare(b.key.toString())
    }

    const sortedParams = [
      { key: streamId1, value: anchorRequestData1 },
      { key: streamId2, value: anchorRequestData2 },
      { key: streamId3, value: anchorRequestData3 },
    ].sort(sortByKeyStreamId)

    const retrieved = await anchorRequestStore.list()
    expect(retrieved.sort(sortByKeyStreamId)).toEqual(sortedParams)

    const retrievedWithLimit = await anchorRequestStore.list(1)
    expect(retrievedWithLimit).toEqual(sortedParams.slice(0, 1))
  })

  test('switch from ELP to Mainnet preserves data', async () => {
    const elpLevelStore = new LevelDbStore(tmpFolder.path, Networks.ELP)
    await anchorRequestStore.open(elpLevelStore)

    const anchorRequestData: AnchorRequestData = {
      cid: TestUtils.randomCID(),
      timestamp: Date.now(),
      genesis: genesisCommit1,
    }
    await anchorRequestStore.save(streamId1, anchorRequestData)

    const retrievedFromElp = await anchorRequestStore.load(streamId1)
    expect(retrievedFromElp).toEqual(anchorRequestData)

    await anchorRequestStore.close()

    const mainnetLevelStore = new LevelDbStore(tmpFolder.path, Networks.MAINNET)
    await anchorRequestStore.open(mainnetLevelStore)

    const retrievedFromMainnet = await anchorRequestStore.load(streamId1)
    expect(retrievedFromMainnet).toEqual(anchorRequestData)
  })

  test('switch from Clay to Mainnet does not preserve data', async () => {
    const elpLevelStore = new LevelDbStore(tmpFolder.path, Networks.TESTNET_CLAY)
    await anchorRequestStore.open(elpLevelStore)

    const anchorRequestData: AnchorRequestData = {
      cid: TestUtils.randomCID(),
      timestamp: Date.now(),
      genesis: genesisCommit1,
    }
    await anchorRequestStore.save(streamId1, anchorRequestData)

    const retrievedFromElp = await anchorRequestStore.load(streamId1)
    expect(retrievedFromElp).toEqual(anchorRequestData)

    await anchorRequestStore.close()

    const mainnetLevelStore = new LevelDbStore(tmpFolder.path, Networks.MAINNET)
    await anchorRequestStore.open(mainnetLevelStore)

    const retrievedFromMainnet = await anchorRequestStore.load(streamId1)
    expect(retrievedFromMainnet).toEqual(null)
  })
})
