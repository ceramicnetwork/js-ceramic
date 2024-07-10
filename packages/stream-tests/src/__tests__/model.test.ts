import { jest } from '@jest/globals'
import getPort from 'get-port'
import {
  AnchorStatus,
  EnvironmentUtils,
  EventType,
  IpfsApi,
  StreamState,
} from '@ceramicnetwork/common'
import { Utils as CoreUtils } from '@ceramicnetwork/core'
import { createIPFS, swarmConnect } from '@ceramicnetwork/ipfs-daemon'
import { Model, ModelDefinition, parseModelVersion } from '@ceramicnetwork/stream-model'
import { createCeramic } from '../create-ceramic.js'
import { Ceramic } from '@ceramicnetwork/core'
import { CeramicDaemon, DaemonConfig } from '@ceramicnetwork/cli'
import { CeramicClient } from '@ceramicnetwork/http-client'
import { CommonTestUtils as TestUtils } from '@ceramicnetwork/common-test-utils'

const MODEL_DEFINITION: ModelDefinition = {
  name: 'myModel',
  version: '1.0',
  schema: { type: 'object', additionalProperties: false },
  accountRelation: { type: 'list' },
}

const INDEXED_MODEL_DEFINITION: ModelDefinition = {
  name: 'myIndexedModel',
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
      myStringData: {
        type: 'string',
        maximum: 100,
        minimum: 0,
      },
    },
    required: ['myData'],
  },
}

const SINGLE_INDEXED_MODEL_DEFINITION: ModelDefinition = {
  name: 'myIndexedModel',
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
      myStringData: {
        type: 'string',
        maximum: 100,
        minimum: 0,
      },
    },
    required: ['myData'],
  },
}

// The model above will always result in this StreamID when created with the fixed did:key
// controller used by the test.
const MODEL_STREAM_ID = 'kjzl6hvfrbw6c5ykyyjq0v80od0nhdimprq7j2pccg1l100ktiiqcc01ddka716'

const MODEL_DEFINITION_WITH_RELATION: ModelDefinition = {
  name: 'myModelWithARelation',
  version: '1.0',
  schema: { type: 'object', additionalProperties: false },
  accountRelation: { type: 'list' },
  relations: { linkedDoc: { type: 'document', model: MODEL_STREAM_ID } },
}

describe('Model API http-client tests', () => {
  jest.setTimeout(1000 * 30)

  let ipfs: IpfsApi
  let core: Ceramic
  let daemon: CeramicDaemon
  let ceramic: CeramicClient

  beforeAll(async () => {
    ipfs = await createIPFS()
  })

  beforeEach(async () => {
    core = await createCeramic(ipfs)

    const port = await getPort()
    const apiUrl = 'http://localhost:' + port
    daemon = new CeramicDaemon(
      core,
      DaemonConfig.fromObject({
        'http-api': {
          port,
          'admin-dids': [core.did.id.toString()],
        },
        node: {},
      })
    )
    await daemon.listen()
    ceramic = new CeramicClient(apiUrl)
    ceramic.did = core.did
  }, 12000)

  afterEach(async () => {
    await ceramic.close()
    await daemon.close()
    await core.close()
  })

  afterAll(async () => {
    await ipfs.stop()
  })

  test('Model model is unloadable', async () => {
    await expect(ceramic.loadStream(Model.MODEL)).rejects.toThrow(/4 is not a valid stream type/)
  })

  test('Create valid model', async () => {
    const model = await Model.create(ceramic, MODEL_DEFINITION)

    expect(model.id.type).toEqual(Model.STREAM_TYPE_ID)
    expect(model.content).toEqual(MODEL_DEFINITION)
    expect(model.metadata).toEqual({ controller: ceramic.did.id.toString(), model: Model.MODEL })
    expect(model.state.log.length).toEqual(1)
    expect(model.state.log[0].type).toEqual(EventType.INIT)
    expect(model.state.anchorStatus).toEqual(AnchorStatus.PENDING)
    expect(model.id.toString()).toEqual(MODEL_STREAM_ID)
  })

  describe('model indexing', () => {
    test('Create and index valid model', async () => {
      const model = await Model.create(ceramic, INDEXED_MODEL_DEFINITION)

      expect(model.id.type).toEqual(Model.STREAM_TYPE_ID)
      expect(model.content).toEqual(INDEXED_MODEL_DEFINITION)
      expect(model.metadata).toEqual({ controller: ceramic.did.id.toString(), model: Model.MODEL })
      expect(model.state.log.length).toEqual(1)
      expect(model.state.log[0].type).toEqual(EventType.INIT)
      expect(model.state.anchorStatus).toEqual(AnchorStatus.PENDING)

      await expect(ceramic.admin.pin.add(model.id)).resolves.not.toThrow()

      await expect(
        ceramic.admin.startIndexingModelData([
          {
            streamID: model.id,
          },
        ])
      ).resolves.not.toThrow()
    })

    test('Create, index, and load valid model', async () => {
      const model = await Model.create(ceramic, INDEXED_MODEL_DEFINITION)

      expect(model.id.type).toEqual(Model.STREAM_TYPE_ID)
      expect(model.content).toEqual(INDEXED_MODEL_DEFINITION)
      expect(model.metadata).toEqual({ controller: ceramic.did.id.toString(), model: Model.MODEL })
      expect(model.state.log.length).toEqual(1)
      expect(model.state.log[0].type).toEqual(EventType.INIT)
      expect(model.state.anchorStatus).toEqual(AnchorStatus.PENDING)

      await expect(ceramic.admin.pin.add(model.id)).resolves.not.toThrow()

      await expect(
        ceramic.admin.startIndexingModelData([
          {
            streamID: model.id,
          },
        ])
      ).resolves.not.toThrow()

      await expect(Model.load(ceramic, model.id)).resolves.not.toThrow()
    })

    test('Create and index a model with custom indices', async () => {
      const model = await Model.create(ceramic, INDEXED_MODEL_DEFINITION)

      expect(model.id.type).toEqual(Model.STREAM_TYPE_ID)
      expect(model.content).toEqual(INDEXED_MODEL_DEFINITION)
      expect(model.metadata).toEqual({ controller: ceramic.did.id.toString(), model: Model.MODEL })
      expect(model.state.log.length).toEqual(1)
      expect(model.state.log[0].type).toEqual(EventType.INIT)
      expect(model.state.anchorStatus).toEqual(AnchorStatus.PENDING)

      await expect(ceramic.admin.pin.add(model.id)).resolves.not.toThrow()

      await expect(
        ceramic.admin.startIndexingModelData([
          {
            streamID: model.id,
            indices: [
              {
                fields: [{ path: ['myData'] }],
              },
            ],
          },
        ])
      ).resolves.not.toThrow()
    })

    test('Create and index a model with custom indices that is not pinned', async () => {
      const model = await Model.create(ceramic, INDEXED_MODEL_DEFINITION)

      expect(model.id.type).toEqual(Model.STREAM_TYPE_ID)
      expect(model.content).toEqual(INDEXED_MODEL_DEFINITION)
      expect(model.metadata).toEqual({ controller: ceramic.did.id.toString(), model: Model.MODEL })
      expect(model.state.log.length).toEqual(1)
      expect(model.state.log[0].type).toEqual(EventType.INIT)
      expect(model.state.anchorStatus).toEqual(AnchorStatus.PENDING)

      await expect(
        ceramic.admin.startIndexingModelData([
          {
            streamID: model.id,
            indices: [
              {
                fields: [{ path: ['myData'] }],
              },
            ],
          },
        ])
      ).resolves.not.toThrow()
    })

    test('Create, index, and load valid model with custom indices', async () => {
      const model = await Model.create(ceramic, INDEXED_MODEL_DEFINITION)

      expect(model.id.type).toEqual(Model.STREAM_TYPE_ID)
      expect(model.content).toEqual(INDEXED_MODEL_DEFINITION)
      expect(model.metadata).toEqual({ controller: ceramic.did.id.toString(), model: Model.MODEL })
      expect(model.state.log.length).toEqual(1)
      expect(model.state.log[0].type).toEqual(EventType.INIT)
      expect(model.state.anchorStatus).toEqual(AnchorStatus.PENDING)

      await expect(ceramic.admin.pin.add(model.id)).resolves.not.toThrow()

      await expect(
        ceramic.admin.startIndexingModelData([
          {
            streamID: model.id,
            indices: [
              {
                fields: [{ path: ['myData'] }],
              },
            ],
          },
        ])
      ).resolves.not.toThrow()

      await expect(Model.load(ceramic, model.id)).resolves.not.toThrow()
    })

    test('Create, index, load and index valid model with custom indices on create', async () => {
      const model = await Model.create(ceramic, INDEXED_MODEL_DEFINITION)

      expect(model.id.type).toEqual(Model.STREAM_TYPE_ID)
      expect(model.content).toEqual(INDEXED_MODEL_DEFINITION)
      expect(model.metadata).toEqual({ controller: ceramic.did.id.toString(), model: Model.MODEL })
      expect(model.state.log.length).toEqual(1)
      expect(model.state.log[0].type).toEqual(EventType.INIT)
      expect(model.state.anchorStatus).toEqual(AnchorStatus.PENDING)

      await expect(ceramic.admin.pin.add(model.id)).resolves.not.toThrow()

      await expect(
        ceramic.admin.startIndexingModelData([
          {
            streamID: model.id,
            indices: [
              {
                fields: [{ path: ['myData'] }],
              },
            ],
          },
        ])
      ).resolves.not.toThrow()

      const loadedModel = await Model.load(ceramic, model.id)

      await expect(
        ceramic.admin.startIndexingModelData([
          {
            streamID: loadedModel.id,
          },
        ])
      ).resolves.not.toThrow()
    })

    test('Create, index, load and not index valid model with custom indices on load', async () => {
      const model = await Model.create(ceramic, INDEXED_MODEL_DEFINITION)

      expect(model.id.type).toEqual(Model.STREAM_TYPE_ID)
      expect(model.content).toEqual(INDEXED_MODEL_DEFINITION)
      expect(model.metadata).toEqual({ controller: ceramic.did.id.toString(), model: Model.MODEL })
      expect(model.state.log.length).toEqual(1)
      expect(model.state.log[0].type).toEqual(EventType.INIT)
      expect(model.state.anchorStatus).toEqual(AnchorStatus.PENDING)

      await expect(ceramic.admin.pin.add(model.id)).resolves.not.toThrow()

      await expect(
        ceramic.admin.startIndexingModelData([
          {
            streamID: model.id,
          },
        ])
      ).resolves.not.toThrow()

      const loadedModel = await Model.load(ceramic, model.id)

      await expect(
        ceramic.admin.startIndexingModelData([
          {
            streamID: loadedModel.id,
            indices: [
              {
                fields: [{ path: ['myData'] }],
              },
            ],
          },
        ])
      ).rejects.toThrow(/Schema verification failed/) //adding indices
    })

    test('Create, index, load and index valid model with less custom indices on load', async () => {
      const model = await Model.create(ceramic, INDEXED_MODEL_DEFINITION)

      expect(model.id.type).toEqual(Model.STREAM_TYPE_ID)
      expect(model.content).toEqual(INDEXED_MODEL_DEFINITION)
      expect(model.metadata).toEqual({ controller: ceramic.did.id.toString(), model: Model.MODEL })
      expect(model.state.log.length).toEqual(1)
      expect(model.state.log[0].type).toEqual(EventType.INIT)
      expect(model.state.anchorStatus).toEqual(AnchorStatus.PENDING)

      await expect(ceramic.admin.pin.add(model.id)).resolves.not.toThrow()

      await expect(
        ceramic.admin.startIndexingModelData([
          {
            streamID: model.id,
            indices: [
              {
                fields: [{ path: ['myData'] }],
              },
              {
                fields: [{ path: ['myString'] }],
              },
            ],
          },
        ])
      ).resolves.not.toThrow()

      const loadedModel = await Model.load(ceramic, model.id)

      await expect(
        ceramic.admin.startIndexingModelData([
          {
            streamID: loadedModel.id,
            indices: [
              {
                fields: [{ path: ['myData'] }],
              },
            ],
          },
        ])
      ).resolves.not.toThrow() //doesn't throw because we're not adding indices
    })

    test('Create, index, load and index valid model with different custom indices on load', async () => {
      const model = await Model.create(ceramic, INDEXED_MODEL_DEFINITION)

      expect(model.id.type).toEqual(Model.STREAM_TYPE_ID)
      expect(model.content).toEqual(INDEXED_MODEL_DEFINITION)
      expect(model.metadata).toEqual({ controller: ceramic.did.id.toString(), model: Model.MODEL })
      expect(model.state.log.length).toEqual(1)
      expect(model.state.log[0].type).toEqual(EventType.INIT)
      expect(model.state.anchorStatus).toEqual(AnchorStatus.PENDING)

      await expect(ceramic.admin.pin.add(model.id)).resolves.not.toThrow()

      await expect(
        ceramic.admin.startIndexingModelData([
          {
            streamID: model.id,
            indices: [
              {
                fields: [{ path: ['myData'] }],
              },
              {
                fields: [{ path: ['myString'] }],
              },
            ],
          },
        ])
      ).resolves.not.toThrow()

      const loadedModel = await Model.load(ceramic, model.id)

      await expect(
        ceramic.admin.startIndexingModelData([
          {
            streamID: loadedModel.id,
            indices: [
              {
                fields: [{ path: ['myString'] }],
              },
              {
                fields: [{ path: ['myData'] }],
              },
            ],
          },
        ])
      ).resolves.not.toThrow()
    })

    test('Create, index, load and index valid model with different custom indices on load', async () => {
      const model = await Model.create(ceramic, INDEXED_MODEL_DEFINITION)

      expect(model.id.type).toEqual(Model.STREAM_TYPE_ID)
      expect(model.content).toEqual(INDEXED_MODEL_DEFINITION)
      expect(model.metadata).toEqual({ controller: ceramic.did.id.toString(), model: Model.MODEL })
      expect(model.state.log.length).toEqual(1)
      expect(model.state.log[0].type).toEqual(EventType.INIT)
      expect(model.state.anchorStatus).toEqual(AnchorStatus.PENDING)

      await expect(ceramic.admin.pin.add(model.id)).resolves.not.toThrow()

      await expect(
        ceramic.admin.startIndexingModelData([
          {
            streamID: model.id,
            indices: [
              {
                fields: [{ path: ['myData'] }],
              },
            ],
          },
        ])
      ).resolves.not.toThrow()

      const loadedModel = await Model.load(ceramic, model.id)

      await expect(
        ceramic.admin.startIndexingModelData([
          {
            streamID: loadedModel.id,
            indices: [
              {
                fields: [{ path: ['myString'] }],
              },
            ],
          },
        ])
      ).rejects.toThrow(/Schema verification failed/) //changing indices
    })

    test('Create and index valid single model', async () => {
      const model = await Model.create(ceramic, SINGLE_INDEXED_MODEL_DEFINITION)

      expect(model.id.type).toEqual(Model.STREAM_TYPE_ID)
      expect(model.content).toEqual(SINGLE_INDEXED_MODEL_DEFINITION)
      expect(model.metadata).toEqual({ controller: ceramic.did.id.toString(), model: Model.MODEL })
      expect(model.state.log.length).toEqual(1)
      expect(model.state.log[0].type).toEqual(EventType.INIT)
      expect(model.state.anchorStatus).toEqual(AnchorStatus.PENDING)

      await expect(ceramic.admin.pin.add(model.id)).resolves.not.toThrow()

      await expect(
        ceramic.admin.startIndexingModelData([
          {
            streamID: model.id,
          },
        ])
      ).resolves.not.toThrow()
    })

    test('Create and index valid single model with indices', async () => {
      const model = await Model.create(ceramic, SINGLE_INDEXED_MODEL_DEFINITION)

      expect(model.id.type).toEqual(Model.STREAM_TYPE_ID)
      expect(model.content).toEqual(SINGLE_INDEXED_MODEL_DEFINITION)
      expect(model.metadata).toEqual({ controller: ceramic.did.id.toString(), model: Model.MODEL })
      expect(model.state.log.length).toEqual(1)
      expect(model.state.log[0].type).toEqual(EventType.INIT)
      expect(model.state.anchorStatus).toEqual(AnchorStatus.PENDING)

      await expect(ceramic.admin.pin.add(model.id)).resolves.not.toThrow()

      await expect(
        ceramic.admin.startIndexingModelData([
          {
            streamID: model.id,
            indices: [
              {
                fields: [{ path: ['myData'] }],
              },
            ],
          },
        ])
      ).resolves.not.toThrow()
    })

    test('Create, index, and load valid single model', async () => {
      const model = await Model.create(ceramic, SINGLE_INDEXED_MODEL_DEFINITION)

      expect(model.id.type).toEqual(Model.STREAM_TYPE_ID)
      expect(model.content).toEqual(SINGLE_INDEXED_MODEL_DEFINITION)
      expect(model.metadata).toEqual({ controller: ceramic.did.id.toString(), model: Model.MODEL })
      expect(model.state.log.length).toEqual(1)
      expect(model.state.log[0].type).toEqual(EventType.INIT)
      expect(model.state.anchorStatus).toEqual(AnchorStatus.PENDING)

      await expect(ceramic.admin.pin.add(model.id)).resolves.not.toThrow()

      await expect(
        ceramic.admin.startIndexingModelData([
          {
            streamID: model.id,
          },
        ])
      ).resolves.not.toThrow()

      const loadedModel = await Model.load(ceramic, model.id)

      await expect(
        ceramic.admin.startIndexingModelData([
          {
            streamID: loadedModel.id,
          },
        ])
      ).resolves.not.toThrow()
    })
  })

  test('Create valid model with relation', async () => {
    const model = await Model.create(ceramic, MODEL_DEFINITION_WITH_RELATION)

    expect(model.id.type).toEqual(Model.STREAM_TYPE_ID)
    expect(model.content).toEqual(MODEL_DEFINITION_WITH_RELATION)
    expect(model.metadata).toEqual({ controller: ceramic.did.id.toString(), model: Model.MODEL })
    expect(model.state.log.length).toEqual(1)
    expect(model.state.log[0].type).toEqual(EventType.INIT)
    expect(model.state.anchorStatus).toEqual(AnchorStatus.PENDING)
  })

  test('Anchor genesis', async () => {
    const model = await Model.create(ceramic, MODEL_DEFINITION)
    expect(model.state.anchorStatus).toEqual(AnchorStatus.PENDING)

    await CoreUtils.anchorUpdate(core, model)
    await model.sync()

    expect(model.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    expect(model.state.log.length).toEqual(2)
    expect(model.state.log[0].type).toEqual(EventType.INIT)
    expect(model.state.log[1].type).toEqual(EventType.TIME)
    expect(model.content).toEqual(MODEL_DEFINITION)
  })

  test('Models are created deterministically', async () => {
    const model1 = await Model.create(ceramic, MODEL_DEFINITION)
    const model2 = await Model.create(ceramic, MODEL_DEFINITION)

    expect(model1.id.toString()).toEqual(model2.id.toString())
  })

  test('Cannot create incomplete model', async () => {
    // @ts-ignore this is not a valid ModelDefinition - and that's the point of this test
    const invalidIncompleteModelDefinition: ModelDefinition = {
      name: 'myModel',
      version: '1.0',
    }

    await expect(Model.create(ceramic, invalidIncompleteModelDefinition)).rejects.toThrow(
      'Input is not a JSON schema of type: object'
    )
  })

  test('Cannot create model without version', async () => {
    const { version, ...modelDefinition } = MODEL_DEFINITION
    await expect(Model.create(ceramic, modelDefinition)).rejects.toThrow(
      'Missing version for model myModel'
    )
  })

  test('Cannot create model with unsupported version', async () => {
    const [currentMajor, currentMinor] = parseModelVersion(Model.VERSION)
    const version = `${currentMajor}.${currentMinor + 1}`
    await expect(Model.create(ceramic, { ...MODEL_DEFINITION, version })).rejects.toThrow(
      `Unsupported version ${version} for model myModel, the maximum version supported by the Ceramic node is ${Model.VERSION}. Please update your Ceramic node to a newer version supporting at least version ${version} of the Model definition.`
    )
  })

  test('Cannot create model with relation with an invalid type', async () => {
    // @ts-ignore this is not a valid relation - that's the point of this test
    const linkedDocType: 'account' | 'document' = 'foobar'
    const invalidRelationModelDefinition: ModelDefinition = {
      name: 'myModel',
      version: '1.0',
      schema: { type: 'object', additionalProperties: false },
      accountRelation: { type: 'list' },
      relations: {
        linkedDoc: { type: linkedDocType, model: MODEL_STREAM_ID },
      },
    }

    await expect(Model.create(ceramic, invalidRelationModelDefinition)).rejects.toThrow(
      /Invalid value "foobar" supplied to/
    )
  })

  test("Cannot create model with relation that isn't a streamid", async () => {
    // @ts-ignore this is not a valid ModelDefinition - and that's the point of this test
    const invalidRelationModelDefinition: ModelDefinition = {
      name: 'myModel',
      version: '1.0',
      schema: { type: 'object', additionalProperties: false },
      accountRelation: { type: 'list' },
      relations: {
        linkedDoc: { type: 'document', model: 'this is totally a streamid, trust me bro' },
      },
    }

    await expect(Model.create(ceramic, invalidRelationModelDefinition)).rejects.toThrow(
      /Invalid value/
    )
  })

  test('Can load a complete stream', async () => {
    const model = await Model.create(ceramic, MODEL_DEFINITION)
    await CoreUtils.anchorUpdate(core, model)
    await model.sync()

    const loaded = await Model.load(ceramic, model.id)

    expect(loaded.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    expect(loaded.state.log.length).toEqual(2)
    expect(JSON.stringify(loaded.state)).toEqual(JSON.stringify(model.state))
  })

  test('Checks interface implementation on model creation', async () => {
    const interfaceModel = await Model.create(ceramic, {
      version: '2.0',
      name: 'TestInterface',
      accountRelation: { type: 'none' },
      interface: true,
      implements: [],
      schema: {
        type: 'object',
        properties: { foo: { type: 'string' } },
        additionalProperties: false,
      },
      relations: {
        foo: { type: 'account' },
      },
      views: {
        bar: { type: 'documentAccount' },
      },
    })

    await expect(
      Model.create(ceramic, {
        version: '2.0',
        name: 'TestModel',
        accountRelation: { type: 'list' },
        interface: false,
        implements: [interfaceModel.id.toString()],
        schema: {
          type: 'object',
          properties: { foo: { type: 'string' } },
          additionalProperties: false,
        },
      })
    ).rejects.toThrow()

    await expect(
      Model.create(ceramic, {
        version: '2.0',
        name: 'TestModel',
        accountRelation: { type: 'list' },
        interface: false,
        implements: [interfaceModel.id.toString()],
        schema: {
          type: 'object',
          properties: { foo: { type: 'string' } },
          additionalProperties: false,
        },
        relations: {
          foo: { type: 'account' },
        },
        views: {
          bar: { type: 'documentAccount' },
        },
      })
    ).resolves.toBeInstanceOf(Model)
  })

  test('Can create model with relations to any document', async () => {
    await expect(
      Model.create(ceramic, {
        version: '2.0',
        name: 'TestModel',
        accountRelation: { type: 'list' },
        interface: false,
        implements: [],
        schema: {
          type: 'object',
          properties: { fooID: { type: 'string' } },
          additionalProperties: false,
        },
        relations: {
          fooID: { type: 'document', model: null },
        },
        views: {
          foo: { type: 'relationDocument', model: null, property: 'fooID' },
        },
      })
    ).resolves.toBeInstanceOf(Model)
  })
})

describe('Model API multi-node tests', () => {
  jest.setTimeout(1000 * 30)

  let ipfs0: IpfsApi
  let ipfs1: IpfsApi
  let ceramic0: Ceramic
  let ceramic1: Ceramic

  beforeEach(async () => {
    ipfs0 = await createIPFS()
    ipfs1 = await createIPFS()
    await swarmConnect(ipfs0, ipfs1)

    ceramic0 = await createCeramic(ipfs0)
    ceramic1 = await createCeramic(ipfs1)
  }, 12000)

  afterEach(async () => {
    await ceramic0.close()
    await ceramic1.close()
    await ipfs0.stop()
    await ipfs1.stop()
  })

  test('load basic model', async () => {
    const model = await Model.create(ceramic0, MODEL_DEFINITION)

    if (EnvironmentUtils.useRustCeramic())
      await TestUtils.waitForEvent(ceramic1.repository.recon, model.tip)

    await ceramic0.admin.startIndexingModelData([{ streamID: model.id }])
    await ceramic1.admin.startIndexingModelData([{ streamID: model.id }])

    const loaded = await Model.load(ceramic1, model.id)

    const modelState = model.state
    const loadedState = loaded.state
    expect(modelState.anchorStatus).toEqual(AnchorStatus.PENDING)
    expect(loadedState.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)
    delete modelState.anchorStatus
    delete loadedState.anchorStatus
    expect(loadedState.log.length).toEqual(1)
    expect(JSON.stringify(loadedState)).toEqual(JSON.stringify(modelState))
  })

  test('load anchored model', async () => {
    const model = await Model.create(ceramic0, MODEL_DEFINITION)

    if (EnvironmentUtils.useRustCeramic())
      await TestUtils.waitForEvent(ceramic1.repository.recon, model.tip)

    await ceramic0.admin.startIndexingModelData([{ streamID: model.id }])
    await ceramic1.admin.startIndexingModelData([{ streamID: model.id }])
    await CoreUtils.anchorUpdate(ceramic0, model)

    const loaded = await Model.load(ceramic1, model.id)
    const hasAnchorUpdate = (state: StreamState) =>
      state.log.some((entry) => entry.type === EventType.TIME)
    await TestUtils.waitFor(loaded, hasAnchorUpdate)

    expect(loaded.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    expect(loaded.state.log.length).toEqual(2)
    expect(JSON.stringify(loaded.state)).toEqual(JSON.stringify(model.state))
  }, 120000)
})
