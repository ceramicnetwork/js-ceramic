import { jest } from '@jest/globals'
import getPort from 'get-port'
import { IpfsApi, Page, StreamState, BaseQuery } from '@ceramicnetwork/common'
import { CommonTestUtils as TestUtils } from '@ceramicnetwork/common-test-utils'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import {
  ModelInstanceDocument,
  ModelInstanceDocumentMetadataArgs,
} from '@ceramicnetwork/stream-model-instance'
import { createCeramic } from '../create-ceramic.js'
import { Ceramic } from '@ceramicnetwork/core'
import { CeramicDaemon, DaemonConfig } from '@ceramicnetwork/cli'
import { CeramicClient } from '@ceramicnetwork/http-client'
import { Model, ModelDefinition } from '@ceramicnetwork/stream-model'
import tmp from 'tmp-promise'
import * as fs from 'fs/promises'
import { StreamID } from '@ceramicnetwork/streamid'
import { makeDID } from '@ceramicnetwork/cli/lib/__tests__/make-did.js'
import pgSetup from '@databases/pg-test/jest/globalSetup'
import pgTeardown from '@databases/pg-test/jest/globalTeardown'
import knex, { Knex } from 'knex'
import { INDEXED_MODEL_CONFIG_TABLE_NAME } from '@ceramicnetwork/indexing'

const CONTENT0 = { myData: 0, myArray: [0], myFloat: 0.5 }
const CONTENT1 = { myData: 1, myArray: [1], myString: 'a' }
const CONTENT2 = { myData: 2, myArray: [2], myFloat: 1.0 }
const CONTENT3 = { myData: 3, myArray: [3], myString: 'b' }
const CONTENT4 = { myData: 4, myArray: [4], myFloat: 1.5 }
const CONTENT5 = { myData: 5, myArray: [5], myString: 'c' }
const CONTENT6 = { myData: 6, myArray: [6], myString: 'b' }

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
      myArray: {
        type: 'array',
        items: {
          type: 'integer',
        },
      },
      myString: {
        type: 'string',
      },
      myFloat: {
        type: 'number',
      },
    },
    required: ['myData', 'myArray'],
  },
}

// The model above will always result in this StreamID when created with the fixed did:key
// controller used by the test.
const MODEL_STREAM_ID = 'kjzl6hvfrbw6c5y9s12q66j1mwhmbsp7rhyncq9vigo8nlkf52gn4zg5a8uvbtc'

// StreamID for a model that isn't indexed by the node
const UNINDEXED_MODEL_STREAM_ID = StreamID.fromString(
  'kjzl6hvfrbw6c9rpdsro0cldierurftxvlr0uzh5nt3yqsje7t4ykfcnnnkjxtr'
)

const MODEL_WITH_RELATION_DEFINITION: ModelDefinition = {
  name: 'MyModelWithARelation',
  version: '1.0',
  accountRelation: { type: 'list' },
  schema: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    additionalProperties: false,
    properties: {
      linkedDoc: {
        type: 'string',
      },
    },
    required: ['linkedDoc'],
  },
  relations: { linkedDoc: { type: 'document', model: MODEL_STREAM_ID } },
}

const MODEL_INTERFACE_DEFINITION: ModelDefinition = {
  name: 'ModelInterface',
  version: '2.0',
  interface: true,
  implements: [],
  accountRelation: { type: 'none' },
  schema: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    additionalProperties: false,
    properties: {
      title: { type: 'string' },
      rating: { type: 'number' },
    },
    required: ['title'],
  },
}
const MODEL_INTERFACE_ID = 'kjzl6hvfrbw6c5ys8hkncc8o0959gtbjin40jqa60apwsd62y1n5m930ozx4puf'

const MODEL_IMPLEMENTS_DEFINITION1: ModelDefinition = {
  name: 'ModelImplements1',
  version: '2.0',
  interface: false,
  implements: [MODEL_INTERFACE_ID],
  accountRelation: { type: 'list' },
  schema: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    additionalProperties: false,
    properties: {
      title: { type: 'string' },
      rating: { type: 'number' },
      text: { type: 'string' },
    },
    required: ['title'],
  },
}
const MODEL_IMPLEMENTS_ID1 = StreamID.fromString(
  'kjzl6hvfrbw6cb1jhl1tr9ug1z7b228lnw14srfig632iruvqau9f9sq4buiqib'
)

const MODEL_IMPLEMENTS_DEFINITION2: ModelDefinition = {
  name: 'ModelImplements2',
  version: '2.0',
  interface: false,
  implements: [MODEL_INTERFACE_ID],
  accountRelation: { type: 'list' },
  schema: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    additionalProperties: false,
    properties: {
      title: { type: 'string' },
      rating: { type: 'number' },
      date: { type: 'string' },
    },
    required: ['title'],
  },
}
const MODEL_IMPLEMENTS_ID2 = StreamID.fromString(
  'kjzl6hvfrbw6c76d29f4gwkor70bioye40mmbpng8wc8s2rwrhi97a4kydlawy6'
)

const extractStreamStates = function (page: Page<StreamState | null>): Array<StreamState | null> {
  return page.edges.map((edge) => edge.node)
}

const extractDocuments = function (
  ceramic: CeramicClient,
  page: Page<StreamState | null>
): Array<ModelInstanceDocument> {
  return extractStreamStates(page).map((state) => {
    if (state === null) {
      throw new Error('Null extracted stream state found')
    }
    return ceramic.buildStreamFromState<ModelInstanceDocument>(state)
  })
}

enum DBEngine {
  sqlite = 'sqlite',
  postgres = 'postgres',
}

type BasicIndexingTestEnv = {
  dbEngine: DBEngine
}

const envs: Array<BasicIndexingTestEnv> = [
  { dbEngine: DBEngine.sqlite },
  { dbEngine: DBEngine.postgres },
]

describe.each(envs)('Basic end-to-end indexing query test for $dbEngine', (env) => {
  jest.setTimeout(1000 * 30)

  let stateStoreURL: string
  let dbURL: string
  let ipfs: IpfsApi
  let port: number
  let core: Ceramic
  let daemon: CeramicDaemon
  let ceramic: CeramicClient
  let model: Model
  let midMetadata: ModelInstanceDocumentMetadataArgs
  let modelWithRelation: Model
  let midRelationMetadata: ModelInstanceDocumentMetadataArgs
  let dbConnection: Knex

  async function dropKnexTables() {
    await dbConnection.schema.dropTableIfExists(INDEXED_MODEL_CONFIG_TABLE_NAME)
    await dbConnection.schema.dropTableIfExists(Model.MODEL.toString())
    await dbConnection.schema.dropTableIfExists(modelWithRelation.id.toString())
    await dbConnection.schema.dropTableIfExists(model.id.toString())
    await dbConnection.schema.dropTableIfExists(MODEL_STREAM_ID)
  }

  async function setupCeramic() {
    core = await createCeramic(ipfs, {
      indexing: {
        db: dbURL,
        allowQueriesBeforeHistoricalSync: true,
        enableHistoricalSync: false,
      },
      stateStoreDirectory: stateStoreURL,
    })

    port = await getPort()
    const apiUrl = 'http://localhost:' + port
    daemon = new CeramicDaemon(
      core,
      DaemonConfig.fromObject({
        'http-api': { port: port, 'admin-dids': [core.did.id.toString()] },
        node: {},
      })
    )
    await daemon.listen()
    ceramic = new CeramicClient(apiUrl)
    ceramic.did = core.did
  }

  beforeAll(async () => {
    switch (env.dbEngine) {
      case DBEngine.postgres:
        await pgSetup()
    }

    ipfs = await createIPFS()
  })

  afterAll(async () => {
    await ipfs.stop()

    switch (env.dbEngine) {
      case DBEngine.postgres:
        await pgTeardown()
    }
  })

  beforeEach(async () => {
    switch (env.dbEngine) {
      case DBEngine.sqlite: {
        const indexingDirectory = await tmp.tmpName()
        await fs.mkdir(indexingDirectory)
        dbURL = `sqlite://${indexingDirectory}/ceramic.sqlite`
        break
      }
      case DBEngine.postgres:
        dbURL = process.env.DATABASE_URL || ''
        dbConnection = knex({
          client: 'pg',
          connection: process.env.DATABASE_URL,
        })
        break
    }
    stateStoreURL = await tmp.tmpName()

    await setupCeramic()

    model = await Model.create(ceramic, MODEL_DEFINITION)
    expect(model.id.toString()).toEqual(MODEL_STREAM_ID)
    midMetadata = { model: model.id }
    modelWithRelation = await Model.create(ceramic, MODEL_WITH_RELATION_DEFINITION)
    midRelationMetadata = { model: modelWithRelation.id }

    await core.index.indexModels([{ streamID: model.id }, { streamID: modelWithRelation.id }])
  }, 30 * 1000)

  afterEach(async () => {
    await ceramic.close()
    await daemon.close()
    await core.close()

    switch (env.dbEngine) {
      case DBEngine.postgres:
        await dropKnexTables()
        await dbConnection.destroy()
    }
  })

  describe('basic queries', () => {
    test('basic query', async () => {
      const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
      // Indexed streams should always get pinned, regardless of the 'pin' flag
      await expect(TestUtils.isPinned(ceramic, doc.id)).resolves.toBeTruthy()

      const resultObj = await ceramic.index.query({ model: model.id, first: 100 })
      const results = extractDocuments(ceramic, resultObj)

      expect(results.length).toEqual(1)
      expect(results[0].id.toString()).toEqual(doc.id.toString())
      expect(results[0].content).toEqual(doc.content)
      expect(results[0].state).toEqual(doc.state)
    })

    test("query a model that isn't indexed", async () => {
      await expect(
        ceramic.index.query({ model: UNINDEXED_MODEL_STREAM_ID, first: 100 })
      ).rejects.toThrow(/is not indexed on this node/)
    })

    test("cannot index a stream that isn't a Model", async () => {
      expect(core.index.indexedModels().length).toEqual(2)

      const mid = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
      await expect(core.index.indexModels([{ streamID: mid.id }])).rejects.toThrow(
        /it is not a Model StreamID/
      )

      expect(core.index.indexedModels().length).toEqual(2)
    })

    test('basic count query', async () => {
      await expect(ceramic.index.count({ model: model.id.toString() })).resolves.toEqual(0)
      const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
      await expect(ceramic.index.count({ model: model.id.toString() })).resolves.toEqual(1)
      await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
      await expect(ceramic.index.count({ model: model.id.toString() })).resolves.toEqual(2)

      // Use a different model
      await ModelInstanceDocument.create(
        ceramic,
        { linkedDoc: doc.id.toString() },
        midRelationMetadata
      )
      await expect(
        ceramic.index.count({ model: modelWithRelation.id.toString() })
      ).resolves.toEqual(1)

      // Creating a document in a different model doesn't affect the count
      await expect(ceramic.index.count({ model: model.id.toString() })).resolves.toEqual(2)
    })

    test("count query on a model that isn't indexed", async () => {
      await expect(ceramic.index.count({ model: UNINDEXED_MODEL_STREAM_ID })).rejects.toThrow(
        /is not indexed on this node/
      )
    })

    test('multiple documents - one page', async () => {
      const doc1 = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
      await doc1.replace(CONTENT1)
      const doc2 = await ModelInstanceDocument.create(ceramic, CONTENT2, midMetadata)
      const doc3 = await ModelInstanceDocument.create(ceramic, CONTENT3, midMetadata)

      const resultObj = await ceramic.index.query({ model: model.id, first: 100 })
      const results = extractDocuments(ceramic, resultObj)

      expect(results.length).toEqual(3)
      expect(results[0].id.toString()).toEqual(doc1.id.toString())
      expect(results[0].content).toEqual(CONTENT1)
      expect(results[1].id.toString()).toEqual(doc2.id.toString())
      expect(results[1].content).toEqual(CONTENT2)
      expect(results[2].id.toString()).toEqual(doc3.id.toString())
      expect(results[2].content).toEqual(CONTENT3)
    })

    test('multiple documents - multiple pages', async () => {
      const doc1 = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
      await doc1.replace(CONTENT1)
      const doc2 = await ModelInstanceDocument.create(ceramic, CONTENT2, midMetadata)
      const doc3 = await ModelInstanceDocument.create(ceramic, CONTENT3, midMetadata)
      const doc4 = await ModelInstanceDocument.create(ceramic, CONTENT4, midMetadata)
      const doc5 = await ModelInstanceDocument.create(ceramic, CONTENT5, midMetadata)

      const resultObj0 = await ceramic.index.query({ model: model.id, first: 2 })
      expect(resultObj0.pageInfo.hasNextPage).toBeTruthy()
      const resultObj1 = await ceramic.index.query({
        model: model.id,
        first: 2,
        after: resultObj0.pageInfo.endCursor,
      })
      expect(resultObj1.pageInfo.hasNextPage).toBeTruthy()
      const resultObj2 = await ceramic.index.query({
        model: model.id,
        first: 2,
        after: resultObj1.pageInfo.endCursor,
      })
      expect(resultObj2.pageInfo.hasNextPage).toBeFalsy()

      const results = [
        extractDocuments(ceramic, resultObj0),
        extractDocuments(ceramic, resultObj1),
        extractDocuments(ceramic, resultObj2),
      ].flat()

      expect(results.length).toEqual(5)
      expect(results[0].id.toString()).toEqual(doc1.id.toString())
      expect(results[0].content).toEqual(CONTENT1)
      expect(results[1].id.toString()).toEqual(doc2.id.toString())
      expect(results[1].content).toEqual(CONTENT2)
      expect(results[2].id.toString()).toEqual(doc3.id.toString())
      expect(results[2].content).toEqual(CONTENT3)
      expect(results[3].id.toString()).toEqual(doc4.id.toString())
      expect(results[3].content).toEqual(CONTENT4)
      expect(results[4].id.toString()).toEqual(doc5.id.toString())
      expect(results[4].content).toEqual(CONTENT5)
    })

    test('multiple documents - one page, backwards iteration', async () => {
      const doc1 = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
      await doc1.replace(CONTENT1)
      const doc2 = await ModelInstanceDocument.create(ceramic, CONTENT2, midMetadata)
      const doc3 = await ModelInstanceDocument.create(ceramic, CONTENT3, midMetadata)

      const resultObj = await ceramic.index.query({ model: model.id, last: 100 })
      const results = extractDocuments(ceramic, resultObj)

      // Using `last` doesn't change the order of documents returned within each page
      expect(results.length).toEqual(3)
      expect(results[0].id.toString()).toEqual(doc1.id.toString())
      expect(results[0].content).toEqual(CONTENT1)
      expect(results[1].id.toString()).toEqual(doc2.id.toString())
      expect(results[1].content).toEqual(CONTENT2)
      expect(results[2].id.toString()).toEqual(doc3.id.toString())
      expect(results[2].content).toEqual(CONTENT3)
    })

    test('multiple documents - multiple pages, backwards iteration', async () => {
      const doc1 = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
      await doc1.replace(CONTENT1)
      const doc2 = await ModelInstanceDocument.create(ceramic, CONTENT2, midMetadata)
      const doc3 = await ModelInstanceDocument.create(ceramic, CONTENT3, midMetadata)
      const doc4 = await ModelInstanceDocument.create(ceramic, CONTENT4, midMetadata)
      const doc5 = await ModelInstanceDocument.create(ceramic, CONTENT5, midMetadata)

      const resultObj0 = await ceramic.index.query({ model: model.id, last: 2 })
      expect(resultObj0.pageInfo.hasPreviousPage).toBeTruthy()
      const resultObj1 = await ceramic.index.query({
        model: model.id,
        last: 2,
        before: resultObj0.pageInfo.startCursor,
      })
      expect(resultObj1.pageInfo.hasPreviousPage).toBeTruthy()
      const resultObj2 = await ceramic.index.query({
        model: model.id,
        last: 2,
        before: resultObj1.pageInfo.startCursor,
      })
      expect(resultObj2.pageInfo.hasPreviousPage).toBeFalsy()

      const results = [
        extractDocuments(ceramic, resultObj2),
        extractDocuments(ceramic, resultObj1),
        extractDocuments(ceramic, resultObj0),
      ].flat()

      // Using `last` doesn't change the order of documents returned within each page, it just changes
      // the order of the pages themselves.
      expect(results.length).toEqual(5)
      expect(results[0].id.toString()).toEqual(doc1.id.toString())
      expect(results[0].content).toEqual(CONTENT1)
      expect(results[1].id.toString()).toEqual(doc2.id.toString())
      expect(results[1].content).toEqual(CONTENT2)
      expect(results[2].id.toString()).toEqual(doc3.id.toString())
      expect(results[2].content).toEqual(CONTENT3)
      expect(results[3].id.toString()).toEqual(doc4.id.toString())
      expect(results[3].content).toEqual(CONTENT4)
      expect(results[4].id.toString()).toEqual(doc5.id.toString())
      expect(results[4].content).toEqual(CONTENT5)
    })
  })

  describe('Queries and counts with custom query filtering', () => {
    test('Can query and count a single document by field', async () => {
      const doc1 = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
      const doc2 = await ModelInstanceDocument.create(ceramic, CONTENT2, midMetadata)
      const doc3 = await ModelInstanceDocument.create(ceramic, CONTENT3, midMetadata)
      const doc4 = await ModelInstanceDocument.create(ceramic, CONTENT4, midMetadata)
      const doc5 = await ModelInstanceDocument.create(ceramic, CONTENT5, midMetadata)

      const baseQuery: BaseQuery = {
        model: model.id,
        queryFilters: {
          where: { myData: { equalTo: 3 } },
        },
      }

      const resultObj0 = await ceramic.index.query({
        last: 2,
        ...baseQuery,
      })
      const queryResults = extractDocuments(ceramic, resultObj0)
      expect(queryResults.length).toEqual(1)
      expect(JSON.stringify(queryResults[0].content)).toEqual(JSON.stringify(doc3.content))

      const countResults = await ceramic.index.count(baseQuery)
      expect(countResults).toEqual(1)
    })
    test('Can query and count documents when not null', async () => {
      const doc1 = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
      const doc2 = await ModelInstanceDocument.create(ceramic, CONTENT1, midMetadata)
      const doc3 = await ModelInstanceDocument.create(ceramic, CONTENT2, midMetadata)
      const doc4 = await ModelInstanceDocument.create(ceramic, CONTENT3, midMetadata)

      const baseQuery: BaseQuery = {
        model: model.id,
        queryFilters: {
          where: { myString: { isNull: false } },
        },
      }

      const resultObj0 = await ceramic.index.query({
        last: 2,
        ...baseQuery,
      })
      const results = extractDocuments(ceramic, resultObj0)
      expect(results.length).toEqual(2)
      expect(JSON.stringify(results[0].content)).toEqual(JSON.stringify(doc2.content))

      const countResults = await ceramic.index.count(baseQuery)
      expect(countResults).toEqual(2)
    })
    test('Can query and count documents by string', async () => {
      const doc1 = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
      const doc2 = await ModelInstanceDocument.create(ceramic, CONTENT1, midMetadata)
      const doc3 = await ModelInstanceDocument.create(ceramic, CONTENT2, midMetadata)
      const doc4 = await ModelInstanceDocument.create(ceramic, CONTENT3, midMetadata)
      const doc5 = await ModelInstanceDocument.create(ceramic, CONTENT4, midMetadata)

      const baseQuery: BaseQuery = {
        model: model.id,
        queryFilters: {
          where: { myString: { equalTo: 'b' } },
        },
      }

      const resultObj0 = await ceramic.index.query({
        last: 2,
        ...baseQuery,
      })
      const results = extractDocuments(ceramic, resultObj0)
      expect(results.length).toEqual(1)
      expect(JSON.stringify(results[0].content)).toEqual(JSON.stringify(doc4.content))

      const countResults = await ceramic.index.count(baseQuery)
      expect(countResults).toEqual(1)
    })
    test('Can query and count documents by string in array', async () => {
      const doc1 = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
      const doc2 = await ModelInstanceDocument.create(ceramic, CONTENT1, midMetadata)
      const doc3 = await ModelInstanceDocument.create(ceramic, CONTENT3, midMetadata)
      const doc4 = await ModelInstanceDocument.create(ceramic, CONTENT5, midMetadata)
      const doc5 = await ModelInstanceDocument.create(ceramic, CONTENT6, midMetadata)

      const baseQuery: BaseQuery = {
        model: model.id,
        queryFilters: {
          where: { myString: { in: ['a', 'c'] } },
        },
      }

      const resultObj0 = await ceramic.index.query({
        last: 2,
        ...baseQuery,
      })
      const results = extractDocuments(ceramic, resultObj0)
      expect(results.length).toEqual(2)
      expect(JSON.stringify(results[0].content)).toEqual(JSON.stringify(doc2.content))
      expect(JSON.stringify(results[1].content)).toEqual(JSON.stringify(doc4.content))

      const countResults = await ceramic.index.count(baseQuery)
      expect(countResults).toEqual(2)
    })
    test('Can query and count multiple documents by field', async () => {
      const doc1 = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
      const doc2 = await ModelInstanceDocument.create(ceramic, CONTENT2, midMetadata)
      const doc3 = await ModelInstanceDocument.create(ceramic, CONTENT3, midMetadata)
      const doc4 = await ModelInstanceDocument.create(ceramic, CONTENT4, midMetadata)
      const doc5 = await ModelInstanceDocument.create(ceramic, CONTENT5, midMetadata)

      const baseQuery: BaseQuery = {
        model: model.id,
        queryFilters: {
          or: [{ where: { myData: { equalTo: 2 } } }, { where: { myData: { equalTo: 3 } } }],
        },
      }

      const resultObj0 = await ceramic.index.query({ ...baseQuery, last: 3 })
      const results = extractDocuments(ceramic, resultObj0)
      expect(results.length).toEqual(2)
      expect(JSON.stringify(results[0].content)).toEqual(JSON.stringify(doc2.content))
      expect(JSON.stringify(results[1].content)).toEqual(JSON.stringify(doc3.content))

      const countResults = await ceramic.index.count(baseQuery)
      expect(countResults).toEqual(2)
    })
    test('Can query and count multiple documents with negated field', async () => {
      const doc1 = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
      const doc2 = await ModelInstanceDocument.create(ceramic, CONTENT2, midMetadata)
      const doc3 = await ModelInstanceDocument.create(ceramic, CONTENT3, midMetadata)
      const doc4 = await ModelInstanceDocument.create(ceramic, CONTENT4, midMetadata)
      const doc5 = await ModelInstanceDocument.create(ceramic, CONTENT5, midMetadata)

      const baseQuery: BaseQuery = {
        model: model.id,
        queryFilters: {
          not: { where: { myData: { equalTo: 3 } } },
        },
      }

      const resultObj0 = await ceramic.index.query({
        last: 5,
        ...baseQuery,
      })
      const results = extractDocuments(ceramic, resultObj0)
      expect(results.length).toEqual(4)
      expect(JSON.stringify(results[0].content)).toEqual(JSON.stringify(doc1.content))
      expect(JSON.stringify(results[1].content)).toEqual(JSON.stringify(doc2.content))
      expect(JSON.stringify(results[2].content)).toEqual(JSON.stringify(doc4.content))
      expect(JSON.stringify(results[3].content)).toEqual(JSON.stringify(doc5.content))

      const countResults = await ceramic.index.count(baseQuery)
      expect(countResults).toEqual(4)
    })
    test('Can query and count a single document by array', async () => {
      const doc1 = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
      const doc2 = await ModelInstanceDocument.create(ceramic, CONTENT2, midMetadata)
      const doc3 = await ModelInstanceDocument.create(ceramic, CONTENT3, midMetadata)
      const doc4 = await ModelInstanceDocument.create(ceramic, CONTENT4, midMetadata)
      const doc5 = await ModelInstanceDocument.create(ceramic, CONTENT5, midMetadata)

      const baseQuery: BaseQuery = {
        model: model.id,
        queryFilters: {
          where: { myData: { in: [3] } },
        },
      }

      const resultObj0 = await ceramic.index.query({
        last: 5,
        ...baseQuery,
      })
      const results = extractDocuments(ceramic, resultObj0)
      expect(results.length).toEqual(1)
      expect(JSON.stringify(results[0].content)).toEqual(JSON.stringify(doc3.content))

      const countResults = await ceramic.index.count(baseQuery)
      expect(countResults).toEqual(1)
    })
    test('Can query and count a single document by float', async () => {
      const doc1 = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
      const doc2 = await ModelInstanceDocument.create(ceramic, CONTENT2, midMetadata)
      const doc3 = await ModelInstanceDocument.create(ceramic, CONTENT3, midMetadata)
      const doc4 = await ModelInstanceDocument.create(ceramic, CONTENT4, midMetadata)
      const doc5 = await ModelInstanceDocument.create(ceramic, CONTENT5, midMetadata)

      const baseQuery: BaseQuery = {
        model: model.id,
        queryFilters: {
          where: { myFloat: { greaterThan: 1.2 } },
        },
      }

      const resultObj0 = await ceramic.index.query({
        last: 5,
        ...baseQuery,
      })
      const results = extractDocuments(ceramic, resultObj0)
      expect(results.length).toEqual(1)
      expect(JSON.stringify(results[0].content)).toEqual(JSON.stringify(doc4.content))

      const countResults = await ceramic.index.count(baseQuery)
      expect(countResults).toEqual(1)
    })
    test('Can query and count a single document by float that gets truncated', async () => {
      const doc1 = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
      const doc2 = await ModelInstanceDocument.create(ceramic, CONTENT2, midMetadata)
      const doc3 = await ModelInstanceDocument.create(ceramic, CONTENT3, midMetadata)
      const doc4 = await ModelInstanceDocument.create(ceramic, CONTENT4, midMetadata)
      const doc5 = await ModelInstanceDocument.create(ceramic, CONTENT5, midMetadata)

      const baseQuery: BaseQuery = {
        model: model.id,
        queryFilters: {
          where: { myFloat: { greaterThan: 1.0 } },
        },
      }

      const resultObj0 = await ceramic.index.query({
        last: 5,
        ...baseQuery,
      })
      const results = extractDocuments(ceramic, resultObj0)
      expect(results.length).toEqual(1)
      expect(JSON.stringify(results[0].content)).toEqual(JSON.stringify(doc4.content))

      const countResults = await ceramic.index.count(baseQuery)
      expect(countResults).toEqual(1)
    })
    test('Can query and count a document with a filter containing multiple key/values', async () => {
      await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
      await ModelInstanceDocument.create(ceramic, CONTENT1, midMetadata)
      await ModelInstanceDocument.create(ceramic, CONTENT3, midMetadata)
      await ModelInstanceDocument.create(ceramic, CONTENT5, midMetadata)
      const doc5 = await ModelInstanceDocument.create(ceramic, CONTENT6, midMetadata)

      const resultObj0 = await ceramic.index.query({
        model: model.id,
        last: 5,
        queryFilters: {
          where: {
            myString: { in: ['a', 'b'] },
            myData: { equalTo: 6 },
          },
        },
      })
      const results0 = extractDocuments(ceramic, resultObj0)
      expect(results0.length).toEqual(1)
      expect(JSON.stringify(results0[0].content)).toEqual(JSON.stringify(doc5.content))

      const countResults = await ceramic.index.count({
        model: model.id,
        queryFilters: {
          where: {
            myData: { equalTo: 6 },
            myString: { in: ['a', 'b'] },
          },
        },
      })
      expect(countResults).toEqual(1)
    })
    test('Will not allow multiple filters per level', async () => {
      const doc1 = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
      const doc2 = await ModelInstanceDocument.create(ceramic, CONTENT1, midMetadata)
      const doc3 = await ModelInstanceDocument.create(ceramic, CONTENT3, midMetadata)
      const doc4 = await ModelInstanceDocument.create(ceramic, CONTENT5, midMetadata)
      const doc5 = await ModelInstanceDocument.create(ceramic, CONTENT6, midMetadata)

      await expect(
        ceramic.index.query({
          model: model.id,
          last: 5,
          queryFilters: {
            where: {
              myData: { greaterThan: 1, lessThanOrEqualTo: 5 },
            },
            and: [
              {
                where: {
                  myString: { in: ['a', 'c'] },
                },
              },
            ],
          },
        })
      ).rejects.toThrow(/Only one of where, and, or, and not can be used/)

      await expect(
        ceramic.index.count({
          model: model.id,
          queryFilters: {
            and: [
              {
                where: {
                  myString: { in: ['a', 'c'] },
                },
                not: { where: { myData: { equalTo: 3 } } },
              },
            ],
          },
        })
      ).rejects.toThrow(/Only one of where, and, or, and not can be used/)
    })
    test('Can combine value filters representing valid range boundaries', async () => {
      const doc1 = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
      const doc2 = await ModelInstanceDocument.create(ceramic, CONTENT1, midMetadata)
      const doc3 = await ModelInstanceDocument.create(ceramic, CONTENT3, midMetadata)
      const doc4 = await ModelInstanceDocument.create(ceramic, CONTENT5, midMetadata)
      const doc5 = await ModelInstanceDocument.create(ceramic, CONTENT6, midMetadata)

      const baseQuery = {
        model: model.id,
        queryFilters: {
          where: {
            myString: { in: ['a', 'b'] },
            myData: { greaterThan: 3, lessThanOrEqualTo: 6 },
          },
        },
      }

      const resultObj0 = await ceramic.index.query({
        last: 5,
        ...baseQuery,
      })
      const results = extractDocuments(ceramic, resultObj0)
      expect(results.length).toEqual(1)
      expect(JSON.stringify(results[0].content)).toEqual(JSON.stringify(doc5.content))

      const countResults = await ceramic.index.count(baseQuery)
      expect(countResults).toEqual(1)
    })
    test('Cannot combine value filters that do not represent valid range boundaries', async () => {
      const doc1 = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
      const doc2 = await ModelInstanceDocument.create(ceramic, CONTENT1, midMetadata)
      const doc3 = await ModelInstanceDocument.create(ceramic, CONTENT3, midMetadata)
      const doc4 = await ModelInstanceDocument.create(ceramic, CONTENT5, midMetadata)
      const doc5 = await ModelInstanceDocument.create(ceramic, CONTENT6, midMetadata)

      await expect(
        ceramic.index.query({
          model: model.id,
          last: 5,
          queryFilters: {
            where: {
              myString: { in: ['a', 'b'] },
              myData: { greaterThan: 3, in: [6, 8, 10] },
            },
          },
        })
      ).rejects.toThrow(/Can only combine value filters representing valid range boundaries/)

      await expect(
        ceramic.index.count({
          model: model.id,
          queryFilters: {
            where: {
              myString: { in: ['a', 'b'] },
              myData: { greaterThan: 3, in: [6, 8, 10] },
            },
          },
        })
      ).rejects.toThrow(/Can only combine value filters representing valid range boundaries/)
    })
    test('Can query and count multiple documents with negated or field', async () => {
      const doc1 = await ModelInstanceDocument.create(ceramic, CONTENT1, midMetadata)
      const doc2 = await ModelInstanceDocument.create(ceramic, CONTENT2, midMetadata)
      const doc3 = await ModelInstanceDocument.create(ceramic, CONTENT3, midMetadata)
      const doc4 = await ModelInstanceDocument.create(ceramic, CONTENT4, midMetadata)
      const doc5 = await ModelInstanceDocument.create(ceramic, CONTENT5, midMetadata)
      const doc6 = await ModelInstanceDocument.create(ceramic, CONTENT6, midMetadata)

      const baseQuery: BaseQuery = {
        model: model.id,
        queryFilters: {
          not: {
            or: [{ where: { myData: { equalTo: 3 } } }, { where: { myString: { equalTo: 'b' } } }],
          },
        },
      }

      const resultObj0 = await ceramic.index.query({
        last: 5,
        ...baseQuery,
      })
      const results = extractDocuments(ceramic, resultObj0)
      expect(results.length).toEqual(2)
      expect(JSON.stringify(results[0].content)).toEqual(JSON.stringify(doc1.content))
      expect(JSON.stringify(results[1].content)).toEqual(JSON.stringify(doc5.content))

      const countResults = await ceramic.index.count(baseQuery)
      expect(countResults).toEqual(2)
    })

    test('Can query and count multiple documents with negated and field', async () => {
      const doc3 = await ModelInstanceDocument.create(ceramic, CONTENT3, midMetadata)
      const doc4 = await ModelInstanceDocument.create(ceramic, CONTENT4, midMetadata)
      const doc5 = await ModelInstanceDocument.create(ceramic, CONTENT5, midMetadata)
      const doc6 = await ModelInstanceDocument.create(ceramic, CONTENT6, midMetadata)

      const basequery: BaseQuery = {
        model: model.id,
        queryFilters: {
          not: {
            and: [{ where: { myData: { equalTo: 3 } } }, { where: { myString: { equalTo: 'b' } } }],
          },
        },
      }

      const resultObj0 = await ceramic.index.query({
        last: 5,
        ...basequery,
      })
      const results = extractDocuments(ceramic, resultObj0)
      expect(results.length).toEqual(3)
      expect(JSON.stringify(results[0].content)).toEqual(JSON.stringify(doc4.content))
      expect(JSON.stringify(results[1].content)).toEqual(JSON.stringify(doc5.content))
      expect(JSON.stringify(results[2].content)).toEqual(JSON.stringify(doc6.content))

      const countResults = await ceramic.index.count(basequery)
      expect(countResults).toEqual(3)
    })
    test('Can query and count multiple documents with multiple key values and valid boundaries, negated', async () => {
      const doc1 = await ModelInstanceDocument.create(ceramic, CONTENT1, midMetadata)
      const doc3 = await ModelInstanceDocument.create(ceramic, CONTENT3, midMetadata)
      const doc5 = await ModelInstanceDocument.create(ceramic, CONTENT5, midMetadata)

      const baseQuery: BaseQuery = {
        model: model.id,
        queryFilters: {
          not: {
            where: {
              myData: { in: [1, 3] },
              myString: { equalTo: 'b' },
            },
          },
        },
      }

      const resultObj0 = await ceramic.index.query({
        last: 5,
        ...baseQuery,
      })
      const results = extractDocuments(ceramic, resultObj0)
      expect(results.length).toEqual(2)
      expect(JSON.stringify(results[0].content)).toEqual(JSON.stringify(doc1.content))
      expect(JSON.stringify(results[1].content)).toEqual(JSON.stringify(doc5.content))

      const countResults = await ceramic.index.count(baseQuery)
      expect(countResults).toEqual(2)
    })
    test('Can query and count documents using a complex negated or filter', async () => {
      const doc0 = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
      const doc1 = await ModelInstanceDocument.create(ceramic, CONTENT1, midMetadata)
      const doc2 = await ModelInstanceDocument.create(ceramic, CONTENT2, midMetadata)
      const doc3 = await ModelInstanceDocument.create(ceramic, CONTENT3, midMetadata)
      const doc4 = await ModelInstanceDocument.create(ceramic, CONTENT4, midMetadata)
      const doc5 = await ModelInstanceDocument.create(ceramic, CONTENT5, midMetadata)
      const doc6 = await ModelInstanceDocument.create(ceramic, CONTENT6, midMetadata)

      const baseQuery: BaseQuery = {
        model: model.id,
        queryFilters: {
          or: [
            {
              not: {
                where: {
                  myData: { greaterThanOrEqualTo: 0, lessThan: 5 },
                },
              },
            },
            {
              where: {
                myData: { equalTo: 1 },
                myString: { equalTo: 'a' },
              },
            },
          ],
        },
      }

      const resultObj0 = await ceramic.index.query({
        last: 5,
        ...baseQuery,
      })
      const results = extractDocuments(ceramic, resultObj0)
      expect(results.length).toEqual(3)
      expect(JSON.stringify(results[0].content)).toEqual(JSON.stringify(doc1.content))
      expect(JSON.stringify(results[1].content)).toEqual(JSON.stringify(doc5.content))
      expect(JSON.stringify(results[2].content)).toEqual(JSON.stringify(doc6.content))

      const countResults = await ceramic.index.count(baseQuery)
      expect(countResults).toEqual(3)
    })
    test('Can query and count documents using a complex negated and filter', async () => {
      const doc0 = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
      const doc1 = await ModelInstanceDocument.create(ceramic, CONTENT1, midMetadata)
      const doc2 = await ModelInstanceDocument.create(ceramic, CONTENT2, midMetadata)
      const doc3 = await ModelInstanceDocument.create(ceramic, CONTENT3, midMetadata)
      const doc4 = await ModelInstanceDocument.create(ceramic, CONTENT4, midMetadata)
      const doc5 = await ModelInstanceDocument.create(ceramic, CONTENT5, midMetadata)
      const doc6 = await ModelInstanceDocument.create(ceramic, CONTENT6, midMetadata)

      const baseQuery: BaseQuery = {
        model: model.id,
        queryFilters: {
          and: [
            {
              not: {
                where: {
                  myData: { greaterThan: 4, lessThanOrEqualTo: 6 },
                },
              },
            },
            {
              where: {
                myString: { isNull: true },
                myFloat: { equalTo: 1.0 },
              },
            },
          ],
        },
      }

      const resultObj0 = await ceramic.index.query({
        last: 5,
        ...baseQuery,
      })
      const results = extractDocuments(ceramic, resultObj0)
      expect(results.length).toEqual(1)
      expect(JSON.stringify(results[0].content)).toEqual(JSON.stringify(doc2.content))

      const countResults = await ceramic.index.count(baseQuery)
      expect(countResults).toEqual(1)
    })
  })

  describe('queries with custom sorting', () => {
    test('multiple documents - one page - ASC order with forward pagination', async () => {
      const doc0 = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
      const doc1 = await ModelInstanceDocument.create(ceramic, CONTENT1, midMetadata)
      const doc2 = await ModelInstanceDocument.create(ceramic, CONTENT2, midMetadata)

      const resultObj = await ceramic.index.query({
        model: model.id,
        sorting: { myData: 'ASC' },
        first: 100,
      })
      const results = extractDocuments(ceramic, resultObj)

      expect(results).toHaveLength(3)
      expect(results[0].id.toString()).toBe(doc0.id.toString())
      expect(results[1].id.toString()).toBe(doc1.id.toString())
      expect(results[2].id.toString()).toBe(doc2.id.toString())
    })

    test('multiple documents - one page - DESC order with forward pagination', async () => {
      const doc0 = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
      const doc1 = await ModelInstanceDocument.create(ceramic, CONTENT1, midMetadata)
      const doc2 = await ModelInstanceDocument.create(ceramic, CONTENT2, midMetadata)

      const resultObj = await ceramic.index.query({
        model: model.id,
        sorting: { myData: 'DESC' },
        first: 100,
      })
      const results = extractDocuments(ceramic, resultObj)

      expect(results).toHaveLength(3)
      expect(results[0].id.toString()).toBe(doc2.id.toString())
      expect(results[1].id.toString()).toBe(doc1.id.toString())
      expect(results[2].id.toString()).toBe(doc0.id.toString())
    })

    test('multiple documents - one page - ASC order with backward pagination', async () => {
      const doc0 = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
      const doc1 = await ModelInstanceDocument.create(ceramic, CONTENT1, midMetadata)
      const doc2 = await ModelInstanceDocument.create(ceramic, CONTENT2, midMetadata)

      const resultObj = await ceramic.index.query({
        model: model.id,
        sorting: { myData: 'ASC' },
        last: 100,
      })
      const results = extractDocuments(ceramic, resultObj)

      expect(results).toHaveLength(3)
      expect(results[0].id.toString()).toBe(doc0.id.toString())
      expect(results[1].id.toString()).toBe(doc1.id.toString())
      expect(results[2].id.toString()).toBe(doc2.id.toString())
    })

    test('multiple documents - one page - DESC order with backward pagination', async () => {
      const doc0 = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
      const doc1 = await ModelInstanceDocument.create(ceramic, CONTENT1, midMetadata)
      const doc2 = await ModelInstanceDocument.create(ceramic, CONTENT2, midMetadata)

      const resultObj = await ceramic.index.query({
        model: model.id,
        sorting: { myData: 'DESC' },
        last: 100,
      })
      const results = extractDocuments(ceramic, resultObj)

      expect(results).toHaveLength(3)
      expect(results[0].id.toString()).toBe(doc2.id.toString())
      expect(results[1].id.toString()).toBe(doc1.id.toString())
      expect(results[2].id.toString()).toBe(doc0.id.toString())
    })

    test('multiple documents - multiple pages - ASC order with forward pagination', async () => {
      const doc1 = await ModelInstanceDocument.create(ceramic, CONTENT1, midMetadata)
      const doc2 = await ModelInstanceDocument.create(ceramic, CONTENT2, midMetadata)
      const doc3 = await ModelInstanceDocument.create(ceramic, CONTENT3, midMetadata)
      const doc4 = await ModelInstanceDocument.create(ceramic, CONTENT4, midMetadata)
      const doc5 = await ModelInstanceDocument.create(ceramic, CONTENT5, midMetadata)
      const doc6 = await ModelInstanceDocument.create(ceramic, CONTENT6, midMetadata)
      const [b1id, b2id] = [doc3.id.toString(), doc6.id.toString()].sort()

      const query = {
        model: model.id,
        queryFilters: { where: { myString: { isNull: false } } },
        sorting: { myString: 'ASC' },
        first: 2,
      }

      const resultObj0 = await ceramic.index.query(query)
      expect(resultObj0.pageInfo.hasNextPage).toBe(true)
      const resultObj1 = await ceramic.index.query({
        ...query,
        after: resultObj0.pageInfo.endCursor,
      })
      expect(resultObj1.pageInfo.hasNextPage).toBe(false)

      const results = [
        extractDocuments(ceramic, resultObj0),
        extractDocuments(ceramic, resultObj1),
      ].flat()
      expect(results).toHaveLength(4)
      // First slice
      expect(results[0].id.toString()).toEqual(doc1.id.toString()) // a
      expect(results[1].id.toString()).toEqual(b1id) // b
      // Second slice
      expect(results[2].id.toString()).toEqual(b2id) // b
      expect(results[3].id.toString()).toEqual(doc5.id.toString()) // c
    })

    test('multiple documents - multiple pages - DESC order with forward pagination', async () => {
      const doc1 = await ModelInstanceDocument.create(ceramic, CONTENT1, midMetadata)
      const doc2 = await ModelInstanceDocument.create(ceramic, CONTENT2, midMetadata)
      const doc3 = await ModelInstanceDocument.create(ceramic, CONTENT3, midMetadata)
      const doc4 = await ModelInstanceDocument.create(ceramic, CONTENT4, midMetadata)
      const doc5 = await ModelInstanceDocument.create(ceramic, CONTENT5, midMetadata)
      const doc6 = await ModelInstanceDocument.create(ceramic, CONTENT6, midMetadata)
      const [b1id, b2id] = [doc3.id.toString(), doc6.id.toString()].sort()

      const query = {
        model: model.id,
        queryFilters: { where: { myString: { isNull: false } } },
        sorting: { myString: 'DESC' },
        first: 2,
      }

      const resultObj0 = await ceramic.index.query(query)
      expect(resultObj0.pageInfo.hasNextPage).toBe(true)
      const resultObj1 = await ceramic.index.query({
        ...query,
        after: resultObj0.pageInfo.endCursor,
      })
      expect(resultObj1.pageInfo.hasNextPage).toBe(false)

      const results = [
        extractDocuments(ceramic, resultObj0),
        extractDocuments(ceramic, resultObj1),
      ].flat()
      expect(results).toHaveLength(4)
      // First slice
      expect(results[0].id.toString()).toEqual(doc5.id.toString()) // c
      expect(results[1].id.toString()).toEqual(b1id) // b
      // Second slice
      expect(results[2].id.toString()).toEqual(b2id) // b
      expect(results[3].id.toString()).toEqual(doc1.id.toString()) // a
    })

    test('multiple documents - multiple pages - ASC order with backward pagination', async () => {
      const doc1 = await ModelInstanceDocument.create(ceramic, CONTENT1, midMetadata)
      const doc2 = await ModelInstanceDocument.create(ceramic, CONTENT2, midMetadata)
      const doc3 = await ModelInstanceDocument.create(ceramic, CONTENT3, midMetadata)
      const doc4 = await ModelInstanceDocument.create(ceramic, CONTENT4, midMetadata)
      const doc5 = await ModelInstanceDocument.create(ceramic, CONTENT5, midMetadata)
      const doc6 = await ModelInstanceDocument.create(ceramic, CONTENT6, midMetadata)
      const [b1id, b2id] = [doc3.id.toString(), doc6.id.toString()].sort()

      const query = {
        model: model.id,
        queryFilters: { where: { myString: { isNull: false } } },
        sorting: { myString: 'ASC' }, // Need to flip to DESC in query
        last: 2,
      }

      const resultObj0 = await ceramic.index.query(query)
      expect(resultObj0.pageInfo.hasPreviousPage).toBe(true)
      const resultObj1 = await ceramic.index.query({
        ...query,
        before: resultObj0.pageInfo.startCursor,
      })
      expect(resultObj1.pageInfo.hasPreviousPage).toBe(false)

      const results = [
        extractDocuments(ceramic, resultObj0),
        extractDocuments(ceramic, resultObj1),
      ].flat()
      expect(results).toHaveLength(4)
      // First slice
      expect(results[0].id.toString()).toEqual(b1id) // b
      expect(results[1].id.toString()).toEqual(doc5.id.toString()) // c
      // Second slice
      expect(results[2].id.toString()).toEqual(doc1.id.toString()) // a
      expect(results[3].id.toString()).toEqual(b2id) // b
    })

    test('multiple documents - multiple pages - DESC order with backward pagination', async () => {
      const doc1 = await ModelInstanceDocument.create(ceramic, CONTENT1, midMetadata)
      const doc2 = await ModelInstanceDocument.create(ceramic, CONTENT2, midMetadata)
      const doc3 = await ModelInstanceDocument.create(ceramic, CONTENT3, midMetadata)
      const doc4 = await ModelInstanceDocument.create(ceramic, CONTENT4, midMetadata)
      const doc5 = await ModelInstanceDocument.create(ceramic, CONTENT5, midMetadata)
      const doc6 = await ModelInstanceDocument.create(ceramic, CONTENT6, midMetadata)
      const [b1id, b2id] = [doc3.id.toString(), doc6.id.toString()].sort()

      const query = {
        model: model.id,
        queryFilters: { where: { myString: { isNull: false } } },
        sorting: { myString: 'DESC' },
        last: 2,
      }

      const resultObj0 = await ceramic.index.query(query)
      expect(resultObj0.pageInfo.hasPreviousPage).toBe(true)
      const resultObj1 = await ceramic.index.query({
        ...query,
        before: resultObj0.pageInfo.startCursor,
      })
      expect(resultObj1.pageInfo.hasPreviousPage).toBe(false)

      const results = [
        extractDocuments(ceramic, resultObj0),
        extractDocuments(ceramic, resultObj1),
      ].flat()
      expect(results).toHaveLength(4)
      // First slice
      expect(results[0].id.toString()).toEqual(b1id) // b
      expect(results[1].id.toString()).toEqual(doc1.id.toString()) // a
      // Second slice
      expect(results[2].id.toString()).toEqual(doc5.id.toString()) // c
      expect(results[3].id.toString()).toEqual(b2id) // b
    })
  })

  describe('Queries with filters on relations', () => {
    // TODO(CDB-1895): add test with filter on multiple relations

    test(
      'basic filter',
      async () => {
        const referencedDoc0 = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
        const referencedDoc1 = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)

        const doc0 = await ModelInstanceDocument.create(
          ceramic,
          { linkedDoc: referencedDoc0.id.toString() },
          midRelationMetadata
        )
        const doc1 = await ModelInstanceDocument.create(
          ceramic,
          { linkedDoc: referencedDoc1.id.toString() },
          midRelationMetadata
        )
        const doc2 = await ModelInstanceDocument.create(
          ceramic,
          { linkedDoc: referencedDoc1.id.toString() },
          midRelationMetadata
        )

        let resultObj = await ceramic.index.query({
          model: modelWithRelation.id,
          first: 100,
          filter: { linkedDoc: referencedDoc0.id.toString() },
        })
        let results = extractDocuments(ceramic, resultObj)
        expect(results.length).toEqual(1)
        expect(results[0].id.toString()).toEqual(doc0.id.toString())
        expect(results[0].content).toEqual(doc0.content)
        expect(results[0].state).toEqual(doc0.state)

        resultObj = await ceramic.index.query({
          model: modelWithRelation.id,
          first: 100,
          filter: { linkedDoc: referencedDoc1.id.toString() },
        })
        results = extractDocuments(ceramic, resultObj)
        expect(results.length).toEqual(2)
        expect(results[0].id.toString()).toEqual(doc1.id.toString())
        expect(results[0].content).toEqual(doc1.content)
        expect(results[0].state).toEqual(doc1.state)
        expect(results[1].id.toString()).toEqual(doc2.id.toString())
        expect(results[1].content).toEqual(doc2.content)
        expect(results[1].state).toEqual(doc2.state)

        // Now check with 'last' queries
        resultObj = await ceramic.index.query({
          model: modelWithRelation.id,
          last: 100,
          filter: { linkedDoc: referencedDoc0.id.toString() },
        })
        results = extractDocuments(ceramic, resultObj)
        expect(results.length).toEqual(1)
        expect(results[0].id.toString()).toEqual(doc0.id.toString())
        expect(results[0].content).toEqual(doc0.content)
        expect(results[0].state).toEqual(doc0.state)

        resultObj = await ceramic.index.query({
          model: modelWithRelation.id,
          last: 100,
          filter: { linkedDoc: referencedDoc1.id.toString() },
        })
        results = extractDocuments(ceramic, resultObj)
        expect(results.length).toEqual(2)
        expect(results[0].id.toString()).toEqual(doc1.id.toString())
        expect(results[0].content).toEqual(doc1.content)
        expect(results[0].state).toEqual(doc1.state)
        expect(results[1].id.toString()).toEqual(doc2.id.toString())
        expect(results[1].content).toEqual(doc2.content)
        expect(results[1].state).toEqual(doc2.state)
      },
      1000 * 30
    )

    test(
      'filter on relation and controller',
      async () => {
        const referencedDoc0 = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
        const referencedDoc1 = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)

        // Create two docs with the original DID, referencing two different docs in the linked model
        const originalDid = ceramic.did
        const doc0A = await ModelInstanceDocument.create(
          ceramic,
          { linkedDoc: referencedDoc0.id.toString() },
          midRelationMetadata
        )
        await ModelInstanceDocument.create(
          ceramic,
          { linkedDoc: referencedDoc1.id.toString() },
          midRelationMetadata
        )

        // Now create two more docs with a different DID as the controller, referencing the same
        // docs as the two we just made with the original DID.
        ceramic.did = makeDID(ceramic, 'new seed for new DID!')
        await ceramic.did.authenticate()
        console.log(
          `originalDID: ${originalDid.id.toString()}, new DID: ${ceramic.did.id.toString()}`
        )
        await ModelInstanceDocument.create(
          ceramic,
          { linkedDoc: referencedDoc0.id.toString() },
          midRelationMetadata
        )
        await ModelInstanceDocument.create(
          ceramic,
          { linkedDoc: referencedDoc1.id.toString() },
          midRelationMetadata
        )

        // Querying for a single relation should find two documents - one with each controller
        const resultObj0 = await ceramic.index.query({
          model: modelWithRelation.id,
          first: 100,
          filter: { linkedDoc: referencedDoc0.id.toString() },
        })
        const results0 = extractDocuments(ceramic, resultObj0)
        expect(results0.length).toEqual(2)

        // Querying for a single relation should find two documents - one with each controller
        const resultObj1 = await ceramic.index.query({
          model: modelWithRelation.id,
          account: originalDid.id.toString(),
          first: 100,
          filter: { linkedDoc: referencedDoc0.id.toString() },
        })
        const results1 = extractDocuments(ceramic, resultObj1)
        expect(results1.length).toEqual(1)
        expect(results1[0].id.toString()).toEqual(doc0A.id.toString())
      },
      1000 * 30
    )

    test(
      'count queries with filters on accounts and relations',
      async () => {
        const referencedDoc0 = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
        const referencedDoc1 = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
        await expect(ceramic.index.count({ model: model.id.toString() })).resolves.toEqual(2)

        // Create two docs with the original DID, referencing two different docs in the linked model
        const originalDid = ceramic.did
        const doc0A = await ModelInstanceDocument.create(
          ceramic,
          { linkedDoc: referencedDoc0.id.toString() },
          midRelationMetadata
        )

        await expect(
          ceramic.index.count({ model: modelWithRelation.id.toString() })
        ).resolves.toEqual(1)

        await ModelInstanceDocument.create(
          ceramic,
          { linkedDoc: referencedDoc1.id.toString() },
          midRelationMetadata
        )

        await expect(
          ceramic.index.count({ model: modelWithRelation.id.toString() })
        ).resolves.toEqual(2)

        await expect(
          ceramic.index.count({
            model: modelWithRelation.id.toString(),
            filter: { linkedDoc: referencedDoc0.id.toString() },
          })
        ).resolves.toEqual(1)

        // Now create two more docs with a different DID as the controller, referencing the same
        // docs as the two we just made with the original DID.
        ceramic.did = makeDID(ceramic, 'new seed for new DID!')
        await ceramic.did.authenticate()
        console.log(
          `originalDID: ${originalDid.id.toString()}, new DID: ${ceramic.did.id.toString()}`
        )
        await ModelInstanceDocument.create(
          ceramic,
          { linkedDoc: referencedDoc0.id.toString() },
          midRelationMetadata
        )

        await expect(
          ceramic.index.count({ model: modelWithRelation.id.toString() })
        ).resolves.toEqual(3)

        await ModelInstanceDocument.create(
          ceramic,
          { linkedDoc: referencedDoc1.id.toString() },
          midRelationMetadata
        )

        // Count all docs in the model with the relation
        await expect(
          ceramic.index.count({ model: modelWithRelation.id.toString() })
        ).resolves.toEqual(4)

        // Count docs with a specific relation
        await expect(
          ceramic.index.count({
            model: modelWithRelation.id.toString(),
            filter: { linkedDoc: referencedDoc0.id.toString() },
          })
        ).resolves.toEqual(2)

        // count docs with a specific controller
        await expect(
          ceramic.index.count({
            model: modelWithRelation.id.toString(),
            account: originalDid.id.toString(),
          })
        ).resolves.toEqual(2)

        // count docs with a specific relation AND a specific controller
        await expect(
          ceramic.index.count({
            model: modelWithRelation.id.toString(),
            account: originalDid.id.toString(),
            filter: { linkedDoc: referencedDoc0.id.toString() },
          })
        ).resolves.toEqual(1)
      },
      1000 * 30
    )

    test('Index survives node restart', async () => {
      const referencedDoc0 = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
      const referencedDoc1 = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)

      const doc0 = await ModelInstanceDocument.create(
        ceramic,
        { linkedDoc: referencedDoc0.id.toString() },
        midRelationMetadata
      )
      await ModelInstanceDocument.create(
        ceramic,
        { linkedDoc: referencedDoc1.id.toString() },
        midRelationMetadata
      )

      await expect(
        ceramic.index.count({ model: modelWithRelation.id.toString() })
      ).resolves.toEqual(2)
      let resultObj = await ceramic.index.query({
        model: modelWithRelation.id,
        first: 100,
        filter: { linkedDoc: referencedDoc0.id.toString() },
      })
      let results = extractDocuments(ceramic, resultObj)
      expect(results.length).toEqual(1)
      expect(results[0].id.toString()).toEqual(doc0.id.toString())

      await daemon.close()
      await ceramic.close()

      await TestUtils.delay(3000) // to give time for Ceramic to fully shut down.

      await setupCeramic() // Restart Ceramic with the same index database and state store

      // Reads and writes still work

      await ModelInstanceDocument.create(
        ceramic,
        { linkedDoc: referencedDoc1.id.toString() },
        midRelationMetadata
      )
      await expect(
        ceramic.index.count({ model: modelWithRelation.id.toString() })
      ).resolves.toEqual(3)
      resultObj = await ceramic.index.query({
        model: modelWithRelation.id,
        first: 100,
        filter: { linkedDoc: referencedDoc0.id.toString() },
      })
      results = extractDocuments(ceramic, resultObj)
      expect(results.length).toEqual(1)
      expect(results[0].id.toString()).toEqual(doc0.id.toString())
    })
  })

  describe('queries by interface', () => {
    async function indexInterfaceModels() {
      await Model.create(ceramic, MODEL_INTERFACE_DEFINITION)
      await Promise.all([
        Model.create(ceramic, MODEL_IMPLEMENTS_DEFINITION1),
        Model.create(ceramic, MODEL_IMPLEMENTS_DEFINITION2),
      ])
      await core.index.indexModels([
        { streamID: MODEL_IMPLEMENTS_ID1 },
        { streamID: MODEL_IMPLEMENTS_ID2 },
      ])
    }

    test('matches all documents implementing an interface', async () => {
      await indexInterfaceModels()

      // Should be included in results
      const doc0 = await ModelInstanceDocument.create(
        ceramic,
        { title: 'one' },
        { model: MODEL_IMPLEMENTS_ID1 }
      )
      const doc1 = await ModelInstanceDocument.create(
        ceramic,
        { title: 'two' },
        { model: MODEL_IMPLEMENTS_ID1 }
      )
      const doc2 = await ModelInstanceDocument.create(
        ceramic,
        { title: 'three' },
        { model: MODEL_IMPLEMENTS_ID2 }
      )
      // Should not be included in results
      const doc3 = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
      const doc4 = await ModelInstanceDocument.create(ceramic, CONTENT1, midMetadata)

      const query: BaseQuery = { models: [MODEL_INTERFACE_ID] }
      await expect(ceramic.index.count(query)).resolves.toBe(3)

      const results = await ceramic.index.query({ ...query, first: 5 })
      const ids = extractDocuments(ceramic, results).map((doc) => doc.id.toString())
      expect(ids).toEqual([doc0.id.toString(), doc1.id.toString(), doc2.id.toString()])
    })

    test('applies filters', async () => {
      await indexInterfaceModels()

      // Should be included in results
      const doc0 = await ModelInstanceDocument.create(
        ceramic,
        { title: 'one', rating: 4.7 },
        { model: MODEL_IMPLEMENTS_ID1 }
      )
      const doc1 = await ModelInstanceDocument.create(
        ceramic,
        { title: 'two', rating: 2.7 },
        { model: MODEL_IMPLEMENTS_ID1 }
      )
      const doc2 = await ModelInstanceDocument.create(
        ceramic,
        { title: 'three', rating: 3.4 },
        { model: MODEL_IMPLEMENTS_ID2 }
      )
      // Should not be included in results
      const doc3 = await ModelInstanceDocument.create(
        ceramic,
        { title: 'four', rating: 1.4 },
        { model: MODEL_IMPLEMENTS_ID2 }
      )
      const doc4 = await ModelInstanceDocument.create(
        ceramic,
        { title: 'five', rating: 2.1 },
        { model: MODEL_IMPLEMENTS_ID1 }
      )

      const query: BaseQuery = {
        models: [MODEL_INTERFACE_ID],
        queryFilters: { where: { rating: { greaterThan: 2.3 } } },
        sorting: { rating: 'ASC' },
      }
      await expect(ceramic.index.count(query)).resolves.toBe(3)

      const results = await ceramic.index.query({ ...query, first: 5 })
      const ids = extractDocuments(ceramic, results).map((doc) => doc.id.toString())
      expect(ids).toEqual([doc1.id.toString(), doc2.id.toString(), doc0.id.toString()])
    })
  })
})
