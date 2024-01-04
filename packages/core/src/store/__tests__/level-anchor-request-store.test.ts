import { Model, ModelDefinition } from '@ceramicnetwork/stream-model'
import { LevelDbStore } from '../level-db-store.js'
import {
  CeramicApi,
  CommitType,
  DiagnosticsLogger,
  GenesisCommit,
  IpfsApi,
  Networks,
  TestUtils,
} from '@ceramicnetwork/common'
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
import first from 'it-first'
import all from 'it-all'
import { OLD_ELP_DEFAULT_LOCATION } from '../level-db-store.js'
import { Utils } from '../../utils.js'

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
  let tmpFolder: any
  let levelStore: LevelDbStore
  let anchorRequestStore: AnchorRequestStore
  let ipfs: IpfsApi
  let ceramic: CeramicApi
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
  async function loadGenesisCommit(
    ceramic: CeramicApi,
    streamId: StreamID
  ): Promise<GenesisCommit> {
    const commit = await Utils.getCommitData(ceramic.dispatcher, streamId.cid, streamId)
    expect(commit.type).toEqual(CommitType.GENESIS)
    return commit.commit as GenesisCommit
  }

  beforeAll(async () => {
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
  })

  afterAll(async () => {
    await ceramic.close()
    await ipfs.stop
  })

  beforeEach(async () => {
    tmpFolder = await tmp.dir({ unsafeCleanup: true })
    levelStore = new LevelDbStore(logger, tmpFolder.path, 'fakeNetwork')
    anchorRequestStore = new AnchorRequestStore(logger)
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

    const retrieved = await all(anchorRequestStore.list()).then((batches) =>
      batches.reduce((acc, array) => acc.concat(array), [])
    )
    expect(retrieved.sort(sortByKeyStreamId)).toEqual(sortedParams)

    const retrievedWithLimit = await first(anchorRequestStore.list())
    expect(retrievedWithLimit).toEqual(sortedParams.slice(0, 1))
  })

  test('switch from ELP to Mainnet preserves data', async () => {
    const elpLevelStore = new LevelDbStore(logger, tmpFolder.path, OLD_ELP_DEFAULT_LOCATION)
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

    const mainnetLevelStore = new LevelDbStore(logger, tmpFolder.path, Networks.MAINNET)
    await anchorRequestStore.open(mainnetLevelStore)

    const retrievedFromMainnet = await anchorRequestStore.load(streamId1)
    expect(retrievedFromMainnet).toEqual(anchorRequestData)
  })

  test('switch from Clay to Mainnet does not preserve data', async () => {
    const testnetLevelStore = new LevelDbStore(logger, tmpFolder.path, Networks.TESTNET_CLAY)
    await anchorRequestStore.open(testnetLevelStore)

    const anchorRequestData: AnchorRequestData = {
      cid: TestUtils.randomCID(),
      timestamp: Date.now(),
      genesis: genesisCommit1,
    }
    await anchorRequestStore.save(streamId1, anchorRequestData)

    const retrievedFromElp = await anchorRequestStore.load(streamId1)
    expect(retrievedFromElp).toEqual(anchorRequestData)

    await anchorRequestStore.close()

    const mainnetLevelStore = new LevelDbStore(logger, tmpFolder.path, Networks.MAINNET)
    await anchorRequestStore.open(mainnetLevelStore)

    const retrievedFromMainnet = await anchorRequestStore.load(streamId1)
    expect(retrievedFromMainnet).toEqual(null)
  })
})
