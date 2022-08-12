import { jest } from '@jest/globals'
import getPort from 'get-port'
import { IpfsApi, Page, StreamState } from '@ceramicnetwork/common'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import {
  ModelInstanceDocument,
  ModelInstanceDocumentMetadataArgs,
} from '@ceramicnetwork/stream-model-instance'
import { createCeramic } from '../create-ceramic.js'
import { Ceramic } from '@ceramicnetwork/core'
import { CeramicDaemon, DaemonConfig } from '@ceramicnetwork/cli'
import { CeramicClient } from '@ceramicnetwork/http-client'
import { Model, ModelAccountRelation, ModelDefinition } from '@ceramicnetwork/stream-model'
import tmp from 'tmp-promise'
import * as fs from 'fs/promises'

const CONTENT0 = { myData: 0 }
const CONTENT1 = { myData: 1 }
const CONTENT2 = { myData: 2 }
const CONTENT3 = { myData: 3 }
const CONTENT4 = { myData: 4 }
const CONTENT5 = { myData: 5 }

const MODEL_DEFINITION: ModelDefinition = {
  name: 'MyModel',
  accountRelation: ModelAccountRelation.LIST,
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

  beforeAll(async () => {
    process.env.CERAMIC_ENABLE_EXPERIMENTAL_INDEXING = 'true'

    ipfs = await createIPFS()

    port = await getPort()
    const apiUrl = 'http://localhost:' + port

    // Temporarily start a Ceramic node and use it to create the Model that will be used in the
    // rest of the tests.
    core = await createCeramic(ipfs)
    daemon = new CeramicDaemon(core, DaemonConfig.fromObject({ 'http-api': { port } }))
    await daemon.listen()
    ceramic = new CeramicClient(apiUrl)
    ceramic.setDID(core.did)

    model = await Model.create(ceramic, MODEL_DEFINITION)
    midMetadata = { model: model.id }

    await daemon.close()
    await core.close()
  })

  afterAll(async () => {
    await ipfs.stop()
  })

  beforeEach(async () => {
    const indexingDirectory = await tmp.tmpName()
    await fs.mkdir(indexingDirectory)
    core = await createCeramic(ipfs, {
      indexing: {
        db: `sqlite://${indexingDirectory}/ceramic.sqlite`,
        models: [model.id.toString()],
        allowQueriesBeforeHistoricalSync: true,
      },
    })
    daemon = new CeramicDaemon(core, DaemonConfig.fromObject({ 'http-api': { port } }))
    await daemon.listen()
  }, 30 * 1000)

  afterEach(async () => {
    await ceramic.close()
    await daemon.close()
    await core.close()
  })

  test('basic query', async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)

    const resultObj = await ceramic.index.queryIndex({ model: model.id, first: 100 })
    const results = await extractDocuments(ceramic, resultObj)

    expect(results.length).toEqual(1)
    expect(results[0].id.toString()).toEqual(doc.id.toString())
    expect(results[0].content).toEqual(doc.content)
    expect(results[0].state).toEqual(doc.state)
  })

  test('multiple documents - one page', async () => {
    const doc1 = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
    await doc1.replace(CONTENT1)
    const doc2 = await ModelInstanceDocument.create(ceramic, CONTENT2, midMetadata)
    const doc3 = await ModelInstanceDocument.create(ceramic, CONTENT3, midMetadata)

    const resultObj = await ceramic.index.queryIndex({ model: model.id, first: 100 })
    const results = await extractDocuments(ceramic, resultObj)

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

    const resultObj0 = await ceramic.index.queryIndex({ model: model.id, first: 2 })
    expect(resultObj0.pageInfo.hasNextPage).toBeTruthy()
    const resultObj1 = await ceramic.index.queryIndex({
      model: model.id,
      first: 2,
      after: resultObj0.pageInfo.endCursor,
    })
    expect(resultObj1.pageInfo.hasNextPage).toBeTruthy()
    const resultObj2 = await ceramic.index.queryIndex({
      model: model.id,
      first: 2,
      after: resultObj1.pageInfo.endCursor,
    })
    expect(resultObj2.pageInfo.hasNextPage).toBeFalsy()

    const results = (
      await Promise.all([
        extractDocuments(ceramic, resultObj0),
        extractDocuments(ceramic, resultObj1),
        extractDocuments(ceramic, resultObj2),
      ])
    ).flat()

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

    const resultObj = await ceramic.index.queryIndex({ model: model.id, last: 100 })
    const results = await extractDocuments(ceramic, resultObj)

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

    const resultObj0 = await ceramic.index.queryIndex({ model: model.id, last: 2 })
    expect(resultObj0.pageInfo.hasPreviousPage).toBeTruthy()
    const resultObj1 = await ceramic.index.queryIndex({
      model: model.id,
      last: 2,
      before: resultObj0.pageInfo.startCursor,
    })
    expect(resultObj1.pageInfo.hasPreviousPage).toBeTruthy()
    const resultObj2 = await ceramic.index.queryIndex({
      model: model.id,
      last: 2,
      before: resultObj1.pageInfo.startCursor,
    })
    expect(resultObj2.pageInfo.hasPreviousPage).toBeFalsy()

    const results = (
      await Promise.all([
        extractDocuments(ceramic, resultObj2),
        extractDocuments(ceramic, resultObj1),
        extractDocuments(ceramic, resultObj0),
      ])
    ).flat()

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
