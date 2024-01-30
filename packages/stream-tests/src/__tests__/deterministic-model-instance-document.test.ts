import { jest } from '@jest/globals'
import getPort from 'get-port'
import { AnchorStatus, CommitType, IpfsApi } from '@ceramicnetwork/common'
import { CommonTestUtils as TestUtils } from '@ceramicnetwork/common-test-utils'
import { createIPFS, swarmConnect } from '@ceramicnetwork/ipfs-daemon'
import {
  ModelInstanceDocument,
  ModelInstanceDocumentMetadataArgs,
} from '@ceramicnetwork/stream-model-instance'
import { createCeramic } from '../create-ceramic.js'
import { Ceramic } from '@ceramicnetwork/core'
import { CeramicDaemon, DaemonConfig } from '@ceramicnetwork/cli'
import { CeramicClient } from '@ceramicnetwork/http-client'
import { Model, ModelDefinition } from '@ceramicnetwork/stream-model'

const CONTENT0 = { myData: 0 }
const CONTENT1 = { myData: 1 }

const MODEL_DEFINITION_SINGLE: ModelDefinition = {
  name: 'MyModel',
  version: '1.0',
  accountRelation: { type: 'single' },
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

const MODEL_DEFINITION_SET: ModelDefinition = {
  name: 'MyModel',
  version: '2.0',
  interface: false,
  implements: [],
  accountRelation: { type: 'set', fields: ['unique'] },
  schema: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    additionalProperties: false,
    properties: {
      unique: {
        type: 'string',
        minLength: 3,
      },
      other: {
        type: 'string',
        minLength: 3,
      },
    },
    required: ['unique'],
  },
}

// should pass on v4 as soon as we actually store/retrieve blocks
const describeIfV3ShouldPass = process.env.CERAMIC_ENABLE_V4_MODE ? describe.skip : describe

describeIfV3ShouldPass('ModelInstanceDocument API http-client tests', () => {
  jest.setTimeout(1000 * 30)

  let ipfs: IpfsApi
  let core: Ceramic
  let daemon: CeramicDaemon
  let ceramic: CeramicClient
  let model: Model
  let midMetadata: ModelInstanceDocumentMetadataArgs

  beforeAll(async () => {
    ipfs = await createIPFS()
  }, 12000)

  beforeEach(async () => {
    core = await createCeramic(ipfs)

    const port = await getPort()
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

    model = await Model.create(ceramic, MODEL_DEFINITION_SINGLE)
    midMetadata = { model: model.id }
  }, 12000)

  afterEach(async () => {
    await ceramic.close()
    await daemon.close()
    await core.close()
  })

  afterAll(async () => {
    await ipfs.stop()
  })

  test(`Create a valid empty doc`, async () => {
    const doc = await ModelInstanceDocument.single(ceramic, midMetadata)
    expect(doc.id.type).toEqual(ModelInstanceDocument.STREAM_TYPE_ID)
    expect(doc.metadata).toEqual({
      controller: ceramic.did.id.toString(),
      model: midMetadata.model,
    })
    expect(doc.state.log.length).toEqual(1)
    expect(doc.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(doc.state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)
    expect(doc.metadata.model.toString()).toEqual(model.id.toString())
    await expect(TestUtils.isPinned(ceramic.admin, doc.id)).resolves.toBeTruthy()
    await expect(TestUtils.isPinned(ceramic.admin, doc.metadata.model)).resolves.toBeTruthy()
  })

  test(`Create doc and set content`, async () => {
    const doc = await ModelInstanceDocument.single(ceramic, midMetadata)
    await doc.replace(CONTENT0)
    expect(doc.content).toEqual(CONTENT0)
    expect(doc.state.log.length).toEqual(2)
    expect(doc.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(doc.state.log[1].type).toEqual(CommitType.SIGNED)
    expect(doc.state.anchorStatus).toEqual(AnchorStatus.PENDING)
  })

  test(`Can create deterministic doc with create method`, async () => {
    const doc = await ModelInstanceDocument.create(ceramic, null, {
      ...midMetadata,
      deterministic: true,
    })
    await doc.replace(CONTENT0)
    expect(doc.content).toEqual(CONTENT0)
    expect(doc.state.log.length).toEqual(2)
    expect(doc.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(doc.state.log[1].type).toEqual(CommitType.SIGNED)
    expect(doc.state.anchorStatus).toEqual(AnchorStatus.PENDING)
  })

  test(`Creating doc with SINGLE accountRelation non-deterministically should fail `, async () => {
    await expect(ModelInstanceDocument.create(ceramic, null, midMetadata)).rejects.toThrow(
      /ModelInstanceDocuments for models with SINGLE accountRelations must be created deterministically/
    )
  })

  test('Can load document deterministically', async () => {
    const doc1 = await ModelInstanceDocument.single(ceramic, midMetadata)
    await doc1.replace(CONTENT0)
    const doc2 = await ModelInstanceDocument.single(ceramic, midMetadata)

    expect(doc2.id.toString()).toEqual(doc1.id.toString())
    expect(doc2.content).toEqual(doc1.content)
  })

  describe('Using custom unique metadata values', () => {
    test('Cannot replace unique content fields values', async () => {
      const model = await Model.create(ceramic, MODEL_DEFINITION_SET)

      const doc = await ModelInstanceDocument.set(ceramic, { model: model.id }, ['foo'])

      await expect(() => doc.replace({ unique: 'test' })).rejects.toThrow(
        /Unique content fields value does not match metadata/
      )

      await doc.replace({ unique: 'foo', other: 'bar' })
      expect(doc.content).toEqual({ unique: 'foo', other: 'bar' })
    })

    test('Cannot set content that does not pass validation', async () => {
      const model = await Model.create(ceramic, MODEL_DEFINITION_SET)

      const doc = await ModelInstanceDocument.set(ceramic, { model: model.id }, ['a'])
      await expect(() => doc.replace({ unique: 'a', other: 'test' })).rejects.toThrow(
        /Validation Error: data\/unique must NOT have fewer than 3 characters/
      )
    })

    test('Can create, load and update unique documents', async () => {
      const model = await Model.create(ceramic, MODEL_DEFINITION_SET)

      const doc1 = await ModelInstanceDocument.set(ceramic, { model: model.id }, ['foo'])
      await doc1.replace({ unique: 'foo', other: 'test' })

      const doc2 = await ModelInstanceDocument.set(ceramic, { model: model.id }, ['foo'])
      expect(doc2.id.toString()).toBe(doc1.id.toString())
      expect(doc2.content).toEqual({ unique: 'foo', other: 'test' })

      const doc3 = await ModelInstanceDocument.set(ceramic, { model: model.id }, ['bar'])
      expect(doc3.id.toString()).not.toBe(doc1.id.toString())
      expect(doc3.content).toBeNull()
    })
  })
})

describeIfV3ShouldPass('ModelInstanceDocument API multi-node tests', () => {
  jest.setTimeout(1000 * 30)

  let ipfs0: IpfsApi
  let ipfs1: IpfsApi
  let ceramic0: Ceramic
  let ceramic1: Ceramic
  let model: Model
  let midMetadata: ModelInstanceDocumentMetadataArgs

  beforeAll(async () => {
    ipfs0 = await createIPFS()
    ipfs1 = await createIPFS()
    await swarmConnect(ipfs0, ipfs1)
  }, 12000)

  beforeEach(async () => {
    ceramic0 = await createCeramic(ipfs0)
    ceramic1 = await createCeramic(ipfs1)

    model = await Model.create(ceramic0, MODEL_DEFINITION_SINGLE)
    midMetadata = { model: model.id }
  }, 12000)

  afterEach(async () => {
    await ceramic0.close()
    await ceramic1.close()
  })

  afterAll(async () => {
    await ipfs0.stop()
    await ipfs1.stop()
  })

  test('load doc', async () => {
    const doc = await ModelInstanceDocument.single(ceramic0, midMetadata)
    await doc.replace(CONTENT1)

    const loaded = await ModelInstanceDocument.load(ceramic1, doc.id)

    const docState = doc.state
    const loadedState = loaded.state
    expect(docState.anchorStatus).toEqual(AnchorStatus.PENDING)
    expect(loadedState.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)
    delete docState.anchorStatus
    delete loadedState.anchorStatus
    expect(loadedState.log.length).toEqual(2)
    expect(JSON.stringify(loadedState)).toEqual(JSON.stringify(docState))
  })

  test('load doc deterministically', async () => {
    const doc = await ModelInstanceDocument.single(ceramic0, midMetadata)
    await doc.replace(CONTENT1)

    const loaded = await ModelInstanceDocument.single(ceramic1, midMetadata)

    const docState = doc.state
    const loadedState = loaded.state
    expect(docState.anchorStatus).toEqual(AnchorStatus.PENDING)
    expect(loadedState.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)
    delete docState.anchorStatus
    delete loadedState.anchorStatus
    expect(loadedState.log.length).toEqual(2)
    expect(JSON.stringify(loadedState)).toEqual(JSON.stringify(docState))
  })
})
