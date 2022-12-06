import { jest } from '@jest/globals'
import getPort from 'get-port'
import { AnchorStatus, CommitType, IpfsApi, TestUtils } from '@ceramicnetwork/common'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { Model, ModelDefinition } from '@ceramicnetwork/stream-model'
import { createCeramic } from '../create-ceramic.js'
import { Ceramic } from '@ceramicnetwork/core'
import { CeramicDaemon, DaemonConfig } from '@ceramicnetwork/cli'
import { CeramicClient } from '@ceramicnetwork/http-client'

const MODEL_DEFINITION: ModelDefinition = {
  name: 'myModel',
  schema: {},
  accountRelation: { type: 'list' },
}

// The model above will always result in this StreamID when created with the fixed did:key
// controller used by the test.
const MODEL_STREAM_ID = 'kjzl6hvfrbw6c62dn29qy8b6lot6m9xr98wz4hfq0htxfhpxgqo41ufqew22qe1'

const MODEL_DEFINITION_WITH_RELATION: ModelDefinition = {
  name: 'myModelWithARelation',
  schema: {},
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
    process.env.CERAMIC_ENABLE_EXPERIMENTAL_COMPOSE_DB = 'true'

    ipfs = await createIPFS()
    core = await createCeramic(ipfs)

    const port = await getPort()
    const apiUrl = 'http://localhost:' + port
    daemon = new CeramicDaemon(core, DaemonConfig.fromObject({ 'http-api': { port } }))
    await daemon.listen()
    ceramic = new CeramicClient(apiUrl)
    ceramic.did = core.did
  }, 12000)

  afterAll(async () => {
    await ceramic.close()
    await daemon.close()
    await core.close()
    await ipfs.stop()
  })

  test('Model model is unloadable', async () => {
    await expect(ceramic.loadStream(Model.MODEL)).rejects.toThrow(
      /UNLOADABLE is not a valid stream type/
    )
  })

  test('Create valid model', async () => {
    const model = await Model.create(ceramic, MODEL_DEFINITION)

    expect(model.id.type).toEqual(Model.STREAM_TYPE_ID)
    expect(model.content).toEqual(MODEL_DEFINITION)
    expect(model.metadata).toEqual({ controller: ceramic.did.id.toString(), model: Model.MODEL })
    expect(model.state.log.length).toEqual(1)
    expect(model.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(model.state.anchorStatus).toEqual(AnchorStatus.PENDING)
    expect(model.id.toString()).toEqual(MODEL_STREAM_ID)
  })

  test('Create valid model with relation', async () => {
    const model = await Model.create(ceramic, MODEL_DEFINITION_WITH_RELATION)

    expect(model.id.type).toEqual(Model.STREAM_TYPE_ID)
    expect(model.content).toEqual(MODEL_DEFINITION_WITH_RELATION)
    expect(model.metadata).toEqual({ controller: ceramic.did.id.toString(), model: Model.MODEL })
    expect(model.state.log.length).toEqual(1)
    expect(model.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(model.state.anchorStatus).toEqual(AnchorStatus.PENDING)
  })

  test('Anchor genesis', async () => {
    const model = await Model.create(ceramic, MODEL_DEFINITION)
    expect(model.state.anchorStatus).toEqual(AnchorStatus.PENDING)

    await TestUtils.anchorUpdate(core, model)
    await model.sync()

    expect(model.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    expect(model.state.log.length).toEqual(2)
    expect(model.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(model.state.log[1].type).toEqual(CommitType.ANCHOR)
    expect(model.content).toEqual(MODEL_DEFINITION)
  })

  test('Models are created deterministically', async () => {
    const model1 = await Model.create(ceramic, MODEL_DEFINITION)
    const model2 = await Model.create(ceramic, MODEL_DEFINITION)

    expect(model1.id.toString()).toEqual(model2.id.toString())
  })

  test('Cannot create incomplete model', async () => {
    // @ts-ignore this is not a valid ModelDefinition - and that's the point of this test
    const invalidIncompleteModelDefinition: ModelDefinition = { name: 'myModel' }

    await expect(Model.create(ceramic, invalidIncompleteModelDefinition)).rejects.toThrow(
      /missing a 'schema' field/
    )
  })

  test('Cannot create model with relation with an invalid type', async () => {
    // @ts-ignore this is not a valid relation - that's the point of this test
    const linkedDocType: 'account' | 'document' = 'foobar'
    const invalidRelationModelDefinition: ModelDefinition = {
      name: 'myModel',
      schema: {},
      accountRelation: { type: 'list' },
      relations: {
        linkedDoc: { type: linkedDocType, model: MODEL_STREAM_ID },
      },
    }

    await expect(Model.create(ceramic, invalidRelationModelDefinition)).rejects.toThrow(
      'Relation on field linkedDoc has unexpected type foobar'
    )
  })

  test("Cannot create model with relation that isn't a streamid", async () => {
    // @ts-ignore this is not a valid ModelDefinition - and that's the point of this test
    const invalidRelationModelDefinition: ModelDefinition = {
      name: 'myModel',
      schema: {},
      accountRelation: { type: 'list' },
      relations: {
        linkedDoc: { type: 'document', model: 'this is totally a streamid, trust me bro' },
      },
    }

    await expect(Model.create(ceramic, invalidRelationModelDefinition)).rejects.toThrow(
      /Relation on field linkedDoc has invalid model/
    )
  })

  test('Can load a complete stream', async () => {
    const model = await Model.create(ceramic, MODEL_DEFINITION)
    await TestUtils.anchorUpdate(core, model)
    await model.sync()

    const loaded = await Model.load(ceramic, model.id)

    expect(loaded.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    expect(loaded.state.log.length).toEqual(2)
    expect(JSON.stringify(loaded.state)).toEqual(JSON.stringify(model.state))
  })
})

describe('Model API multi-node tests', () => {
  jest.setTimeout(1000 * 30)

  let ipfs0: IpfsApi
  let ipfs1: IpfsApi
  let ceramic0: Ceramic
  let ceramic1: Ceramic

  beforeAll(async () => {
    ipfs0 = await createIPFS()
    ipfs1 = await createIPFS()
  }, 12000)

  beforeEach(async () => {
    process.env.CERAMIC_ENABLE_EXPERIMENTAL_COMPOSE_DB = 'true'

    ceramic0 = await createCeramic(ipfs0)
    ceramic1 = await createCeramic(ipfs1)
  }, 12000)

  afterEach(async () => {
    await ceramic0.close()
    await ceramic1.close()
  })

  afterAll(async () => {
    await ipfs0.stop()
    await ipfs1.stop()
  })

  test('load basic model', async () => {
    const model = await Model.create(ceramic0, MODEL_DEFINITION)

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
    await TestUtils.anchorUpdate(ceramic0, model)

    const loaded = await Model.load(ceramic1, model.id)

    expect(loaded.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    expect(loaded.state.log.length).toEqual(2)
    expect(JSON.stringify(loaded.state)).toEqual(JSON.stringify(model.state))
  })
})
