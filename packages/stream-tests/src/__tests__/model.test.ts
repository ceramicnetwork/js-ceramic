import { jest } from '@jest/globals'
import getPort from 'get-port'
import { AnchorStatus, CommitType, IpfsApi, TestUtils } from '@ceramicnetwork/common'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { Model } from '@ceramicnetwork/stream-model'
import { createCeramic } from '../create-ceramic.js'
import { Ceramic } from '@ceramicnetwork/core'
import { CeramicDaemon, DaemonConfig } from '@ceramicnetwork/cli'
import { CeramicClient } from '@ceramicnetwork/http-client'

const PLACEHOLDER_CONTENT = { name: 'myModel' }
const FINAL_CONTENT = { name: 'myModel', schema: {}, accountRelation: { type: 'list' } }

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
    ceramic.setDID(core.did)
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
    const model = await Model.create(ceramic, FINAL_CONTENT)

    expect(model.id.type).toEqual(Model.STREAM_TYPE_ID)
    expect(JSON.stringify(model.content)).toEqual(JSON.stringify(FINAL_CONTENT))
    expect(model.metadata).toEqual({ controller: ceramic.did.id.toString(), model: Model.MODEL })
    expect(model.state.log.length).toEqual(1)
    expect(model.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(model.state.anchorStatus).toEqual(AnchorStatus.PENDING)
  })

  test('Anchor genesis', async () => {
    const model = await Model.create(ceramic, FINAL_CONTENT)
    expect(model.state.anchorStatus).toEqual(AnchorStatus.PENDING)

    await TestUtils.anchorUpdate(core, model)
    await model.sync()

    expect(model.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    expect(model.state.log.length).toEqual(2)
    expect(model.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(model.state.log[1].type).toEqual(CommitType.ANCHOR)
    expect(JSON.stringify(model.content)).toEqual(JSON.stringify(FINAL_CONTENT))
  })

  test('Models are created deterministically', async () => {
    const model1 = await Model.create(ceramic, FINAL_CONTENT)
    const model2 = await Model.create(ceramic, FINAL_CONTENT)

    expect(model1.id.toString()).toEqual(model2.id.toString())
  })

  test('Cannot create incomplete model with create()', async () => {
    await expect(Model.create(ceramic, PLACEHOLDER_CONTENT)).rejects.toThrow(
      /missing a 'schema' field/
    )
  })

  test('Can load a complete stream', async () => {
    const model = await Model.create(ceramic, FINAL_CONTENT)
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
    const model = await Model.create(ceramic0, FINAL_CONTENT)

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
    const model = await Model.create(ceramic0, FINAL_CONTENT)
    await TestUtils.anchorUpdate(ceramic0, model)

    const loaded = await Model.load(ceramic1, model.id)

    expect(loaded.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    expect(loaded.state.log.length).toEqual(2)
    expect(JSON.stringify(loaded.state)).toEqual(JSON.stringify(model.state))
  })
})
