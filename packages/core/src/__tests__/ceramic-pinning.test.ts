import Ceramic from '../ceramic'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import tmp from 'tmp-promise'
import { IpfsApi, CeramicApi } from '@ceramicnetwork/common';
import * as u8a from 'uint8arrays'
import { createIPFS } from './ipfs-util';
import { TileDoctype } from '@ceramicnetwork/doctype-tile';
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'
import KeyDidResolver from 'key-did-resolver'
import { Resolver } from "did-resolver"
import { DID } from 'dids'

const seed = u8a.fromString('6e34b2e1a9624113d81ece8a8a22e6e97f0e145c25c1d4d2d0e62753b4060c83', 'base16')

const makeDID = function(seed: Uint8Array, ceramic: Ceramic): DID {
  const provider = new Ed25519Provider(seed)

  const keyDidResolver = KeyDidResolver.getResolver()
  const threeIdResolver = ThreeIdResolver.getResolver(ceramic)
  const resolver = new Resolver({
    ...threeIdResolver, ...keyDidResolver,
  })
  return new DID({ provider, resolver })
}

const createCeramic = async (ipfs: IpfsApi, stateStoreDirectory, anchorOnRequest = false): Promise<Ceramic> => {
  const ceramic = await Ceramic.create(ipfs, {
    stateStoreDirectory,
    anchorOnRequest,
    pubsubTopic: "/ceramic/inmemory/test" // necessary so Ceramic instances can talk to each other
  })
  await ceramic.setDID(makeDID(seed, ceramic))
  await ceramic.did.authenticate()

  return ceramic
}

async function createDoc (ceramic: CeramicApi, controller: string, family: string): Promise<TileDoctype> {
  return TileDoctype.create(ceramic,
      null,
      { deterministic: true, controllers: [controller], family },
      { anchor: false, publish: false }
  )
}


describe('Ceramic document pinning', () => {
  jest.setTimeout(60000)
  let ipfs1: IpfsApi;
  let tmpFolder: any;

  beforeEach(async () => {
    tmpFolder = await tmp.dir({ unsafeCleanup: true })
    ipfs1 = await createIPFS()
  })

  afterEach(async () => {
    await ipfs1.stop(() => console.log('IPFS1 stopped'))
    await tmpFolder.cleanup()
  })

  it('Document not pinned will not retain data on restart', async () => {
    let ceramic = await createCeramic(ipfs1, tmpFolder.path)
    const doc1 = await createDoc(ceramic, ceramic.did.id, 'test')
    const content = { some: 'data' }
    await doc1.update(content)
    expect(doc1.content).toEqual(content)
    await ceramic.close()

    ceramic = await createCeramic(ipfs1, tmpFolder.path)
    const doc2 = await createDoc(ceramic, ceramic.did.id, 'test')
    expect(doc2.content).not.toEqual(content)
    await ceramic.close()
  })

  it('Document pinned will retain data on restart', async () => {
    let ceramic = await createCeramic(ipfs1, tmpFolder.path)
    const doc1 = await createDoc(ceramic, ceramic.did.id, 'test')
    await ceramic.pin.add(doc1.id)
    const content = { some: 'data' }
    await doc1.update(content)
    expect(doc1.content).toEqual(content)
    await ceramic.close()

    ceramic = await createCeramic(ipfs1, tmpFolder.path)
    const doc2 = await ceramic.loadDocument(doc1.id)
    expect(doc2.content).toEqual(content)
    await ceramic.close()
  })

  it('Document pinned will retain data on restart, load though create', async () => {
    let ceramic = await createCeramic(ipfs1, tmpFolder.path)
    const doc1 = await createDoc(ceramic, ceramic.did.id, 'test')
    await ceramic.pin.add(doc1.id)
    const content = { some: 'data' }
    await doc1.update(content)
    expect(doc1.content).toEqual(content)
    await ceramic.close()

    ceramic = await createCeramic(ipfs1, tmpFolder.path)
    const doc2 = await createDoc(ceramic, ceramic.did.id, 'test')
    expect(doc2.content).toEqual(content)
    await ceramic.close()
  })
})
