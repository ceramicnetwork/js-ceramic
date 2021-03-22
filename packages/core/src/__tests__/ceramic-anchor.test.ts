import Ceramic from '../ceramic'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import {
  AnchorStatus,
  IpfsApi,
  TestUtils,
} from '@ceramicnetwork/common';
import tmp from 'tmp-promise'
import * as u8a from 'uint8arrays'
import { createIPFS, swarmConnect } from './ipfs-util';
import { TileDoctype } from '@ceramicnetwork/doctype-tile';
import InMemoryAnchorService from '../anchor/memory/in-memory-anchor-service';
import { anchorUpdate } from '../state-management/__tests__/anchor-update';

jest.mock('../store/level-state-store')

const seed = u8a.fromString('6e34b2e1a9624113d81ece8a8a22e6e97f0e145c25c1d4d2d0e62753b4060c83', 'base16')

const createCeramic = async (ipfs: IpfsApi, anchorManual: boolean): Promise<Ceramic> => {
  const ceramic = await Ceramic.create(ipfs, {
    stateStoreDirectory: await tmp.tmpName(),
    anchorOnRequest: !anchorManual,
    restoreDocuments: false,
    pubsubTopic: "/ceramic/inmemory/test" // necessary so Ceramic instances can talk to each other
  })
  const provider = new Ed25519Provider(seed)
  await ceramic.setDIDProvider(provider)

  return ceramic
}

describe('Ceramic anchoring', () => {
  jest.setTimeout(60000)
  let ipfs1: IpfsApi;
  let ipfs2: IpfsApi;
  let ipfs3: IpfsApi;

  const DOCTYPE_TILE = 'tile'

  beforeAll(async () => {
    [ipfs1, ipfs2, ipfs3] = await Promise.all(Array.from({length: 3}).map(() => createIPFS()));
    await swarmConnect(ipfs1, ipfs2)
    await swarmConnect(ipfs2, ipfs3)
    await swarmConnect(ipfs1, ipfs3)
  })

  afterAll(async () => {
    await ipfs1.stop()
    await ipfs2.stop()
    await ipfs3.stop()
  })

  it('test all records anchored', async () => {
    const [ceramic1, ceramic2] = await Promise.all([
      createCeramic(ipfs1, true),
      createCeramic(ipfs2, false)
    ])

    const controller = ceramic1.context.did.id

    const doctype1 = await ceramic1.createDocument(DOCTYPE_TILE, { content: { a: 1 } }, {})
    await doctype1.change({ content: { a: 2 }, metadata: { controllers: [controller] } }, {})
    await doctype1.change({ content: { a: 3 }, metadata: { controllers: [controller] } }, {})

    await anchorUpdate(ceramic1, doctype1)

    expect(doctype1.content).toEqual({ a: 3 })
    expect(doctype1.state.log.length).toEqual(4)
    expect(doctype1.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

    const doctype2 = await ceramic2.loadDocument(doctype1.id)
    expect(doctype1.content).toEqual(doctype2.content)
    expect(doctype1.state.log.length).toEqual(doctype2.state.log.length)

    await ceramic1.close()
    await ceramic2.close()
  })

  it('test no records anchored', async () => {
    const [ceramic1, ceramic2] = await Promise.all([
      createCeramic(ipfs1, true),
      createCeramic(ipfs2, false)
    ])

    const controller = ceramic1.context.did.id

    const doctype1 = await ceramic1.createDocument(DOCTYPE_TILE, { content: { a: 1 } }, { anchor: false, publish: false })
    await doctype1.change({ content: { a: 2 }, metadata: { controllers: [controller] } }, { anchor: false, publish: false })
    await doctype1.change({ content: { a: 3 }, metadata: { controllers: [controller] } }, { anchor: false, publish: false })

    expect(doctype1.content).toEqual({ a: 3 })
    expect(doctype1.state.log.length).toEqual(3)

    const doctype2 = await ceramic2.loadDocument(doctype1.id)
    expect(doctype1.content).toEqual(doctype2.content)
    expect(doctype1.state.log.length).toEqual(doctype2.state.log.length)

    await ceramic1.close()
    await ceramic2.close()
  })

  it('test genesis anchored and others not', async () => {
    const [ceramic1, ceramic2] = await Promise.all([
      createCeramic(ipfs1, true),
      createCeramic(ipfs2, false)
    ])
    const controller = ceramic1.context.did.id

    const doctype1 = await ceramic1.createDocument(DOCTYPE_TILE, { content: { a: 123, b: 4567 } }, {})
    await doctype1.change({ content: { a: 4567 }, metadata: { controllers: [controller] } }, { anchor: false, publish: false })
    await doctype1.change({ content: { b: 123 }, metadata: { controllers: [controller] } }, { anchor: false, publish: false })

    expect(doctype1.state.log.length).toEqual(3)

    await anchorUpdate(ceramic1, doctype1)

    expect(doctype1.content).toEqual({ a: 123, b: 4567 })
    expect(doctype1.state.log.length).toEqual(2)

    const doctype2 = await ceramic2.loadDocument(doctype1.id)
    expect(doctype1.content).toEqual(doctype2.content)
    expect(doctype1.state.log.length).toEqual(doctype2.state.log.length)

    await ceramic1.close()
    await ceramic2.close()
  })

  it('test genesis and the following anchored', async () => {
    const [ceramic1, ceramic2] = await Promise.all([
      createCeramic(ipfs1, true),
      createCeramic(ipfs2, false)
    ])
    const controller = ceramic1.context.did.id

    const doctype1 = await ceramic1.createDocument(DOCTYPE_TILE, { content: { a: 123 } })
    await doctype1.change({ content: { a: 4567 }, metadata: { controllers: [controller] } })

    expect(doctype1.state.log.length).toEqual(2)

    await anchorUpdate(ceramic1, doctype1)

    expect(doctype1.content).toEqual({ a: 4567 })
    expect(doctype1.state.log.length).toEqual(3)

    const doctype2 = await ceramic2.loadDocument(doctype1.id)
    expect(doctype1.content).toEqual(doctype2.content)
    expect(doctype1.state.log.length).toEqual(doctype2.state.log.length)

    await ceramic1.close()
    await ceramic2.close()
  })

  it('test genesis anchored, the middle not, last one anchored', async () => {
    const [ceramic1, ceramic2] = await Promise.all([
      createCeramic(ipfs1, true),
      createCeramic(ipfs2, false)
    ])
    const controller = ceramic1.context.did.id

    const doctype1 = await ceramic1.createDocument(DOCTYPE_TILE, { content: { x: 1 } }, {})

    await doctype1.change({ content: { x: doctype1.content.x + 1 }, metadata: { controllers: [controller] } }, { anchor: false, publish: false })
    await doctype1.change({ content: { x: doctype1.content.x + 1 }, metadata: { controllers: [controller] } }, { anchor: true, publish: true })

    await anchorUpdate(ceramic1, doctype1)

    expect(doctype1.content).toEqual({ x: 3 })
    expect(doctype1.state.log.length).toEqual(4)

    const doctype2 = await ceramic2.loadDocument(doctype1.id)
    expect(doctype1.content).toEqual(doctype2.content)
    expect(doctype1.state.log.length).toEqual(doctype2.state.log.length)

    await ceramic1.close()
    await ceramic2.close()
  })

  it('test last one anchored', async () => {
    const [ceramic1, ceramic2] = await Promise.all([
      createCeramic(ipfs1, true),
      createCeramic(ipfs2, false)
    ])
    const controller = ceramic1.context.did.id

    const doctype1 = await ceramic1.createDocument(DOCTYPE_TILE, { content: { x: 1 } }, { anchor: false, publish: false })
    await doctype1.change({ content: { x: doctype1.content.x + 1 }, metadata: { controllers: [controller] } }, { anchor: false, publish: false })
    await doctype1.change({ content: { x: doctype1.content.x + 1 }, metadata: { controllers: [controller] } }, { anchor: true, publish: true })

    await anchorUpdate(ceramic1, doctype1)

    expect(doctype1.content).toEqual({ x: 3 })
    expect(doctype1.state.log.length).toEqual(4)

    const doctype2 = await ceramic2.loadDocument(doctype1.id)
    expect(doctype1.content).toEqual(doctype2.content)
    expect(doctype1.state.log.length).toEqual(doctype2.state.log.length)

    await ceramic1.close()
    await ceramic2.close()
  })

  it('in the middle anchored', async () => {
    const [ceramic1, ceramic2] = await Promise.all([
      createCeramic(ipfs1, true),
      createCeramic(ipfs2, false)
    ])
    const controller = ceramic1.context.did.id

    const doctype1 = await ceramic1.createDocument<TileDoctype>(DOCTYPE_TILE, { content: { x: 1 } }, { anchor: false, publish: false })
    await doctype1.change({ content: { x: doctype1.content.x + 1 }, metadata: { controllers: [controller] } }, { anchor: false, publish: false })

    expect(doctype1.content).toEqual({ x: 2 })
    expect(doctype1.state.log.length).toEqual(2)

    await doctype1.change({ content: { x: doctype1.content.x + 1 }, metadata: { controllers: [controller] } }, { anchor: true, publish: true })

    await anchorUpdate(ceramic1, doctype1)

    expect(doctype1.content).toEqual({ x: 3 })
    expect(doctype1.state.log.length).toEqual(4)

    await doctype1.change({ content: { x: doctype1.content.x + 1 }, metadata: { controllers: [controller] } }, { anchor: false, publish: false })
    await doctype1.change({ content: { x: doctype1.content.x + 1 }, metadata: { controllers: [controller] } }, { anchor: false, publish: false })
    await doctype1.change({ content: { x: doctype1.content.x + 1 }, metadata: { controllers: [controller] } }, { anchor: true, publish: true })

    await anchorUpdate(ceramic1, doctype1)

    expect(doctype1.content).toEqual({ x: 6 })
    expect(doctype1.state.log.length).toEqual(8)

    const doctype2 = await ceramic2.loadDocument<TileDoctype>(doctype1.id)
    await TestUtils.waitForState(
        doctype2,
        5000, // 5 second timeout
        (state) => state.content == doctype1.content,
        () => expect(doctype1.content).toEqual(doctype2.content))
    expect(doctype1.state.log.length).toEqual(doctype2.state.log.length)

    await ceramic1.close()
    await ceramic2.close()
  })

  it('test the same doc anchored twice (different Ceramic instances), first one wins)', async () => {
    const [ceramic1, ceramic2, ceramic3] = await Promise.all([
      createCeramic(ipfs1, true),
      createCeramic(ipfs2, true),
      createCeramic(ipfs3, true),
    ])
    const controller = ceramic1.context.did.id

    const anchorService = ceramic3.context.anchorService as InMemoryAnchorService
    // use ceramic3 in-memory anchor service, ugly as hell
    ceramic1.repository.stateManager.anchorService = anchorService
    ceramic2.repository.stateManager.anchorService = anchorService

    const doctype1 = await ceramic1.createDocument(DOCTYPE_TILE, { content: { x: 1 } }, { anchor: false, publish: true })
    doctype1.subscribe();
    const doctype2 = await ceramic2.loadDocument(doctype1.id)
    doctype2.subscribe();

    // Create two conflicting updates, each on a different ceramic instance
    const newContent1 = { x: 7 }
    const newContent2 = { x: 5 }
    await doctype1.change({ content: newContent1, metadata: { controllers: [controller] } }, { anchor: true, publish: false })
    await doctype2.change({ content: newContent2, metadata: { controllers: [controller] } }, { anchor: true, publish: false })

    // Which update wins depends on which update got assigned the lower CID
    const update1ShouldWin = doctype1.state.log[doctype1.state.log.length - 1].cid.bytes < doctype2.state.log[doctype2.state.log.length - 1].cid.bytes
    const winningContent = update1ShouldWin ? newContent1 : newContent2

    await anchorService.anchor()
    await TestUtils.waitForState(doctype2, 2000, state => state.anchorStatus === AnchorStatus.ANCHORED, () => {
      throw new Error(`doctype2 not anchored still`)
    })
    await TestUtils.waitForState(doctype1, 2000, state => state.anchorStatus === AnchorStatus.ANCHORED, () => {
      throw new Error(`doctype1 not anchored still`)
    })

    // Only one of the updates should have won
    expect(doctype1.state.log.length).toEqual(3)
    expect(doctype2.state.log.length).toEqual(3)
    expect(doctype1.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    expect(doctype2.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    expect(doctype1.content).toEqual(winningContent)
    expect(doctype2.content).toEqual(winningContent)


    const doctype3 = await ceramic3.loadDocument(doctype1.id)
    expect(doctype3.content).toEqual(winningContent)
    expect(doctype3.state.log.length).toEqual(3)

    await ceramic1.close()
    await ceramic2.close()
    await ceramic3.close()
  })
})
