import { jest, test, expect, describe, beforeAll, afterAll } from '@jest/globals'
import getPort from 'get-port'
import { AnchorStatus, EventType, IpfsApi } from '@ceramicnetwork/common'
import { Utils as CoreUtils } from '@ceramicnetwork/core'
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
import { CommonTestUtils as TestUtils } from '@ceramicnetwork/common-test-utils'

const CONTENT0 = { myData: 0 }
const CONTENT1 = { myData: 1 }
const CONTENT2 = { myData: 2 }
const CONTENT3 = { myData: 3 }

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
    },
    required: ['myData'],
  },
}

const MODEL_DEFINITION_SINGLE: ModelDefinition = {
  name: 'MySingleModel',
  version: '1.0',
  accountRelation: { type: 'single' },
  schema: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    additionalProperties: false,
    properties: {
      one: { type: 'string', minLength: 2 },
      myData: {
        type: 'integer',
        maximum: 10000,
        minimum: 0,
      },
    },
    required: ['myData'],
  },
  immutableFields: ['one'],
}

const MODEL_DEFINITION_SET: ModelDefinition = {
  name: 'MyModel',
  version: '2.0',
  interface: false,
  implements: [],
  accountRelation: { type: 'set', fields: ['one', 'two'] },
  schema: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    additionalProperties: false,
    properties: {
      one: { type: 'string', minLength: 2 },
      two: { type: 'string', minLength: 2 },
      three: { type: 'string', minLength: 2 },
      myData: {
        type: 'integer',
        maximum: 100,
        minimum: 0,
      },
    },
    required: ['one', 'two'],
  },
  immutableFields: ['three'],
}

// The model above will always result in this StreamID when created with the fixed did:key
// controller used by the test.
const MODEL_STREAM_ID = 'kjzl6hvfrbw6cbdjuaefdwodr2xb2n8ga1b5ss91roslr1iffmpgehcw5246o2q'

const MODEL_WITH_RELATION_DEFINITION: ModelDefinition = {
  name: 'MyModelWithARelation',
  version: '1.0',
  accountRelation: { type: 'list' },
  schema: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    additionalProperties: false,
    properties: {
      linkedDoc: { type: 'string' },
      optionalLinkedDoc: { type: 'string' },
    },
    required: ['linkedDoc'],
  },
  relations: {
    linkedDoc: { type: 'document', model: MODEL_STREAM_ID },
    optionalLinkedDoc: { type: 'document', model: MODEL_STREAM_ID },
  },
}

// TODO(WS1-1471): These tests should be enabled once anchoring works in Recon mode
const testIfV3ShouldPassWithAnchoring = process.env.CERAMIC_RECON_MODE ? test.skip : test

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
  let modelSingle: Model
  let midSingleMetadata: ModelInstanceDocumentMetadataArgs
  let modelSet: Model
  let midSetMetadata: ModelInstanceDocumentMetadataArgs

  beforeAll(async () => {
    ipfs = await createIPFS()
    core = await createCeramic(ipfs, {
      indexing: {
        allowQueriesBeforeHistoricalSync: true,
        disableComposedb: false,
        enableHistoricalSync: false,
      },
      reconFeedEnabled: false,
    })

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

    model = await Model.create(ceramic, MODEL_DEFINITION)
    expect(model.id.toString()).toEqual(MODEL_STREAM_ID)
    midMetadata = { model: model.id }
    modelWithRelation = await Model.create(ceramic, MODEL_WITH_RELATION_DEFINITION)
    midRelationMetadata = { model: modelWithRelation.id }
    modelSingle = await Model.create(ceramic, MODEL_DEFINITION_SINGLE)
    midSingleMetadata = { model: modelSingle.id }
    modelSet = await Model.create(ceramic, MODEL_DEFINITION_SET)
    midSetMetadata = { model: modelSet.id }

    await core.index.indexModels([{ streamID: model.id }])
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
    expect(doc.metadata.controller).toBe(ceramic.did.id.toString())
    expect(doc.metadata.model.equals(midMetadata.model)).toBe(true)
    expect(doc.metadata.unique).toBeInstanceOf(Uint8Array)
    expect(doc.state.log.length).toEqual(1)
    expect(doc.state.log[0].type).toEqual(EventType.INIT)
    if (!process.env.CERAMIC_RECON_MODE) {
      // TODO (WS1-1471): Re-enable this check even in Recon mode
      expect(doc.state.anchorStatus).toEqual(AnchorStatus.PENDING)
    }
    expect(doc.metadata.model.toString()).toEqual(model.id.toString())
    await expect(TestUtils.isPinned(ceramic.admin, doc.id)).resolves.toBeTruthy()
    await expect(TestUtils.isPinned(ceramic.admin, doc.metadata.model)).resolves.toBeTruthy()

    const relationContent = { linkedDoc: doc.id.toString() }
    const docWithRelation = await ModelInstanceDocument.create(
      ceramic,
      relationContent,
      midRelationMetadata
    )
    expect(docWithRelation.id.type).toEqual(ModelInstanceDocument.STREAM_TYPE_ID)
    expect(docWithRelation.content).toEqual(relationContent)
    expect(docWithRelation.metadata.controller).toBe(ceramic.did.id.toString())
    expect(docWithRelation.metadata.model.equals(midRelationMetadata.model)).toBe(true)
    expect(docWithRelation.metadata.unique).toBeInstanceOf(Uint8Array)
    expect(docWithRelation.state.log.length).toEqual(1)
    expect(docWithRelation.state.log[0].type).toEqual(EventType.INIT)
    if (!process.env.CERAMIC_RECON_MODE) {
      // TODO (WS1-1471): Re-enable this check even in Recon mode
      expect(docWithRelation.state.anchorStatus).toEqual(AnchorStatus.PENDING)
    }
    expect(docWithRelation.metadata.model.toString()).toEqual(modelWithRelation.id.toString())
    await expect(TestUtils.isPinned(ceramic.admin, docWithRelation.id)).resolves.toBeTruthy()
    await expect(
      TestUtils.isPinned(ceramic.admin, docWithRelation.metadata.model)
    ).resolves.toBeTruthy()
  })

  test(`Can set and access context`, async () => {
    const ctx = TestUtils.randomStreamID()
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, {
      ...midMetadata,
      context: ctx,
    })

    const loaded = await ModelInstanceDocument.load(ceramic, doc.id)

    expect(loaded.id.toString()).toEqual(doc.id.toString())
    expect(doc.metadata.context.toString()).toEqual(ctx.toString())
    expect(loaded.metadata.context.toString()).toEqual(ctx.toString())
  })

  test('Create and update doc', async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
    expect(doc.content).toEqual(CONTENT0)

    await doc.replace(CONTENT1)

    expect(doc.content).toEqual(CONTENT1)
    expect(doc.state.log.length).toEqual(2)
    expect(doc.state.log[0].type).toEqual(EventType.INIT)
    expect(doc.state.log[1].type).toEqual(EventType.DATA)
  })

  test('Can upsert immutable fields in a set/single relation model', async () => {
    // set
    const doc = await ModelInstanceDocument.set(
      ceramic,
      { controller: ceramic.did!.id, model: modelSet.id },
      ['foo', 'bar']
    )

    expect(doc.content).toBeNull()
    const newContent = { one: 'foo', two: 'bar', three: 'foobar', myData: 1 }
    await doc.replace(newContent)

    expect(doc.content).toEqual(newContent)
    expect(doc.state.log.length).toEqual(2)
    expect(doc.state.log[0].type).toEqual(EventType.INIT)
    expect(doc.state.log[1].type).toEqual(EventType.DATA)
    // single
    const singleDoc = await ModelInstanceDocument.single(ceramic, midSingleMetadata)
    expect(singleDoc.content).toBeNull()
    const singleNewContent = { one: 'foo', myData: 1 }
    await singleDoc.replace(singleNewContent)

    expect(singleDoc.content).toEqual(singleNewContent)
    expect(singleDoc.state.log.length).toEqual(2)
    expect(singleDoc.state.log[0].type).toEqual(EventType.INIT)
    expect(singleDoc.state.log[1].type).toEqual(EventType.DATA)
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

  test('Cannot create a document with a missing required relation', async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
    await expect(() => {
      return ModelInstanceDocument.create(
        ceramic,
        { optionalLinkedDoc: doc.id.toString() },
        midRelationMetadata
      )
    }).rejects.toThrow()
  })

  test('Can create, remove and add an optional relation', async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
    const docID = doc.id.toString()
    // Create with optional relation
    const docWithRelation = await ModelInstanceDocument.create<{
      linkedDoc: string
      optionalLinkedDoc?: string
    }>(ceramic, { linkedDoc: docID, optionalLinkedDoc: docID }, midRelationMetadata)
    expect(docWithRelation.content.optionalLinkedDoc).toBe(docID)
    // Remove optional relation
    await docWithRelation.replace({ linkedDoc: docID })
    expect(docWithRelation.content.optionalLinkedDoc).toBeUndefined()
    // Add optional relation
    await docWithRelation.replace({ linkedDoc: docID, optionalLinkedDoc: docID })
    expect(docWithRelation.content.optionalLinkedDoc).toBe(docID)
  })

  testIfV3ShouldPassWithAnchoring('Anchor genesis', async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
    expect(doc.state.anchorStatus).toEqual(AnchorStatus.PENDING)

    await CoreUtils.anchorUpdate(core, doc)
    await doc.sync()

    expect(doc.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    expect(doc.state.log.length).toEqual(2)
    expect(doc.state.log[0].type).toEqual(EventType.INIT)
    expect(doc.state.log[1].type).toEqual(EventType.TIME)
    expect(doc.content).toEqual(CONTENT0)
  })

  testIfV3ShouldPassWithAnchoring('Anchor after updating', async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
    expect(doc.state.anchorStatus).toEqual(AnchorStatus.PENDING)
    await doc.replace(CONTENT1)
    expect(doc.state.anchorStatus).toEqual(AnchorStatus.PENDING)

    await CoreUtils.anchorUpdate(core, doc)
    await doc.sync()

    expect(doc.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    expect(doc.state.log.length).toEqual(3)
    expect(doc.state.log[0].type).toEqual(EventType.INIT)
    expect(doc.state.log[1].type).toEqual(EventType.DATA)
    expect(doc.state.log[2].type).toEqual(EventType.TIME)
    expect(doc.content).toEqual(CONTENT1)
  })

  testIfV3ShouldPassWithAnchoring('multiple updates', async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
    await doc.replace(CONTENT1)

    await CoreUtils.anchorUpdate(core, doc)
    await doc.sync()

    await doc.replace(CONTENT2)
    await doc.replace(CONTENT3)

    await CoreUtils.anchorUpdate(core, doc)
    await doc.sync()

    expect(doc.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    expect(doc.state.log.length).toEqual(6)
    expect(doc.state.log[0].type).toEqual(EventType.INIT)
    expect(doc.state.log[1].type).toEqual(EventType.DATA)
    expect(doc.state.log[2].type).toEqual(EventType.TIME)
    expect(doc.state.log[3].type).toEqual(EventType.DATA)
    expect(doc.state.log[4].type).toEqual(EventType.DATA)
    expect(doc.state.log[5].type).toEqual(EventType.TIME)
    expect(doc.content).toEqual(CONTENT3)
  })

  test('ModelInstanceDocuments are created uniquely', async () => {
    const doc1 = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
    const doc2 = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)

    expect(doc1.id.toString()).not.toEqual(doc2.id.toString())
  })

  test('ModelInstanceDocuments with accountRelation Single are created deterministically', async () => {
    const doc1 = await ModelInstanceDocument.single(ceramic, midSingleMetadata)
    const doc2 = await ModelInstanceDocument.single(ceramic, midSingleMetadata)

    expect(doc1.id.toString()).toEqual(doc2.id.toString())
  })

  test('Controller must be valid DID even for unsigned genesis commits (ie Single accountRelations)', async () => {
    await expect(
      ModelInstanceDocument.single(ceramic, {
        ...midSingleMetadata,
        controller: 'invalid',
      })
    ).rejects.toThrow(/Attempting to create a ModelInstanceDocument with an invalid DID string/)
  })

  testIfV3ShouldPassWithAnchoring('Can load a stream', async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
    await doc.replace(CONTENT1)
    await CoreUtils.anchorUpdate(core, doc)
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
    await expect(TestUtils.isPinned(ceramic.admin, doc.id)).toBeTruthy()
    await expect(ceramic.admin.pin.rm(doc.id)).rejects.toThrow(
      /Cannot unpin actively indexed stream/
    )
  })

  test('replace respects anchor flag', async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata, {
      anchor: false,
    })
    await doc.replace(CONTENT1, undefined, { anchor: false })
    expect(doc.state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)
  })

  test('replace respects pin flag', async () => {
    const nonIndexedModel = await Model.create(
      ceramic,
      Object.assign({}, MODEL_DEFINITION, { name: 'non-indexed' })
    )
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, { model: nonIndexedModel.id })
    await expect(TestUtils.isPinned(ceramic.admin, doc.id)).resolves.toBeTruthy()
    await expect(TestUtils.isPinned(ceramic.admin, doc.id)).resolves.toBeTruthy()
  })

  test(`Pinning a ModelInstanceDocument pins its Model`, async () => {
    // Unpin Model streams so we can test that pinning the MID causes the Model to become pinned
    await ceramic.admin.pin.rm(model.id)
    await expect(TestUtils.isPinned(ceramic.admin, model.id)).resolves.toBeFalsy()

    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
    await expect(TestUtils.isPinned(ceramic.admin, doc.id)).resolves.toBeTruthy()
    await expect(TestUtils.isPinned(ceramic.admin, model.id)).resolves.toBeTruthy()
  })

  test('unindex and reindex', async () => {
    const indexApi = core.index
    const count = () => indexApi.count({ models: [model.id] })
    const start = await count()
    // Index as usual
    const document = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
    await expect(count()).resolves.toEqual(start + 1)
    // Unindex
    await document.shouldIndex(false)
    await expect(count()).resolves.toEqual(start)
    // Reindex
    await document.shouldIndex(true)
    await expect(count()).resolves.toEqual(start + 1)
  })
})

// should pass on v4 as soon as recon is integrated and cross-node syncing works.
const describeIfV3ShouldPass = process.env.CERAMIC_RECON_MODE ? describe.skip : describe

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
    await CoreUtils.anchorUpdate(ceramic0, doc)

    const loaded = await ModelInstanceDocument.load(ceramic1, doc.id)

    expect(loaded.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    expect(loaded.state.log.length).toEqual(3)
    expect(JSON.stringify(loaded.state)).toEqual(JSON.stringify(doc.state))
  })
})
