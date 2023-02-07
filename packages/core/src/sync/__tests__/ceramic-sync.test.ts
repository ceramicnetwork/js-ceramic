import { EventEmitter } from 'node:events'
import { jest } from '@jest/globals'
import type { Block, BlockTag, Filter, Log } from '@ethersproject/providers'
import { IpfsApi, TestUtils, AnchorProof, Page, StreamState } from '@ceramicnetwork/common'
import { CID } from 'multiformats/cid'
import knex, { Knex } from 'knex'
import * as uint8arrays from 'uint8arrays'
import { hash } from '@stablelib/sha256'
import pgSetup from '@databases/pg-test/jest/globalSetup'
import pgTeardown from '@databases/pg-test/jest/globalTeardown'
import { BaseProvider } from '@ethersproject/providers'

import { STATE_TABLE_NAME } from '../sync-api.js'
import { Ceramic } from '../../ceramic.js'
import { MerkleTreeFactory } from './merkle/merkle-tree-factory.js'
import {
  Candidate,
  BloomMetadata,
  CIDHolder,
  IpfsLeafCompare,
  IpfsMerge,
} from './merkle/merkle-objects.js'
import { Node, TreeMetadata, MergeFunction } from './merkle/merkle.js'
import { INDEXED_MODEL_CONFIG_TABLE_NAME } from '../../indexing/database-index-api.js'
import { CONFIG_TABLE_NAME } from '../../indexing/config.js'
import { BLOCK_CONFIRMATIONS } from '../sync-api.js'
import { IProvidersCache } from '../../providers-cache.js'

import { Model, ModelDefinition } from '@ceramicnetwork/stream-model'
import { ModelInstanceDocument } from '@ceramicnetwork/stream-model-instance'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { LoggerProvider } from '@ceramicnetwork/common'
import { createIPFS, swarmConnect } from '@ceramicnetwork/ipfs-daemon'
import { StreamID } from '@ceramicnetwork/streamid'
import { contractInterface } from '@ceramicnetwork/anchor-utils'

const MODEL_DEFINITION: ModelDefinition = {
  name: 'MyModel',
  version: Model.VERSION,
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

  return parseInt(blockHashOrBlockTag.split('_')[0], 10)
}

class MockProvider extends EventEmitter {
  firstBlock = 25
  lastBlock = this.firstBlock
  rootsByBlockNumber: Record<number, string> = {}
  blockNumberByRoots: Record<string, number> = {}
  async getBlock(
    blockHashOrBlockTag?: BlockTag | string | Promise<BlockTag | string>
  ): Promise<Block> {
    if (!blockHashOrBlockTag || blockHashOrBlockTag === 'latest') {
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
    const fromBlockNumber = fromBlock ? await parseBlockHashOrBlockTag(fromBlock) : this.firstBlock
    const toBlockNumber = toBlock ? await parseBlockHashOrBlockTag(toBlock) : this.lastBlock

    const logs: Log[] = []
    for (let blockNumber = fromBlockNumber; blockNumber <= toBlockNumber; blockNumber++) {
      const root = this.rootsByBlockNumber[blockNumber]
      if (!root) {
        return []
      }

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

  async getNetwork(): Promise<{ chainId: number }> {
    return { chainId: 1337 }
  }
}

const provider = new MockProvider()

class MockProvidersCache implements IProvidersCache {
  ethereumRpcEndpoint = 'test'

  async getProvider(chainId: string | null): Promise<BaseProvider> {
    return provider as any
  }
}

jest.unstable_mockModule('../../providers-cache.js', () => {
  return {
    ProvidersCache: MockProvidersCache,
  }
})

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

const waitForMidsToBeIndexed = async (ceramic: Ceramic, docs: ModelInstanceDocument[]) => {
  // TODO: Once we support subscriptions, use a subscription to wait for the stream to show up
  // in the index, instead of this polling-based approach.
  await TestUtils.waitForConditionOrTimeout(async () => {
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
  } catch (err) {}
}

describe('Sync tests', () => {
  jest.setTimeout(150000)
  const logger = new LoggerProvider().getDiagnosticsLogger()

  let ipfs1: IpfsApi
  let ipfs2: IpfsApi
  let creatingCeramic: Ceramic
  let syncingCeramic: Ceramic | null
  let merkleTreeFactory: MerkleTreeFactory<CIDHolder, Candidate, TreeMetadata>
  let dbConnection: Knex
  let createSyncingCeramic: () => Promise<Ceramic>

  beforeAll(async () => {
    await pgSetup()

    dbConnection = knex({
      client: 'pg',
      connection: process.env.DATABASE_URL,
    })
    await cleanTables(dbConnection)

    const createCeramicFile = await import('../../__tests__/create-ceramic.js')
    const createCeramic = createCeramicFile.createCeramic

    ipfs1 = await createIPFS()
    ipfs2 = await createIPFS()
    await swarmConnect(ipfs1, ipfs2)

    process.env.CERAMIC_ENABLE_EXPERIMENTAL_COMPOSE_DB = 'true'

    // syncing is not enabled
    creatingCeramic = await createCeramic(ipfs2 as any)
    const model = await Model.create(creatingCeramic, MODEL_DEFINITION)
    expect(model.id.toString()).toEqual(MODEL_STREAM_ID.toString())
    await creatingCeramic.admin.startIndexingModels([MODEL_STREAM_ID])

    const ipfsMerge: MergeFunction<CIDHolder, TreeMetadata> = new IpfsMerge(
      creatingCeramic.dispatcher
    )
    const ipfsCompare = new IpfsLeafCompare(logger)
    const bloomMetadata = new BloomMetadata()
    merkleTreeFactory = new MerkleTreeFactory(ipfsMerge, ipfsCompare, bloomMetadata, 5)

    //create a ceramic where syncing is enabled
    createSyncingCeramic = async () => {
      const syncingCeramic = await createCeramic(ipfs1 as any, {
        indexing: {
          db: process.env.DATABASE_URL as string,
          allowQueriesBeforeHistoricalSync: true,
        },
        sync: true,
        // change pubsub topic so that we aren't getting updates via pubsub
        pubsubTopic: '/ceramic/random/test',
      })
      await syncingCeramic.admin.startIndexingModels([MODEL_STREAM_ID])

      // TODO: CDB-2229 once ProvidersCache is used in the validator we will not have to replace this
      // @ts-ignore private field
      const original = syncingCeramic._anchorValidator.validateChainInclusion.bind(
        // @ts-ignore private field
        syncingCeramic._anchorValidator
      )
      // @ts-ignore private field
      syncingCeramic._anchorValidator.validateChainInclusion = async (
        proof: AnchorProof
      ): Promise<number> => {
        const blockNumber = provider.blockNumberByRoots[proof.root.toString()]
        if (blockNumber) {
          return blockNumber
        }

        return original(proof)
      }

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
    const merkleTree1 = await merkleTreeFactory.build(
      [mid, mid2, tile].map((stream) => ({
        streamId: stream.id,
        cid: stream.tip,
        metadata: stream.state.metadata,
      }))
    )

    const tile2 = await TileDocument.create(creatingCeramic, { bar: 'foo' })
    const merkleTree2 = await merkleTreeFactory.build(
      [tile2].map((stream) => ({
        streamId: stream.id,
        cid: stream.tip,
        metadata: stream.state.metadata,
      }))
    )

    const mid3 = await ModelInstanceDocument.create(
      creatingCeramic,
      { myData: 2 },
      {
        model: MODEL_STREAM_ID,
      }
    )
    await mid2.replace({ myData: 4 })
    await tile.update({ foo: 'test' })
    const merkleTree3 = await merkleTreeFactory.build(
      [mid3, mid2, tile].map((stream) => ({
        streamId: stream.id,
        cid: stream.tip,
        metadata: stream.state.metadata,
      }))
    )

    await provider.mineBlocks([merkleTree1.root, merkleTree2.root, merkleTree3.root])

    await waitForMidsToBeIndexed(syncingCeramic, [mid, mid2, mid3])
  })

  test('Can perform sync for the first time', async () => {
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
    const merkleTree1 = await merkleTreeFactory.build(
      [mid, mid2].map((stream) => ({
        streamId: stream.id,
        cid: stream.tip,
        metadata: stream.state.metadata,
      }))
    )

    await provider.mineBlocks([merkleTree1.root])

    syncingCeramic = await createSyncingCeramic()

    await waitForMidsToBeIndexed(syncingCeramic, [mid, mid2])
  })

  test('Should catch up if the node went offline', async () => {
    const mid = await ModelInstanceDocument.create(
      creatingCeramic,
      { myData: 0 },
      {
        model: MODEL_STREAM_ID,
      }
    )
    const merkleTree1 = await merkleTreeFactory.build(
      [mid].map((stream) => ({
        streamId: stream.id,
        cid: stream.tip,
        metadata: stream.state.metadata,
      }))
    )

    await mid.replace({ myData: 2 })
    const merkleTree2 = await merkleTreeFactory.build(
      [mid].map((stream) => ({
        streamId: stream.id,
        cid: stream.tip,
        metadata: stream.state.metadata,
      }))
    )

    await provider.mineBlocks()
    await provider.mineBlocks([merkleTree1.root, merkleTree2.root])
    await provider.mineBlocks()

    syncingCeramic = await createSyncingCeramic()
    await waitForMidsToBeIndexed(syncingCeramic, [mid])
  })
})
