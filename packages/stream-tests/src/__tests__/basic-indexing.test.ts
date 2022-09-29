import { jest } from '@jest/globals'
import getPort from 'get-port'
import { IpfsApi, Page, StreamState, TestUtils } from '@ceramicnetwork/common'
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

const CONTENT0 = { myData: 0 }
const CONTENT1 = { myData: 1 }
const CONTENT2 = { myData: 2 }
const CONTENT3 = { myData: 3 }
const CONTENT4 = { myData: 4 }
const CONTENT5 = { myData: 5 }

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

// The model above will always result in this StreamID when created with the fixed did:key
// controller used by the test.
const MODEL_STREAM_ID = 'kjzl6hvfrbw6c9rpdsro0cldierurftxvlr0uzh5nt3yqsje7t4ykfcnnnkjxtq'

// StreamID for a model that isn't indexed by the node
const UNINDEXED_MODEL_STREAM_ID = StreamID.fromString(
  'kjzl6hvfrbw6c9rpdsro0cldierurftxvlr0uzh5nt3yqsje7t4ykfcnnnkjxtr'
)

const MODEL_WITH_RELATION_DEFINITION: ModelDefinition = {
  name: 'MyModel',
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

const extractStreamStates = function (page: Page<StreamState>): Array<StreamState> {
  return page.edges.map((edge) => edge.node)
}

const extractDocuments = function (
  ceramic: CeramicClient,
  page: Page<StreamState>
): Array<ModelInstanceDocument> {
  return extractStreamStates(page).map((state) =>
    ceramic.buildStreamFromState<ModelInstanceDocument>(state)
  )
}

describe('Basic end-to-end indexing query test', () => {
  jest.setTimeout(1000 * 30)

  let ipfs: IpfsApi
  let port: number
  let core: Ceramic
  let daemon: CeramicDaemon
  let ceramic: CeramicClient
  let model: Model
  let midMetadata: ModelInstanceDocumentMetadataArgs
  let modelWithRelation: Model
  let midRelationMetadata: ModelInstanceDocumentMetadataArgs

  beforeAll(async () => {
    ipfs = await createIPFS()
  })

  afterAll(async () => {
    await ipfs.stop()
  })

  beforeEach(async () => {
    process.env.CERAMIC_ENABLE_EXPERIMENTAL_COMPOSE_DB = 'true'

    const indexingDirectory = await tmp.tmpName()
    await fs.mkdir(indexingDirectory)
    core = await createCeramic(ipfs, {
      indexing: {
        db: `sqlite://${indexingDirectory}/ceramic.sqlite`,
        models: [],
        allowQueriesBeforeHistoricalSync: true,
      },
    })

    port = await getPort()
    const apiUrl = 'http://localhost:' + port
    daemon = new CeramicDaemon(core, DaemonConfig.fromObject({ 'http-api': { port } }))
    await daemon.listen()
    ceramic = new CeramicClient(apiUrl)
    ceramic.did = core.did

    model = await Model.create(ceramic, MODEL_DEFINITION)
    expect(model.id.toString()).toEqual(MODEL_STREAM_ID)
    midMetadata = { model: model.id }
    modelWithRelation = await Model.create(ceramic, MODEL_WITH_RELATION_DEFINITION)
    midRelationMetadata = { model: modelWithRelation.id }

    await core.index.indexModels([model.id, modelWithRelation.id])
  }, 30 * 1000)

  afterEach(async () => {
    await ceramic.close()
    await daemon.close()
    await core.close()
  })

  test('basic query', async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
    // Indexed streams should always get pinned, regardless of the 'pin' flag
    await expect(TestUtils.isPinned(ceramic, doc.id)).toBeTruthy()

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

    console.log(`docIds: [${doc1.id.toString()}, ${doc2.id.toString()}, ${doc3.id.toString()}]`)

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

  describe('Queries with filters on relations', () => {
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

        const resultObj0 = await ceramic.index.query({
          model: modelWithRelation.id,
          first: 100,
          filter: { linkedDoc: referencedDoc0.id.toString() },
        })
        const results0 = extractDocuments(ceramic, resultObj0)
        expect(results0.length).toEqual(1)
        expect(results0[0].id.toString()).toEqual(doc0.id.toString())
        expect(results0[0].content).toEqual(doc0.content)
        expect(results0[0].state).toEqual(doc0.state)

        const resultObj1 = await ceramic.index.query({
          model: modelWithRelation.id,
          first: 100,
          filter: { linkedDoc: referencedDoc1.id.toString() },
        })
        const results1 = extractDocuments(ceramic, resultObj1)
        expect(results1.length).toEqual(1)
        expect(results1[0].id.toString()).toEqual(doc1.id.toString())
        expect(results1[0].content).toEqual(doc1.content)
        expect(results1[0].state).toEqual(doc1.state)

        // TODO(CDB-1868): add test with filters on relations AND controller
        // TODO(CDB-1868): add test with filter on multiple relations
      },
      1000 * 30
    )
  })
})
