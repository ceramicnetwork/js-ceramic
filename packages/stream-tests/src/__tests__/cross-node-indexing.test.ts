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
import pgSetup from '@databases/pg-test/jest/globalSetup'
import pgTeardown from '@databases/pg-test/jest/globalTeardown'
import knex, { Knex } from 'knex'
import { INDEXED_MODEL_CONFIG_TABLE_NAME } from '@ceramicnetwork/core'

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

type CrossNodeIndexingTestEnv = {
  ceramicInstanceWithPostgres: 1 | 2
}

const envs: Array<CrossNodeIndexingTestEnv> = [
  { ceramicInstanceWithPostgres: 1 },
  { ceramicInstanceWithPostgres: 2 },
]

describe.each(envs)(
  'Cross-node indexing and query test with ceramic$ceramicInstanceWithPostgres running postgres',
  (env) => {
    jest.setTimeout(1000 * 30)

    let ipfs1: IpfsApi
    let ceramic1: Ceramic
    let ipfs2: IpfsApi
    let ceramic2: Ceramic
    let model: Model
    let midMetadata: ModelInstanceDocumentMetadataArgs
    let dbConnection: Knex

    async function dropKnexTables() {
      await dbConnection.schema.dropTableIfExists(INDEXED_MODEL_CONFIG_TABLE_NAME)
      await dbConnection.schema.dropTableIfExists(Model.MODEL.toString())
      await dbConnection.schema.dropTableIfExists(model.id.toString())
    }

    beforeAll(async () => {
      process.env.CERAMIC_ENABLE_EXPERIMENTAL_COMPOSE_DB = 'true'

      await pgSetup()

      ipfs1 = await createIPFS()
      ipfs2 = await createIPFS()

      // Temporarily start a Ceramic node and use it to create the Model that will be used in the
      // rest of the tests.
      if (env.ceramicInstanceWithPostgres === 1) {
        ceramic1 = await createCeramic(ipfs1, {
          indexing: {
            db: process.env.DATABASE_URL,
            allowQueriesBeforeHistoricalSync: true,
          },
        })
      } else {
        ceramic1 = await createCeramic(ipfs1)
      }

      model = await Model.create(ceramic1, MODEL_DEFINITION)
      midMetadata = { model: model.id }

      await ceramic1.close()
    })

    afterAll(async () => {
      await ipfs1.stop()
      await ipfs2.stop()
      await pgTeardown()
    })

    beforeEach(async () => {
      const indexingDirectory = await tmp.tmpName()
      await fs.mkdir(indexingDirectory)

      let ceramic1DbUrl: string
      let ceramic2DbUrl: string

      dbConnection = knex({
        client: 'pg',
        connection: process.env.DATABASE_URL,
      })

      switch (env.ceramicInstanceWithPostgres) {
        case 1:
          ceramic1DbUrl = process.env.DATABASE_URL
          ceramic2DbUrl = `sqlite://${indexingDirectory}/ceramic.sqlite`
          break
        case 2:
          ceramic2DbUrl = process.env.DATABASE_URL
          ceramic1DbUrl = `sqlite://${indexingDirectory}/ceramic.sqlite`
          break
      }

      ceramic1 = await createCeramic(ipfs1, {
        indexing: {
          db: ceramic1DbUrl,
          models: [],
          allowQueriesBeforeHistoricalSync: true,
        },
      })
      await ceramic1.index.indexModels([model.id])

      ceramic2 = await createCeramic(ipfs2, {
        indexing: {
          db: ceramic2DbUrl,
          allowQueriesBeforeHistoricalSync: true,
        },
      })
      await ceramic2.index.indexModels([model.id])
    }, 30 * 1000)

    afterEach(async () => {
      await ceramic1.close()
      await ceramic2.close()
      await dropKnexTables()
      await dbConnection.destroy()
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
  }
)
