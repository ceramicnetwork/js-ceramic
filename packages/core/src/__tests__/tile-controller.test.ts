import { IpfsApi } from '@ceramicnetwork/common'
import { createIPFS } from './ipfs-util'
import Ceramic from '../ceramic'
import { createCeramic } from './create-ceramic'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import * as random from '@stablelib/random'
import { Resolver } from 'did-resolver'
import KeyDidResolver from 'key-did-resolver'
import { DID } from 'dids'
import { TileDocument } from '@ceramicnetwork/stream-tile'

let ipfs: IpfsApi
let ceramic: Ceramic
let alice: DID
let bob: DID

const resolver = new Resolver({
  ...KeyDidResolver.getResolver(),
})

function makeKeyDid(): DID {
  return new DID({
    resolver: resolver,
    provider: new Ed25519Provider(random.randomBytes(32)),
  })
}

beforeAll(async () => {
  ipfs = await createIPFS()
  alice = makeKeyDid()
  bob = makeKeyDid()
  await alice.authenticate()
  await bob.authenticate()
}, 12000)

afterAll(async () => {
  await ipfs.stop()
})

beforeEach(async () => {
  ceramic = await createCeramic(ipfs)
})

afterEach(async () => {
  await ceramic.close()
})

describe('throw if controller is different from signer', () => {
  test('create', async () => {
    ceramic.did = alice
    await expect(
      TileDocument.create(ceramic, { foo: 'blah' }, { controllers: [bob.id] })
    ).rejects.toThrow(/invalid_jws/)
  })
  test('update', async () => {
    ceramic.did = alice
    const tile = await TileDocument.create(ceramic, { foo: 'blah' })
    expect(tile.controllers.length).toEqual(1)
    expect(tile.controllers[0]).toEqual(alice.id)
    ceramic.did = bob
    await expect(tile.update({ foo: 'bar' })).rejects.toThrow(/invalid_jws/)
  })
})
