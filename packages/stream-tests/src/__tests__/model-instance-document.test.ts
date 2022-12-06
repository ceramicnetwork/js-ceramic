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
const CONTENT2 = { myData: 2 }
const CONTENT3 = { myData: 3 }

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
  name: 'MyModelWithARelation',
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

describe('ModelInstanceDocument API http-client tests', () => {
  jest.setTimeout(1000 * 30)

  let ipfs: IpfsApi
  let core: Ceramic
  let daemon: CeramicDaemon
  let ceramic: CeramicClient
  let model: Model
  let midMetadata: ModelInstanceDocumentMetadataArgs
  let modelWithRelation: Model
  let midRelationMetadata: ModelInstanceDocumentMetadataArgs

  beforeAll(async () => {
    process.env.CERAMIC_ENABLE_EXPERIMENTAL_COMPOSE_DB = 'true'

    ipfs = await createIPFS()
    core = await createCeramic(ipfs, {
      indexing: {
        allowQueriesBeforeHistoricalSync: true,
      },
    })

    const port = await getPort()
    const apiUrl = 'http://localhost:' + port
    daemon = new CeramicDaemon(
      core,
      DaemonConfig.fromObject({
        'http-api': { port },
      })
    )
    await daemon.listen()
    ceramic = new CeramicClient(apiUrl)
    ceramic.setDID(core.did)

    model = await Model.create(ceramic, MODEL_DEFINITION)
    expect(model.id.toString()).toEqual(MODEL_STREAM_ID)
    midMetadata = { model: model.id }
    modelWithRelation = await Model.create(ceramic, MODEL_WITH_RELATION_DEFINITION)
    midRelationMetadata = { model: modelWithRelation.id }

    await core.index.indexModels([model.id])
  }, 12000)

  afterAll(async () => {
    await ceramic.close()
    await daemon.close()
    await core.close()
    await ipfs.stop()
  })

  test('verifies the content against model schema when creating an MID', async () => {
    await expect(ModelInstanceDocument.create(ceramic, {}, midMetadata)).rejects.toThrow(
      /data must have required property 'myData'/
    )
  })

  test('verifies the content against model schema when updating an MID', async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
    expect(doc.content).toEqual(CONTENT0)

    await expect(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      doc.replace({})
    ).rejects.toThrow(/data must have required property 'myData'/)
  })

  test(`Create a valid doc`, async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
    expect(doc.id.type).toEqual(ModelInstanceDocument.STREAM_TYPE_ID)
    expect(doc.content).toEqual(CONTENT0)
    expect(doc.metadata).toEqual({
      controller: ceramic.did.id.toString(),
      model: midMetadata.model,
    })
    expect(doc.state.log.length).toEqual(1)
    expect(doc.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(doc.state.anchorStatus).toEqual(AnchorStatus.PENDING)
    expect(doc.metadata.model.toString()).toEqual(model.id.toString())
    await expect(TestUtils.isPinned(ceramic, doc.id)).resolves.toBeTruthy()
    await expect(TestUtils.isPinned(ceramic, doc.metadata.model)).resolves.toBeTruthy()

    const relationContent = { linkedDoc: doc.id.toString() }
    const docWithRelation = await ModelInstanceDocument.create(
      ceramic,
      relationContent,
      midRelationMetadata
    )
    expect(docWithRelation.id.type).toEqual(ModelInstanceDocument.STREAM_TYPE_ID)
    expect(docWithRelation.content).toEqual(relationContent)
    expect(docWithRelation.metadata).toEqual({
      controller: ceramic.did.id.toString(),
      model: midRelationMetadata.model,
    })
    expect(docWithRelation.state.log.length).toEqual(1)
    expect(docWithRelation.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(docWithRelation.state.anchorStatus).toEqual(AnchorStatus.PENDING)
    expect(docWithRelation.metadata.model.toString()).toEqual(modelWithRelation.id.toString())
    await expect(TestUtils.isPinned(ceramic, docWithRelation.id)).resolves.toBeTruthy()
    await expect(TestUtils.isPinned(ceramic, docWithRelation.metadata.model)).resolves.toBeTruthy()
  })

  test('Create and update doc', async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
    expect(doc.content).toEqual(CONTENT0)

    await doc.replace(CONTENT1)

    expect(doc.content).toEqual(CONTENT1)
    expect(doc.state.log.length).toEqual(2)
    expect(doc.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(doc.state.log[1].type).toEqual(CommitType.SIGNED)
  })

  test(`Cannot create document with relation that isn't a valid streamid`, async () => {
    const relationContent = { linkedDoc: 'this is a streamid' }
    await expect(
      ModelInstanceDocument.create(ceramic, relationContent, midRelationMetadata)
    ).rejects.toThrow(/Error while parsing relation from field linkedDoc: Invalid StreamID/)
  })

  test(`Cannot create document with relation to a stream in the wrong model`, async () => {
    const randomModel = await Model.create(ceramic, { ...MODEL_DEFINITION, name: 'random model' })
    const docInRandomModel = await ModelInstanceDocument.create(ceramic, CONTENT0, {
      ...midMetadata,
      model: randomModel.id,
    })

    const relationContent = { linkedDoc: docInRandomModel.id.toString() }
    await expect(
      ModelInstanceDocument.create(ceramic, relationContent, midRelationMetadata)
    ).rejects.toThrow(/must be to a Stream in the Model/)
  })

  test('Anchor genesis', async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
    expect(doc.state.anchorStatus).toEqual(AnchorStatus.PENDING)

    await TestUtils.anchorUpdate(core, doc)
    await doc.sync()

    expect(doc.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    expect(doc.state.log.length).toEqual(2)
    expect(doc.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(doc.state.log[1].type).toEqual(CommitType.ANCHOR)
    expect(doc.content).toEqual(CONTENT0)
  })

  test('Anchor after updating', async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
    expect(doc.state.anchorStatus).toEqual(AnchorStatus.PENDING)
    await doc.replace(CONTENT1)
    expect(doc.state.anchorStatus).toEqual(AnchorStatus.PENDING)

    await TestUtils.anchorUpdate(core, doc)
    await doc.sync()

    expect(doc.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    expect(doc.state.log.length).toEqual(3)
    expect(doc.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(doc.state.log[1].type).toEqual(CommitType.SIGNED)
    expect(doc.state.log[2].type).toEqual(CommitType.ANCHOR)
    expect(doc.content).toEqual(CONTENT1)
  })

  test('multiple updates', async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
    await doc.replace(CONTENT1)

    await TestUtils.anchorUpdate(core, doc)
    await doc.sync()

    await doc.replace(CONTENT2)
    await doc.replace(CONTENT3)

    await TestUtils.anchorUpdate(core, doc)
    await doc.sync()

    expect(doc.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    expect(doc.state.log.length).toEqual(6)
    expect(doc.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(doc.state.log[1].type).toEqual(CommitType.SIGNED)
    expect(doc.state.log[2].type).toEqual(CommitType.ANCHOR)
    expect(doc.state.log[3].type).toEqual(CommitType.SIGNED)
    expect(doc.state.log[4].type).toEqual(CommitType.SIGNED)
    expect(doc.state.log[5].type).toEqual(CommitType.ANCHOR)
    expect(doc.content).toEqual(CONTENT3)
  })

  test('ModelInstanceDocuments are created uniquely', async () => {
    const doc1 = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
    const doc2 = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)

    expect(doc1.id.toString()).not.toEqual(doc2.id.toString())
  })

  test('Can load a stream', async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
    await doc.replace(CONTENT1)
    await TestUtils.anchorUpdate(core, doc)
    await doc.sync()

    const loaded = await ModelInstanceDocument.load(ceramic, doc.id)

    expect(loaded.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    expect(loaded.state.log.length).toEqual(3)
    expect(JSON.stringify(loaded.state)).toEqual(JSON.stringify(doc.state))
  })

  test('create respects anchor flag', async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata, {
      anchor: false,
    })
    expect(doc.state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)
  })

  test('create respects pin flag', async () => {
    await expect(
      ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata, { pin: false })
    ).rejects.toThrow(/Cannot unpin actively indexed stream/)
  })

  test('unpinning indexed stream fails', async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
    await expect(TestUtils.isPinned(ceramic, doc.id)).toBeTruthy()
    await expect(ceramic.pin.rm(doc.id)).rejects.toThrow(/Cannot unpin actively indexed stream/)
  })

  test('replace respects anchor flag', async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata, {
      anchor: false,
    })
    await doc.replace(CONTENT1, { anchor: false })
    expect(doc.state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)
  })

  test('replace respects pin flag', async () => {
    const nonIndexedModel = await Model.create(
      ceramic,
      Object.assign({}, MODEL_DEFINITION, { name: 'non-indexed' })
    )
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, { model: nonIndexedModel.id })
    await expect(TestUtils.isPinned(ceramic, doc.id)).resolves.toBeTruthy()
    await doc.replace(CONTENT1, { pin: false })
    await expect(TestUtils.isPinned(ceramic, doc.id)).resolves.toBeFalsy()
  })

  test(`Pinning a ModelInstanceDocument pins its Model`, async () => {
    // Unpin Model streams so we can test that pinning the MID causes the Model to become pinned
    await ceramic.pin.rm(model.id)
    await expect(TestUtils.isPinned(ceramic, model.id)).resolves.toBeFalsy()

    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
    await expect(TestUtils.isPinned(ceramic, doc.id)).resolves.toBeTruthy()
    await expect(TestUtils.isPinned(ceramic, model.id)).resolves.toBeTruthy()
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
    process.env.CERAMIC_ENABLE_EXPERIMENTAL_COMPOSE_DB = 'true'

    ipfs0 = await createIPFS()
    ipfs1 = await createIPFS()
    ceramic0 = await createCeramic(ipfs0)
    ceramic1 = await createCeramic(ipfs1)

    model = await Model.create(ceramic0, MODEL_DEFINITION)
    midMetadata = { model: model.id }
  }, 12000)

  afterAll(async () => {
    await ceramic0.close()
    await ceramic1.close()
    await ipfs0.stop()
    await ipfs1.stop()
  })

  test('load basic doc', async () => {
    const doc = await ModelInstanceDocument.create(ceramic0, CONTENT0, midMetadata)

    const loaded = await ModelInstanceDocument.load(ceramic1, doc.id)

    const docState = doc.state
    const loadedState = loaded.state
    expect(docState.anchorStatus).toEqual(AnchorStatus.PENDING)
    expect(loadedState.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)
    delete docState.anchorStatus
    delete loadedState.anchorStatus
    expect(loadedState.log.length).toEqual(1)
    expect(JSON.stringify(loadedState)).toEqual(JSON.stringify(docState))
  })

  test('load updated doc', async () => {
    const doc = await ModelInstanceDocument.create(ceramic0, CONTENT0, midMetadata)
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

  test('load updated and anchored doc', async () => {
    const doc = await ModelInstanceDocument.create(ceramic0, CONTENT0, midMetadata)
    await doc.replace(CONTENT1)
    await TestUtils.anchorUpdate(ceramic0, doc)

    const loaded = await ModelInstanceDocument.load(ceramic1, doc.id)

    expect(loaded.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    expect(loaded.state.log.length).toEqual(3)
    expect(JSON.stringify(loaded.state)).toEqual(JSON.stringify(doc.state))
  })
})
