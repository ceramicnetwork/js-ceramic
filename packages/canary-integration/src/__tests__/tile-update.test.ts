import { IpfsApi } from '@ceramicnetwork/common'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { CeramicApi } from '@ceramicnetwork/common'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { DID } from 'dids'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import * as KeyResolver from 'key-did-resolver'
import { randomBytes } from '@stablelib/random'
import { createCeramic } from '../create-ceramic.js'

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

test('can update a tile document with valid asDID', async () => {
  const newTile = await TileDocument.create(ceramic, { foo: 'bar' })
  await newTile.update({ foo: 'baz' }, null, { asDID: ceramic.did })

  expect(newTile.content).toMatchObject({
    foo: 'baz',
  })
}, 10000)

test('cannot update a tile document with invalid asDID', async () => {
  const newTile = await TileDocument.create(ceramic, { foo: 'bar' })

  const provider = new Ed25519Provider(randomBytes(32))
  const did = new DID({ provider, resolver: KeyResolver.getResolver() })

  await did.authenticate()

  await expect(newTile.update({ foo: 'baz' }, null, { asDID: did })).rejects.toThrow()

  expect(newTile.content).toMatchObject({ foo: 'bar' })
}, 10000)
