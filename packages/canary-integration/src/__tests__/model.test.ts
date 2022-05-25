import { jest } from '@jest/globals'
import { AnchorStatus, IpfsApi } from '@ceramicnetwork/common'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { CeramicApi } from '@ceramicnetwork/common'
import { Model, ModelAccountRelation } from '@ceramicnetwork/stream-model'
import { createCeramic } from '../create-ceramic.js'

const PLACEHOLDER_CONTENT = { name: 'myModel' }
const FINAL_CONTENT = { name: 'myModel', schema: {}, accountRelation: ModelAccountRelation.LIST }

describe('Model core API tests', () => {
  jest.setTimeout(1000 * 30)

  let ipfs: IpfsApi
  let ceramic: CeramicApi

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
    expect(model.state.anchorStatus).toEqual(AnchorStatus.PENDING)
  })
})
