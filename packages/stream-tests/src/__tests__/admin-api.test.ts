import { jest } from '@jest/globals'
import getPort from 'get-port'
import { IpfsApi, Page, StreamState, TestUtils } from '@ceramicnetwork/common'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { ModelInstanceDocument } from '@ceramicnetwork/stream-model-instance'
import { createCeramic } from '../create-ceramic.js'
import { Ceramic } from '@ceramicnetwork/core'
import { CeramicDaemon, DaemonConfig } from '@ceramicnetwork/cli'
import { CeramicClient } from '@ceramicnetwork/http-client'
import { Model, ModelDefinition } from '@ceramicnetwork/stream-model'
import tmp from 'tmp-promise'
import * as fs from 'fs/promises'
import { DID } from 'dids'
import { makeDID } from '@ceramicnetwork/cli/lib/__tests__/make-did.js'

const CONTENT0 = { myData: 0 }
const CONTENT1 = { myData: 1 }

const MODEL_DEFINITION: ModelDefinition = {
  name: 'MyModel1',
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

describe('Admin API tests', () => {
  jest.setTimeout(1000 * 30)

  let ipfs: IpfsApi
  let port: number
  let core: Ceramic
  let daemon: CeramicDaemon
  let ceramic: CeramicClient
  let adminDid: DID
  let nonAdminDid: DID

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
        allowQueriesBeforeHistoricalSync: true,
      },
    })

    adminDid = makeDID(core, 'ADMIN SEED')
    await adminDid.authenticate()
    nonAdminDid = makeDID(core, 'NON ADMIN SEED')
    await nonAdminDid.authenticate()

    port = await getPort()
    const apiUrl = 'http://localhost:' + port
    daemon = new CeramicDaemon(
      core,
      DaemonConfig.fromObject({ 'http-api': { port, 'admin-dids': [adminDid.id.toString()] } })
    )
    await daemon.listen()
    ceramic = new CeramicClient(apiUrl)
    ceramic.did = nonAdminDid
  }, 30 * 1000)

  afterEach(async () => {
    await ceramic.close()
    await daemon.close()
    await core.close()
  })

  describe('Indexing config tests', () => {
    test('Fails with non-admin DID', async () => {
      const model = await Model.create(ceramic, MODEL_DEFINITION)

      await expect(ceramic.admin.getIndexedModels()).rejects.toThrow(/Unauthorized access/)
      await expect(ceramic.admin.startIndexingModels([model.id])).rejects.toThrow(
        /Unauthorized access/
      )
      await expect(ceramic.admin.stopIndexingModels([model.id])).rejects.toThrow(
        /Unauthorized access/
      )
    })

    test('Dynamic indexing', async () => {
      const model = await Model.create(ceramic, MODEL_DEFINITION)

      const doc1 = await ModelInstanceDocument.create(ceramic, CONTENT0, { model: model.id })

      ceramic.did = adminDid

      let indexedModels = await ceramic.admin.getIndexedModels()
      expect(indexedModels.length).toEqual(0)

      await expect(ceramic.index.count({ model: model.id })).rejects.toThrow(
        /is not indexed on this node/
      )

      // Now start indexing the first model
      await ceramic.admin.startIndexingModels([model.id])
      indexedModels = await ceramic.admin.getIndexedModels()
      expect(indexedModels.length).toEqual(1)

      // Doesn't know about the doc created before the model was indexed
      await expect(ceramic.index.count({ model: model.id })).resolves.toEqual(0)
      await ModelInstanceDocument.create(ceramic, CONTENT0, { model: model.id })
      await expect(ceramic.index.count({ model: model.id })).resolves.toEqual(1)
      // Discovers the first doc when it is updated
      ceramic.did = nonAdminDid // Set did back to the stream controller so it can be updated
      await doc1.replace(CONTENT1)
      await expect(ceramic.index.count({ model: model.id })).resolves.toEqual(2)

      // Now stop indexing the model
      ceramic.did = adminDid
      await ceramic.admin.stopIndexingModels([model.id])

      await expect(ceramic.index.count({ model: model.id })).rejects.toThrow(
        /is not indexed on this node/
      )
    })
  })
})
