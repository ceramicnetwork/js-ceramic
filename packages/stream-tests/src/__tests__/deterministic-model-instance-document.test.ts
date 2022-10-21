import { jest } from '@jest/globals'
import getPort from 'get-port'
import { AnchorStatus, CommitType, IpfsApi, TestUtils } from '@ceramicnetwork/common'
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

const CONTENT0 = { myData: 0 }
const CONTENT1 = { myData: 1 }

const MODEL_DEFINITION: ModelDefinition = {
  name: 'MyModel',
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

describe('ModelInstanceDocument API http-client tests', () => {
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
    process.env.CERAMIC_ENABLE_EXPERIMENTAL_COMPOSE_DB = 'true'

    core = await createCeramic(ipfs)

    const port = await getPort()
    const apiUrl = 'http://localhost:' + port
    daemon = new CeramicDaemon(core, DaemonConfig.fromObject({ 'http-api': { port } }))
    await daemon.listen()
    ceramic = new CeramicClient(apiUrl)
    ceramic.setDID(core.did)

    model = await Model.create(ceramic, MODEL_DEFINITION)
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
    await expect(TestUtils.isPinned(ceramic, doc.id)).resolves.toBeTruthy()
    await expect(TestUtils.isPinned(ceramic, doc.metadata.model)).resolves.toBeTruthy()
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
})

describe('ModelInstanceDocument API multi-node tests', () => {
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
  }, 12000)

  beforeEach(async () => {
    process.env.CERAMIC_ENABLE_EXPERIMENTAL_COMPOSE_DB = 'true'

    ceramic0 = await createCeramic(ipfs0)
    ceramic1 = await createCeramic(ipfs1)

    model = await Model.create(ceramic0, MODEL_DEFINITION)
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
