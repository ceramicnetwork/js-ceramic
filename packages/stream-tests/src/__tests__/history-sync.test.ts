import { EventEmitter } from 'node:events'
import { jest } from '@jest/globals'
import type { Block, BlockTag, Filter, Log, TransactionResponse } from '@ethersproject/providers'
import { Utils as CoreUtils } from '@ceramicnetwork/core'
import type { IpfsApi, AnchorProof, Page, StreamState, Stream } from '@ceramicnetwork/common'
import { CID } from 'multiformats/cid'
import knex, { Knex } from 'knex'
import * as uint8arrays from 'uint8arrays'
import { hash } from '@stablelib/sha256'
import pgSetup from '@databases/pg-test/jest/globalSetup'
import pgTeardown from '@databases/pg-test/jest/globalTeardown'
import { CommonTestUtils as TestUtils } from '@ceramicnetwork/common-test-utils'

import {
  BLOCK_CONFIRMATIONS,
  CONFIG_TABLE_NAME,
  INDEXED_MODEL_CONFIG_TABLE_NAME,
  STATE_TABLE_NAME,
} from '@ceramicnetwork/indexing'
import { Ceramic } from '@ceramicnetwork/core'

import { Model, ModelDefinition } from '@ceramicnetwork/stream-model'
import { ModelInstanceDocument } from '@ceramicnetwork/stream-model-instance'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { LoggerProvider } from '@ceramicnetwork/common'
import { createIPFS, swarmConnect } from '@ceramicnetwork/ipfs-daemon'
import { StreamID } from '@ceramicnetwork/streamid'
import {
  contractInterface,
  Node,
  MerkleTreeFactory,
  IpfsLeafCompare,
  IpfsMerge,
  type CIDHolder,
  type MergeFunction,
  type TreeMetadata,
  type ICandidate,
} from '@ceramicnetwork/anchor-utils'
import { FauxBloomMetadata } from '../faux-bloom-metadata.js'
import { createCeramic } from '../create-ceramic.js'

const DEFAULT_START_BLOCK = 1000

const MODEL_DEFINITION: ModelDefinition = {
  name: 'MyModel',
  version: '1.0',
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

const MODEL_STREAM_ID = StreamID.fromString(
  'kjzl6hvfrbw6cbdjuaefdwodr2xb2n8ga1b5ss91roslr1iffmpgehcw5246o2q'
)

const createBlockHash = (blockNumber: number): string => {
  return `blockHash_${blockNumber}`
}

const createTransactionHash = (blockNumber: number): string => {
  return uint8arrays.toString(hash(uint8arrays.fromString(`txHash_${blockNumber}`)), 'base16')
}

const createBlock = (blockNumber: number) => {
  return {
    number: blockNumber,
    timestamp: 1675286824247 + blockNumber * 1000,
    transactions: [createTransactionHash(blockNumber)],
    hash: createBlockHash(blockNumber),
    parentHash: blockNumber === 0 ? '' : createBlockHash(blockNumber - 1),
  }
}

const parseBlockHashOrBlockTag = async (
  blockHashOrBlockTag: BlockTag | string | Promise<BlockTag | string>
): Promise<number> => {
  blockHashOrBlockTag = await blockHashOrBlockTag

  if (typeof blockHashOrBlockTag === 'number') {
    return blockHashOrBlockTag
  }

  const parsed = parseInt(blockHashOrBlockTag, 10)
  if (!isNaN(parsed)) {
    return parsed
  }

  return parseInt(blockHashOrBlockTag.split('_')[1], 10)
}

class MockProvider extends EventEmitter {
  firstBlock = 100025
  lastBlock = this.firstBlock
  rootsByBlockNumber: Record<number, string> = {}
  blockNumberByRoots: Record<string, number> = {}

  async getBlock(
    blockHashOrBlockTag?: BlockTag | string | Promise<BlockTag | string>
  ): Promise<Block> {
    if ((!blockHashOrBlockTag && blockHashOrBlockTag != 0) || blockHashOrBlockTag === 'latest') {
      return createBlock(this.lastBlock) as Block
    }

    let blockNumber = await parseBlockHashOrBlockTag(blockHashOrBlockTag)

    if (blockNumber < 0) {
      blockNumber = this.lastBlock + blockNumber
    }

    return createBlock(blockNumber) as Block
  }

  async getLogs(filter: Filter): Promise<Array<Log>> {
    const { fromBlock, toBlock } = filter
    const fromBlockNumber =
      fromBlock || fromBlock == 0 ? await parseBlockHashOrBlockTag(fromBlock) : this.firstBlock
    const toBlockNumber =
      toBlock || toBlock == 0 ? await parseBlockHashOrBlockTag(toBlock) : this.lastBlock

    const logs: Log[] = []
    for (let blockNumber = fromBlockNumber; blockNumber <= toBlockNumber; blockNumber++) {
      const root = this.rootsByBlockNumber[blockNumber]
      if (root) {
        const hexRoot = '0x' + uint8arrays.toString(CID.parse(root).bytes.slice(4), 'base16')
        const encodedArgs = contractInterface.encodeEventLog(
          contractInterface.events['DidAnchor(address,bytes32)'],
          ['0xB37fedf93df2fF5BcDC38328634A8C1926d85631', hexRoot]
        )

        logs.push({
          blockNumber,
          blockHash: `blockHash_${blockNumber}`,
          data: encodedArgs.data,
          topics: encodedArgs.topics,
          transactionHash: createTransactionHash(blockNumber),
        } as Log)
      }
    }

    return logs
  }

  async mineBlocks(merkleRoots?: Node<CIDHolder>[]): Promise<void> {
    if (!merkleRoots || merkleRoots.length === 0) {
      await TestUtils.delay(3000)

      this.emit('block', this.lastBlock + 1)
      this.lastBlock = this.lastBlock + 1
      return
    }

    for (const root of merkleRoots) {
      this.rootsByBlockNumber[this.lastBlock - BLOCK_CONFIRMATIONS + 1] = root.data.cid.toString()
      this.blockNumberByRoots[root.data.cid.toString()] = this.lastBlock - BLOCK_CONFIRMATIONS + 1

      await TestUtils.delay(3000)

      this.emit('block', this.lastBlock + 1)
      this.lastBlock = this.lastBlock + 1
    }
  }

  async getTransaction(): Promise<TransactionResponse> {
    return {
      blockNumber: 100000,
    } as any
  }

  async getNetwork(): Promise<{ chainId: number }> {
    return { chainId: 1337 }
  }
}

const extractStreamStates = (page: Page<StreamState | null>): Array<StreamState> => {
  if (page.edges.find((edge) => edge.node === null)) {
    throw new Error(
      'null stream state found. This may indicate a problem with data persistence of your state store, which can result in data loss.'
    )
  }

  return page.edges.map((edge) => edge.node) as Array<StreamState>
}

const extractDocuments = (
  ceramic: Ceramic,
  page: Page<StreamState | null>
): Array<ModelInstanceDocument> => {
  return extractStreamStates(page).map((state) =>
    ceramic.buildStreamFromState<ModelInstanceDocument>(state)
  )
}

const waitForMidsToBeIndexed = async (
  ceramic: Ceramic,
  docs: ModelInstanceDocument[]
): Promise<boolean> => {
  // TODO: Once we support subscriptions, use a subscription to wait for the stream to show up
  // in the index, instead of this polling-based approach.
  return TestUtils.waitForConditionOrTimeout(async () => {
    const results = await ceramic.index
      .query({ model: MODEL_STREAM_ID, last: 100 })
      .then((resultObj) => extractDocuments(ceramic, resultObj))

    return docs.every((doc) => {
      const found = results.find(
        (resultDoc) =>
          resultDoc.id.toString() === doc.id.toString() &&
          resultDoc.content.data === doc.content.data
      )

      return Boolean(found)
    })
  })
}

const cleanTables = async (dbConnection: Knex) => {
  await dbConnection.schema.dropTableIfExists(CONFIG_TABLE_NAME)
  await dbConnection.schema.dropTableIfExists(INDEXED_MODEL_CONFIG_TABLE_NAME)
  await dbConnection.schema.dropTableIfExists(Model.MODEL.toString())
  await dbConnection.schema.dropTableIfExists(MODEL_STREAM_ID.toString())
  try {
    await dbConnection.table('pgboss.job').truncate()
  } catch (err) {
    // sometimes this fails beause pgboss.job doesn't exist
  }
}

function candidateFromStream(stream: Stream): ICandidate {
  return {
    streamId: stream.id,
    cid: stream.tip,
    metadata: {
      controllers: stream.metadata.controllers || stream.metadata.controller,
      schema: stream.metadata.schema,
      family: stream.metadata.family,
      tags: stream.metadata.tags,
      model: stream.metadata.model,
    },
  }
}

const provider = new MockProvider()

const mockProvidersCache = {
  ethereumRpcEndpoint: 'test',
  async getProvider() {
    return provider as any
  },
}

// should pass when blocks are stored (one needs update from tile document)
// config issue with sync disabled and HDS enabled
const describeIfV3 = process.env.CERAMIC_RECON_MODE ? describe.skip : describe

describeIfV3('Sync tests', () => {
  jest.setTimeout(150000)
  const logger = new LoggerProvider().getDiagnosticsLogger()

  let ipfs1: IpfsApi
  let ipfs2: IpfsApi
  let creatingCeramic: Ceramic
  let createdModel: Model
  let syncingCeramic: Ceramic | null
  let merkleTreeFactory: MerkleTreeFactory<CIDHolder, ICandidate, TreeMetadata>
  let dbConnection: Knex
  let createSyncingCeramic: () => Promise<Ceramic>

  beforeAll(async () => {
    await pgSetup()

    dbConnection = knex({
      client: 'pg',
      connection: process.env.DATABASE_URL,
    })
    await cleanTables(dbConnection)

    ipfs1 = await createIPFS()
    ipfs2 = await createIPFS()
    await swarmConnect(ipfs1, ipfs2)

    // syncing is not enabled
    creatingCeramic = await createCeramic(ipfs2 as any)
    createdModel = await Model.create(creatingCeramic, MODEL_DEFINITION)
    expect(createdModel.id.toString()).toEqual(MODEL_STREAM_ID.toString())
    await CoreUtils.anchorUpdate(creatingCeramic, createdModel)
    await creatingCeramic.admin.startIndexingModels([MODEL_STREAM_ID])

    const ipfsMerge: MergeFunction<CIDHolder, TreeMetadata> = new IpfsMerge(
      creatingCeramic.dispatcher,
      logger
    )
    const ipfsCompare = new IpfsLeafCompare(logger)
    const bloomMetadata = new FauxBloomMetadata()
    merkleTreeFactory = new MerkleTreeFactory(ipfsMerge, ipfsCompare, bloomMetadata, 5)

    //create a ceramic where syncing is enabled
    createSyncingCeramic = async () => {
      const syncingCeramic = await createCeramic(
        ipfs1 as any,
        {
          ethereumRpcUrl: 'test',
          indexing: {
            db: process.env.DATABASE_URL as string,
            allowQueriesBeforeHistoricalSync: true,
            enableHistoricalSync: true,
            disableComposedb: false,
          },
          sync: true,
          // change pubsub topic so that we aren't getting updates via pubsub
          pubsubTopic: '/ceramic/random/test',
        },
        mockProvidersCache
      )

      // TODO: CDB-2229 once ProvidersCache is used in the validator we will not have to replace this
      const validator = syncingCeramic.anchorService.validator
      const original = validator.validateChainInclusion.bind(validator)
      validator.validateChainInclusion = async (proof: AnchorProof): Promise<number> => {
        const blockNumber = provider.blockNumberByRoots[proof.root.toString()]
        if (blockNumber) {
          return blockNumber
        }

        return original(proof)
      }

      // @ts-ignore private field
      syncingCeramic.syncApi.defaultStartBlock = DEFAULT_START_BLOCK

      return syncingCeramic
    }
  })

  afterAll(async () => {
    await creatingCeramic.close()
    await ipfs1.stop()
    await ipfs2.stop()
    await dbConnection.destroy()
    await pgTeardown()
  })

  beforeEach(async () => {
    await cleanTables(dbConnection)
  })

  afterEach(async () => {
    if (syncingCeramic) {
      await syncingCeramic.close()
      syncingCeramic = null
    }
  })

  test('Can perform an ongoing sync', async () => {
    await dbConnection.schema.dropTableIfExists(STATE_TABLE_NAME)

    syncingCeramic = await createSyncingCeramic()
    await syncingCeramic.admin.startIndexingModels([MODEL_STREAM_ID])
    const mid = await ModelInstanceDocument.create(
      creatingCeramic,
      { myData: 0 },
      {
        model: MODEL_STREAM_ID,
      }
    )
    const mid2 = await ModelInstanceDocument.create(
      creatingCeramic,
      { myData: 1 },
      {
        model: MODEL_STREAM_ID,
      }
    )
    const tile = await TileDocument.create(creatingCeramic, { foo: 'bar' })
    const merkleTree1 = await merkleTreeFactory.build([mid, mid2, tile].map(candidateFromStream))

    const tile2 = await TileDocument.create(creatingCeramic, { bar: 'foo' })
    const merkleTree2 = await merkleTreeFactory.build([tile2].map(candidateFromStream))

    const mid3 = await ModelInstanceDocument.create(
      creatingCeramic,
      { myData: 2 },
      {
        model: MODEL_STREAM_ID,
      }
    )
    await mid2.replace({ myData: 4 })
    await tile.update({ foo: 'test' })
    const merkleTree3 = await merkleTreeFactory.build([mid3, mid2, tile].map(candidateFromStream))

    await provider.mineBlocks([merkleTree1.root, merkleTree2.root, merkleTree3.root])

    const success = await waitForMidsToBeIndexed(syncingCeramic, [mid, mid2, mid3])
    expect(success).toEqual(true)
  })

  test('Can perform sync for the first time starting from the model`s anchored block', async () => {
    await dbConnection.schema.dropTableIfExists(STATE_TABLE_NAME)

    const mid = await ModelInstanceDocument.create(
      creatingCeramic,
      { myData: 0 },
      {
        model: MODEL_STREAM_ID,
      }
    )
    const mid2 = await ModelInstanceDocument.create(
      creatingCeramic,
      { myData: 1 },
      {
        model: MODEL_STREAM_ID,
      }
    )
    const merkleTree1 = await merkleTreeFactory.build([mid, mid2].map(candidateFromStream))

    await provider.mineBlocks([merkleTree1.root])
    await provider.mineBlocks([])

    syncingCeramic = await createSyncingCeramic()
    // since we disabled receiving updates from the pubsub, we cannot retrieve the anchor, so we load the model at the anchor commit.
    await syncingCeramic.loadStream(createdModel.commitId)

    // @ts-ignore private field
    const addSyncJobSpy = jest.spyOn(syncingCeramic.syncApi, '_addSyncJob')

    await syncingCeramic.admin.startIndexingModels([MODEL_STREAM_ID])

    const success = await waitForMidsToBeIndexed(syncingCeramic, [mid, mid2])
    expect(success).toEqual(true)

    const jobData = addSyncJobSpy.mock.calls[0][1] as any
    expect(jobData.fromBlock).toBeGreaterThan(DEFAULT_START_BLOCK)
    expect(jobData.toBlock).toEqual(provider.lastBlock - BLOCK_CONFIRMATIONS)
  })

  test('Can perform sync for the first time starting from the default start block if the model has not been anchored', async () => {
    await dbConnection.schema.dropTableIfExists(STATE_TABLE_NAME)

    const mid = await ModelInstanceDocument.create(
      creatingCeramic,
      { myData: 3 },
      {
        model: MODEL_STREAM_ID,
      }
    )
    const mid2 = await ModelInstanceDocument.create(
      creatingCeramic,
      { myData: 4 },
      {
        model: MODEL_STREAM_ID,
      }
    )
    const merkleTree1 = await merkleTreeFactory.build([mid, mid2].map(candidateFromStream))

    await provider.mineBlocks([merkleTree1.root])
    await provider.mineBlocks([])

    syncingCeramic = await createSyncingCeramic()
    // @ts-ignore private field
    const addSyncJobSpy = jest.spyOn(syncingCeramic.syncApi, '_addSyncJob')

    await syncingCeramic.admin.startIndexingModels([MODEL_STREAM_ID])

    const success = await waitForMidsToBeIndexed(syncingCeramic, [mid, mid2])
    expect(success).toEqual(true)

    const jobData = addSyncJobSpy.mock.calls[0][1] as any
    expect(jobData.fromBlock).toEqual(DEFAULT_START_BLOCK)
    expect(jobData.toBlock).toEqual(provider.lastBlock - BLOCK_CONFIRMATIONS)
  })

  test('Should catch up if the node went offline', async () => {
    const mid = await ModelInstanceDocument.create(
      creatingCeramic,
      { myData: 0 },
      {
        model: MODEL_STREAM_ID,
      }
    )
    const merkleTree1 = await merkleTreeFactory.build([mid].map(candidateFromStream))

    await mid.replace({ myData: 2 })
    const merkleTree2 = await merkleTreeFactory.build([mid].map(candidateFromStream))

    await provider.mineBlocks()
    await provider.mineBlocks([merkleTree1.root, merkleTree2.root])
    await provider.mineBlocks()

    syncingCeramic = await createSyncingCeramic()
    await syncingCeramic.admin.startIndexingModels([MODEL_STREAM_ID])
    const success = await waitForMidsToBeIndexed(syncingCeramic, [mid])
    expect(success).toEqual(true)
  })
})
