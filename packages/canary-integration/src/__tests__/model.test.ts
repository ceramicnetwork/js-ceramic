import { jest } from '@jest/globals'
import { AnchorStatus, CommitType, IpfsApi } from '@ceramicnetwork/common'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { Model, ModelAccountRelation } from '@ceramicnetwork/stream-model'
import { createCeramic } from '../create-ceramic.js'
import { anchorUpdate } from '@ceramicnetwork/core/lib/state-management/__tests__/anchor-update'
import { Ceramic } from '@ceramicnetwork/core'
import { StreamID } from '@ceramicnetwork/streamid'

const PLACEHOLDER_CONTENT = { name: 'myModel' }
const FINAL_CONTENT = { name: 'myModel', schema: {}, accountRelation: ModelAccountRelation.LIST }

describe('Model core API tests', () => {
  jest.setTimeout(1000 * 30)

  let ipfs: IpfsApi
  let ceramic: Ceramic

  beforeAll(async () => {
    ipfs = await createIPFS()
    ceramic = await createCeramic(ipfs)
  }, 12000)

  afterAll(async () => {
    await ceramic.close()
    await ipfs.stop()
  })

  test('Create valid model', async () => {
    const model = await Model.create(ceramic, FINAL_CONTENT)

    expect(model.id.type).toEqual(Model.STREAM_TYPE_ID)
    expect(JSON.stringify(model.content)).toEqual(JSON.stringify(FINAL_CONTENT))
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

  test('temp', async () => {
    const modelStreamID = Model.MODEL
    console.log(modelStreamID.toString())
    const parsed = StreamID.fromString(modelStreamID.toString())
    expect(parsed.type).toEqual(modelStreamID.type)
    expect(parsed.cid.toString()).toEqual(modelStreamID.cid.toString())
  })

  test('Anchor genesis', async () => {
    const model = await Model.create(ceramic, FINAL_CONTENT)
    expect(model.state.anchorStatus).toEqual(AnchorStatus.PENDING)

    await anchorUpdate(ceramic, model)
    expect(model.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    expect(model.state.log.length).toEqual(2)
    expect(model.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(model.state.log[1].type).toEqual(CommitType.ANCHOR)
    expect(JSON.stringify(model.content)).toEqual(JSON.stringify(FINAL_CONTENT))
  })
})
