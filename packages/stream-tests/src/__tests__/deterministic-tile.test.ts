import { IpfsApi } from '@ceramicnetwork/common'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { CeramicApi } from '@ceramicnetwork/common'
import { createCeramic } from '../create-ceramic.js'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { testIfV3 } from '@ceramicnetwork/common-test-utils'

let ipfs: IpfsApi
let ceramic: CeramicApi

// These tests are never expected to be run in V' mode as tile documents will not be supported
beforeAll(async () => {
  ipfs = await createIPFS()
  ceramic = await createCeramic(ipfs)
}, 12000)

afterAll(async () => {
  await ipfs.stop()
  await ceramic.close()
})

testIfV3('can create and retreive deterministic tile document', async () => {
  const createdTile = await TileDocument.deterministic(ceramic, { family: 'test123' })
  await createdTile.update({ foo: 'bar' })

  const retrievedTile = await TileDocument.deterministic(
    ceramic,
    { family: 'test123' },
    { anchor: false, publish: false }
  )

  expect(createdTile.id.toString()).toEqual(retrievedTile.id.toString())
  expect(createdTile.content).toMatchObject(retrievedTile.content)
})

testIfV3(
  'cannot create or retreive deterministic tile document if family or tag not set',
  async () => {
    await expect(
      TileDocument.deterministic(ceramic, { forbidControllerChange: false })
    ).rejects.toThrow(/Family and\/or tags are required/)
  }
)
