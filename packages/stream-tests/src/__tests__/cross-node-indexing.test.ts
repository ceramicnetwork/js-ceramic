import { jest } from '@jest/globals'
import { IpfsApi, Page, StreamState, StreamUtils, TestUtils } from '@ceramicnetwork/common'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import {
  ModelInstanceDocument,
  ModelInstanceDocumentMetadataArgs,
} from '@ceramicnetwork/stream-model-instance'
import { createCeramic } from '../create-ceramic.js'
import { Ceramic } from '@ceramicnetwork/core'
import { Model, ModelDefinition } from '@ceramicnetwork/stream-model'
import tmp from 'tmp-promise'
import * as fs from 'fs/promises'

const CONTENT0 = { myData: 0 }
const CONTENT1 = { myData: 1 }
const CONTENT2 = { myData: 2 }

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
  ceramic: Ceramic,
  page: Page<StreamState>
): Array<ModelInstanceDocument> {
  return extractStreamStates(page).map((state) =>
    ceramic.buildStreamFromState<ModelInstanceDocument>(state)
  )
}

describe('Cross-node indexing and query test', () => {
  jest.setTimeout(1000 * 30)

  let ipfs1: IpfsApi
  let ceramic1: Ceramic
  let ipfs2: IpfsApi
  let ceramic2: Ceramic
  let model: Model
  let midMetadata: ModelInstanceDocumentMetadataArgs
  let modelWithRelation: Model
  let midRelationMetadata: ModelInstanceDocumentMetadataArgs

  beforeAll(async () => {
    process.env.CERAMIC_ENABLE_EXPERIMENTAL_COMPOSE_DB = 'true'

    ipfs1 = await createIPFS()
    ipfs2 = await createIPFS()
  })

  afterAll(async () => {
    await ipfs1.stop()
    await ipfs2.stop()
  })

  beforeEach(async () => {
    const indexingDirectory1 = await tmp.tmpName()
    await fs.mkdir(indexingDirectory1)
    ceramic1 = await createCeramic(ipfs1, {
      indexing: {
        db: `sqlite://${indexingDirectory1}/ceramic.sqlite`,
        models: [],
        allowQueriesBeforeHistoricalSync: true,
      },
    })

    model = await Model.create(ceramic1, MODEL_DEFINITION)
    expect(model.id.toString()).toEqual(MODEL_STREAM_ID)
    midMetadata = { model: model.id }
    modelWithRelation = await Model.create(ceramic1, MODEL_WITH_RELATION_DEFINITION)
    midRelationMetadata = { model: modelWithRelation.id }

    await ceramic1.index.indexModels([model.id, modelWithRelation.id])
    const indexingDirectory2 = await tmp.tmpName()
    await fs.mkdir(indexingDirectory2)
    ceramic2 = await createCeramic(ipfs2, {
      indexing: {
        db: `sqlite://${indexingDirectory2}/ceramic.sqlite`,
        models: [],
        allowQueriesBeforeHistoricalSync: true,
      },
    })
    await ceramic2.index.indexModels([model.id, modelWithRelation.id])
  }, 30 * 1000)

  afterEach(async () => {
    await ceramic1.close()
    await ceramic2.close()
  })

  test('Index is synced across nodes', async () => {
    const doc1 = await ModelInstanceDocument.create(ceramic1, CONTENT0, midMetadata, {
      anchor: false,
    })

    // TODO: Once we support subscriptions, use a subscription to wait for the stream to show up
    // in the index, instead of this race-prone sleep.
    await TestUtils.delay(5 * 1000)

    let resultObj = await ceramic2.index.query({ model: model.id, first: 100 })
    let results = extractDocuments(ceramic2, resultObj)

    expect(results.length).toEqual(1)
    expect(results[0].id.toString()).toEqual(doc1.id.toString())
    expect(results[0].content).toEqual(CONTENT0)
    expect(results[0].state).toEqual(doc1.state)

    // Now update an existing stream and create a new stream and make sure the index updates properly
    await doc1.replace(CONTENT1, { anchor: false })
    const doc2 = await ModelInstanceDocument.create(ceramic1, CONTENT2, midMetadata, {
      anchor: false,
    })

    // TODO: Once we support subscriptions, use a subscription to wait for the stream to show up
    // in the index, instead of this race-prone sleep.
    await TestUtils.delay(5 * 1000)

    resultObj = await ceramic2.index.query({ model: model.id, first: 100 })
    results = extractDocuments(ceramic2, resultObj)

    expect(results.length).toEqual(2)
    expect(results[0].id.toString()).toEqual(doc1.id.toString())
    expect(results[0].content).toEqual(CONTENT1)
    // TODO: Why do I need to serialize state for this to work?
    expect(StreamUtils.serializeState(results[0].state)).toEqual(
      StreamUtils.serializeState(doc1.state)
    )
    expect(results[1].id.toString()).toEqual(doc2.id.toString())
    expect(results[1].content).toEqual(CONTENT2)
    expect(results[1].state).toEqual(doc2.state)
  })

  test('Loading a stream adds it to the index', async () => {
    const doc1 = await ModelInstanceDocument.create(ceramic1, CONTENT0, midMetadata, {
      publish: false,
      anchor: false,
    })

    // Since ceramic1 didn't publish the commit, ceramic2 won't know about it.
    let resultObj = await ceramic2.index.query({ model: model.id, first: 100 })
    let results = extractDocuments(ceramic2, resultObj)
    expect(results.length).toEqual(0)

    // Explicitly loading the stream on ceramic2 should add it to the index.
    const doc2 = await ModelInstanceDocument.load(ceramic2, doc1.id)
    expect(doc1.content).toEqual(doc2.content)
    // Indexed streams should always get pinned, regardless of the 'pin' flag
    await expect(TestUtils.isPinned(ceramic2, doc1.id)).toBeTruthy()

    resultObj = await ceramic2.index.query({ model: model.id, first: 100 })
    results = extractDocuments(ceramic2, resultObj)
    expect(results.length).toEqual(1)
    expect(results[0].id.toString()).toEqual(doc1.id.toString())
    expect(results[0].content).toEqual(doc1.content)
    expect(results[0].state).toEqual(doc1.state)
  })

  test('Can index stream before indexing the stream it has a relation to', async () => {
    const doc1 = await ModelInstanceDocument.create(ceramic1, CONTENT0, midMetadata, {
      publish: false,
      anchor: false,
    })
    const doc2 = await ModelInstanceDocument.create(
      ceramic1,
      { linkedDoc: doc1.id.toString() },
      midRelationMetadata
    )

    // Wait for doc2 creation to propagate to ceramic2
    // TODO: Once we support subscriptions, use a subscription to wait for the stream to show up
    // in the index, instead of this race-prone sleep.
    await TestUtils.delay(5 * 1000)

    await expect(ceramic2.index.count({ model: model.id })).resolves.toEqual(0)
    await expect(ceramic2.index.count({ model: modelWithRelation.id })).resolves.toEqual(1)
    await expect(
      ceramic2.index.count({ model: modelWithRelation.id, filter: { linkedDoc: doc1.id } })
    ).resolves.toEqual(1)
  })
})
