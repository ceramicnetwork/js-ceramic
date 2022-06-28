import { jest } from '@jest/globals'
import getPort from 'get-port'
import { AnchorStatus, CommitType, IpfsApi } from '@ceramicnetwork/common'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { Model, ModelAccountRelation } from '@ceramicnetwork/stream-model'
import { createCeramic } from '../create-ceramic.js'
import { anchorUpdate } from '@ceramicnetwork/core/lib/state-management/__tests__/anchor-update'
import { Ceramic } from '@ceramicnetwork/core'
import { CeramicDaemon, DaemonConfig } from '@ceramicnetwork/cli'
import { CeramicClient } from '@ceramicnetwork/http-client'

const PLACEHOLDER_CONTENT = { name: 'myModel' }
const FINAL_CONTENT = { name: 'myModel', schema: {}, accountRelation: ModelAccountRelation.LIST }

describe('Model API http-client tests', () => {
  jest.setTimeout(1000 * 30)

  let ipfs: IpfsApi
  let core: Ceramic
  let daemon: CeramicDaemon
  let ceramic: CeramicClient

  beforeAll(async () => {
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

  test('Create valid model', async () => {
    const model = await Model.create(ceramic, FINAL_CONTENT)

    expect(model.id.type).toEqual(Model.STREAM_TYPE_ID)
    expect(JSON.stringify(model.content)).toEqual(JSON.stringify(FINAL_CONTENT))
    expect(model.metadata).toEqual({ controller: ceramic.did.id.toString(), model: Model.MODEL })
    expect(model.state.log.length).toEqual(1)
    expect(model.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(model.state.anchorStatus).toEqual(AnchorStatus.PENDING)
  })

  test('Create and update placeholder', async () => {
    const model = await Model.createPlaceholder(ceramic, PLACEHOLDER_CONTENT)
    expect(JSON.stringify(model.content)).toEqual(JSON.stringify(PLACEHOLDER_CONTENT))

    await model.replacePlaceholder(FINAL_CONTENT)

    expect(JSON.stringify(model.content)).toEqual(JSON.stringify(FINAL_CONTENT))
    expect(model.state.log.length).toEqual(2)
    expect(model.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(model.state.log[1].type).toEqual(CommitType.SIGNED)
  })

  test('Anchor genesis', async () => {
    const model = await Model.create(ceramic, FINAL_CONTENT)
    expect(model.state.anchorStatus).toEqual(AnchorStatus.PENDING)

    await anchorUpdate(core, model)
    await model.sync()

    expect(model.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    expect(model.state.log.length).toEqual(2)
    expect(model.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(model.state.log[1].type).toEqual(CommitType.ANCHOR)
    expect(JSON.stringify(model.content)).toEqual(JSON.stringify(FINAL_CONTENT))
  })

  test('Anchor after updating placeholder', async () => {
    const model = await Model.createPlaceholder(ceramic, PLACEHOLDER_CONTENT)
    expect(model.state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)
    await model.replacePlaceholder(FINAL_CONTENT)
    expect(model.state.anchorStatus).toEqual(AnchorStatus.PENDING)

    await anchorUpdate(core, model)
    await model.sync()

    expect(model.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    expect(model.state.log.length).toEqual(3)
    expect(model.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(model.state.log[1].type).toEqual(CommitType.SIGNED)
    expect(model.state.log[2].type).toEqual(CommitType.ANCHOR)
    expect(JSON.stringify(model.content)).toEqual(JSON.stringify(FINAL_CONTENT))
  })

  test('Models are created uniquely', async () => {
    const model1 = await Model.create(ceramic, FINAL_CONTENT)
    const model2 = await Model.create(ceramic, FINAL_CONTENT)

    expect(model1.id.toString()).not.toEqual(model2.id.toString())
  })

  test('Cannot create incomplete model with create()', async () => {
    await expect(Model.create(ceramic, PLACEHOLDER_CONTENT)).rejects.toThrow(
      /missing a 'schema' field/
    )
  })

  test('Cannot update placeholder and leave it incomplete', async () => {
    const model = await Model.createPlaceholder(ceramic, PLACEHOLDER_CONTENT)

    const updatedContent = { ...PLACEHOLDER_CONTENT, accountRelation: ModelAccountRelation.LIST }
    await expect(model.replacePlaceholder(updatedContent)).rejects.toThrow(
      /missing a 'schema' field/
    )
  })

  test('Cannot update a finalized model', async () => {
    const model = await Model.createPlaceholder(ceramic, PLACEHOLDER_CONTENT)
    await model.replacePlaceholder(FINAL_CONTENT)

    const updatedContent = { ...FINAL_CONTENT, description: 'Adding a description' }
    await expect(model.replacePlaceholder(updatedContent)).rejects.toThrow(
      /Cannot update a finalized Model/
    )
  })

  test('Existing fields can be updated when updating a placeholder', async () => {
    const model = await Model.createPlaceholder(ceramic, PLACEHOLDER_CONTENT)
    const finalContent = {
      ...FINAL_CONTENT,
      name: 'newName',
      description: 'Also add a description',
    }

    await model.replacePlaceholder(finalContent)

    expect(JSON.stringify(model.content)).toEqual(JSON.stringify(finalContent))
  })

  test('Cannot load a placeholder', async () => {
    const model = await Model.createPlaceholder(ceramic, PLACEHOLDER_CONTENT)

    await expect(Model.load(ceramic, model.id)).rejects.toThrow(
      /Incomplete placeholder Models cannot be loaded/
    )
  })

  test('Can load a complete stream', async () => {
    const model = await Model.createPlaceholder(ceramic, PLACEHOLDER_CONTENT)
    await model.replacePlaceholder(FINAL_CONTENT)
    await anchorUpdate(core, model)
    await model.sync()

    const loaded = await Model.load(ceramic, model.id)

    expect(loaded.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    expect(loaded.state.log.length).toEqual(3)
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
    ceramic0 = await createCeramic(ipfs0)
    ceramic1 = await createCeramic(ipfs1)
  }, 12000)

  afterAll(async () => {
    await ceramic0.close()
    await ceramic1.close()
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

  test('load placeholder over network fails', async () => {
    const model = await Model.createPlaceholder(ceramic0, PLACEHOLDER_CONTENT)

    await expect(Model.load(ceramic1, model.id)).rejects.toThrow(
      /Incomplete placeholder Models cannot be loaded/
    )
  })

  test('load updated model', async () => {
    const model = await Model.createPlaceholder(ceramic0, PLACEHOLDER_CONTENT)
    await model.replacePlaceholder(FINAL_CONTENT)

    const loaded = await Model.load(ceramic1, model.id)

    const modelState = model.state
    const loadedState = loaded.state
    expect(modelState.anchorStatus).toEqual(AnchorStatus.PENDING)
    expect(loadedState.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)
    delete modelState.anchorStatus
    delete loadedState.anchorStatus
    expect(loadedState.log.length).toEqual(2)
    expect(JSON.stringify(loadedState)).toEqual(JSON.stringify(modelState))
  })

  test('load updated and anchored model', async () => {
    const model = await Model.createPlaceholder(ceramic0, PLACEHOLDER_CONTENT)
    await model.replacePlaceholder(FINAL_CONTENT)
    await anchorUpdate(ceramic0, model)

    const loaded = await Model.load(ceramic1, model.id)

    expect(loaded.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    expect(loaded.state.log.length).toEqual(3)
    expect(JSON.stringify(loaded.state)).toEqual(JSON.stringify(model.state))
  })
})
