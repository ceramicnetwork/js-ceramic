import { Model, ModelDefinition } from '@ceramicnetwork/stream-model'
import {
  EventType,
  DiagnosticsLogger,
  GenesisCommit,
  IpfsApi,
  Networks,
} from '@ceramicnetwork/common'
import {
  AnchorRequestData,
  AnchorRequestStore,
  AnchorRequestStoreListResult,
  serializeAnchorRequestData,
} from '../anchor-request-store.js'
import {
  jest,
  describe,
  test,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
} from '@jest/globals'
import tmp from 'tmp-promise'
import { StreamID } from '@ceramicnetwork/streamid'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { createCeramic } from '../../__tests__/create-ceramic.js'
import first from 'it-first'
import all from 'it-all'
import { Utils } from '../../utils.js'
import { CommonTestUtils as TestUtils } from '@ceramicnetwork/common-test-utils'
import { LevelKVFactory, ELP_NETWORK } from '../level-kv-factory.js'
import type { Ceramic } from '../../ceramic.js'

const BATCH_TIMEOUT = 100

const MODEL_CONTENT_1: ModelDefinition = {
  name: 'MyModel 1',
  version: '1.0',
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
  version: '1.0',
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
  version: '1.0',
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
  jest.setTimeout(1000 * 30)

  let tmpFolder: any
  let kvFactory: LevelKVFactory
  let anchorRequestStore: AnchorRequestStore
  let ipfs: IpfsApi
  let ceramic: Ceramic
  let logger: DiagnosticsLogger
  let streamId1: StreamID
  let genesisCommit1: GenesisCommit
  let streamId2: StreamID
  let genesisCommit2: GenesisCommit
  let streamId3: StreamID
  let genesisCommit3: GenesisCommit

  // use Utils to load the genesis commit for a stream so it converts CIDs for us
  // and we avoid any issues with one having `Symbol(Symbol.toStringTag): "CID"` and one not
  // because the getter function isn't copied by _.cloneDeep.
  async function loadGenesisCommit(ceramic: Ceramic, streamId: StreamID): Promise<GenesisCommit> {
    const commit = await Utils.getCommitData(ceramic.dispatcher, streamId.cid, streamId)
    expect(commit.type).toEqual(EventType.INIT)
    return commit.commit as GenesisCommit
  }

  beforeAll(async () => {
    try {
      ipfs = await createIPFS()
      ceramic = await createCeramic(ipfs)
      logger = ceramic.loggerProvider.getDiagnosticsLogger()

      const model1 = await Model.create(ceramic, MODEL_CONTENT_1)
      streamId1 = model1.id
      genesisCommit1 = await loadGenesisCommit(ceramic, streamId1)

      const model2 = await Model.create(ceramic, MODEL_CONTENT_2)
      streamId2 = model2.id
      genesisCommit2 = await loadGenesisCommit(ceramic, streamId2)

      const model3 = await Model.create(ceramic, MODEL_CONTENT_3)
      streamId3 = model3.id
      genesisCommit3 = await loadGenesisCommit(ceramic, streamId3)
    } catch (e) {
      console.error(e)
      throw e
    }
  })

  afterAll(async () => {
    await ceramic.close()
    await ipfs.stop()
  })

  beforeEach(async () => {
    tmpFolder = await tmp.dir({ unsafeCleanup: true })
    kvFactory = new LevelKVFactory(tmpFolder.path, 'fakeNetwork', logger)
    anchorRequestStore = new AnchorRequestStore(logger, BATCH_TIMEOUT)
    await anchorRequestStore.open(kvFactory)

    // add a small delay after creating the leveldb instance before trying to use it.
    await TestUtils.delay(100)
  })

  afterEach(async () => {
    jest.restoreAllMocks()
    await anchorRequestStore.close()
    await kvFactory.close()
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
      serializeAnchorRequestData(anchorRequestData)
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

    const retrieved = await all(anchorRequestStore.list()).then((batches) =>
      batches.reduce((acc, array) => acc.concat(array), [])
    )
    expect(retrieved.sort(sortByKeyStreamId)).toEqual(sortedParams)

    const retrievedWithLimit = await first(anchorRequestStore.list())
    expect(retrievedWithLimit).toEqual(sortedParams.slice(0, 1))
  })

  test('#infiniteList', async () => {
    // Setup data in the AnchorRequestStore
    const anchorRequestData1: AnchorRequestData = {
      cid: TestUtils.randomCID(),
      timestamp: Date.now(),
      genesis: genesisCommit1,
    }
    const anchorRequestData2: AnchorRequestData = {
      cid: TestUtils.randomCID(),
      timestamp: Date.now(),
      genesis: genesisCommit2,
    }
    const anchorRequestData3: AnchorRequestData = {
      cid: TestUtils.randomCID(),
      timestamp: Date.now(),
      genesis: genesisCommit3,
    }
    await anchorRequestStore.save(streamId1, anchorRequestData1)
    await anchorRequestStore.save(streamId2, anchorRequestData2)
    await anchorRequestStore.save(streamId3, anchorRequestData3)

    // Get sorted list of StreamID keys in the AnchorRequestStore
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
    const sortedStreamIds = sortedParams.map((param) => param.key.toString())

    // Create infinite iterator over the AnchorRequestStore
    const generator = anchorRequestStore.infiniteList(1, 10)

    // List should repeat indefinitely
    expect((await generator.next()).value.toString()).toEqual(sortedStreamIds[0])
    expect((await generator.next()).value.toString()).toEqual(sortedStreamIds[1])
    expect((await generator.next()).value.toString()).toEqual(sortedStreamIds[2])
    expect((await generator.next()).value.toString()).toEqual(sortedStreamIds[0])
    expect((await generator.next()).value.toString()).toEqual(sortedStreamIds[1])
    expect((await generator.next()).value.toString()).toEqual(sortedStreamIds[2])
    expect((await generator.next()).value.toString()).toEqual(sortedStreamIds[0])

    // Generator still not finished
    expect((await generator.next()).done).toBeFalsy()

    // Close the store
    await anchorRequestStore.close()

    // Now the generator is done.
    expect((await generator.next()).done).toBeTruthy()
  })

  test('#infiniteList with timeout', async () => {
    // Setup data in the AnchorRequestStore
    const anchorRequestData1: AnchorRequestData = {
      cid: TestUtils.randomCID(),
      timestamp: Date.now(),
      genesis: genesisCommit1,
    }
    const anchorRequestData2: AnchorRequestData = {
      cid: TestUtils.randomCID(),
      timestamp: Date.now(),
      genesis: genesisCommit2,
    }
    const anchorRequestData3: AnchorRequestData = {
      cid: TestUtils.randomCID(),
      timestamp: Date.now(),
      genesis: genesisCommit3,
    }
    await anchorRequestStore.save(streamId1, anchorRequestData1)
    await anchorRequestStore.save(streamId2, anchorRequestData2)
    await anchorRequestStore.save(streamId3, anchorRequestData3)

    // Get sorted list of StreamID keys in the AnchorRequestStore
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
    const sortedStreamIds = sortedParams.map((param) => param.key.toString())

    // Make it so the first batch will timeout, but subsequent batches will succeed
    const findOriginal = anchorRequestStore.store.find.bind(anchorRequestStore.store)
    const findSpy = jest.spyOn(anchorRequestStore.store, 'find')
    findSpy.mockImplementationOnce(async (params) => {
      await TestUtils.delay(BATCH_TIMEOUT * 10)
      return findOriginal(params)
    })

    // Create infinite iterator over the AnchorRequestStore
    const generator = anchorRequestStore.infiniteList(1, 10)

    expect((await generator.next()).value.toString()).toEqual(sortedStreamIds[0])
    expect((await generator.next()).value.toString()).toEqual(sortedStreamIds[1])
    expect((await generator.next()).value.toString()).toEqual(sortedStreamIds[2])

    // It takes two tries to get the first batch
    expect(findSpy).toHaveBeenCalledTimes(4)
  })

  test('switch from ELP to Mainnet preserves data', async () => {
    const elpKVFactory = new LevelKVFactory(tmpFolder.path, ELP_NETWORK, logger)
    await anchorRequestStore.open(elpKVFactory)

    const anchorRequestData: AnchorRequestData = {
      cid: TestUtils.randomCID(),
      timestamp: Date.now(),
      genesis: genesisCommit1,
    }
    await anchorRequestStore.save(streamId1, anchorRequestData)

    const retrievedFromElp = await anchorRequestStore.load(streamId1)
    expect(retrievedFromElp).toEqual(anchorRequestData)

    await anchorRequestStore.close()

    const mainnetKVFactory = new LevelKVFactory(tmpFolder.path, Networks.MAINNET, logger)
    await anchorRequestStore.open(mainnetKVFactory)

    const retrievedFromMainnet = await anchorRequestStore.load(streamId1)
    expect(retrievedFromMainnet).toEqual(anchorRequestData)
  })

  test('switch from Clay to Mainnet does not preserve data', async () => {
    const testnetKVFactory = new LevelKVFactory(tmpFolder.path, Networks.TESTNET_CLAY, logger)
    await anchorRequestStore.open(testnetKVFactory)

    const anchorRequestData: AnchorRequestData = {
      cid: TestUtils.randomCID(),
      timestamp: Date.now(),
      genesis: genesisCommit1,
    }
    await anchorRequestStore.save(streamId1, anchorRequestData)

    const retrievedFromElp = await anchorRequestStore.load(streamId1)
    expect(retrievedFromElp).toEqual(anchorRequestData)

    await anchorRequestStore.close()

    const mainnetKVFactory = new LevelKVFactory(tmpFolder.path, Networks.MAINNET, logger)
    await anchorRequestStore.open(mainnetKVFactory)

    const retrievedFromMainnet = await anchorRequestStore.load(streamId1)
    expect(retrievedFromMainnet).toEqual(null)
  })
})
