import Ceramic from '../ceramic'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import { AnchorStatus, Doctype, IpfsApi } from "@ceramicnetwork/common"
import tmp from 'tmp-promise'
import * as u8a from 'uint8arrays'
import { createIPFS, swarmConnect } from './ipfs-util';

jest.mock('../store/level-state-store')

const seed = u8a.fromString('6e34b2e1a9624113d81ece8a8a22e6e97f0e145c25c1d4d2d0e62753b4060c83', 'base16')

const createCeramic = async (ipfs: IpfsApi, anchorManual: boolean): Promise<Ceramic> => {
  const ceramic = await Ceramic.create(ipfs, {
    pinsetDirectory: await tmp.tmpName(),
    anchorOnRequest: !anchorManual,
    restoreDocuments: false,
    pubsubTopic: "/ceramic/inmemory/test" // necessary so Ceramic instances can talk to each other
  })
  const provider = new Ed25519Provider(seed)
  await ceramic.setDIDProvider(provider)

  return ceramic
}

const registerChangeListener = function (doc: Doctype): Promise<void> {
  return new Promise(resolve => {
    doc.on('change', () => {
      resolve()
    })
  })
}

/**
 * Registers a listener for change notifications on a document, instructs the anchor service to
 * perform an anchor, then waits for the change listener to resolve, indicating that the document
 * got anchored.
 * @param ceramic
 * @param doc
 */
const anchorDoc = async (ceramic: Ceramic, doc: any): Promise<void> => {
  const changeHandle = registerChangeListener(doc)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  await ceramic.context.anchorService.anchor()
  await changeHandle
}

describe('Ceramic anchoring', () => {
  jest.setTimeout(60000)
  let ipfs1: IpfsApi;
  let ipfs2: IpfsApi;
  let ipfs3: IpfsApi;

  const DOCTYPE_TILE = 'tile'

  beforeEach(async () => {
    [ipfs1, ipfs2, ipfs3] = await Promise.all(Array.from({length: 3}).map(() => createIPFS()));
  })

  afterEach(async () => {
    await ipfs1.stop(() => console.log('IPFS1 stopped'))
    await ipfs2.stop(() => console.log('IPFS2 stopped'))
    await ipfs3.stop(() => console.log('IPFS3 stopped'))
  })

  it('test all records anchored', async () => {
    await swarmConnect(ipfs1, ipfs2)

    const [ceramic1, ceramic2] = await Promise.all([
      createCeramic(ipfs1, true),
      createCeramic(ipfs2, false)
    ])

    const controller = ceramic1.context.did.id

    const doctype1 = await ceramic1.createDocument(DOCTYPE_TILE, { content: { a: 1 } }, {})
    await doctype1.change({ content: { a: 2 }, metadata: { controllers: [controller] } }, {})
    await doctype1.change({ content: { a: 3 }, metadata: { controllers: [controller] } }, {})

    await anchorDoc(ceramic1, doctype1)

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
    await swarmConnect(ipfs2, ipfs1)

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
    await swarmConnect(ipfs2, ipfs1)

    const [ceramic1, ceramic2] = await Promise.all([
      createCeramic(ipfs1, true),
      createCeramic(ipfs2, false)
    ])
    const controller = ceramic1.context.did.id

    const doctype1 = await ceramic1.createDocument(DOCTYPE_TILE, { content: { a: 123, b: 4567 } }, {})
    await doctype1.change({ content: { a: 4567 }, metadata: { controllers: [controller] } }, { anchor: false, publish: false })
    await doctype1.change({ content: { b: 123 }, metadata: { controllers: [controller] } }, { anchor: false, publish: false })

    expect(doctype1.state.log.length).toEqual(3)

    await anchorDoc(ceramic1, doctype1)

    expect(doctype1.content).toEqual({ a: 123, b: 4567 })
    expect(doctype1.state.log.length).toEqual(2)

    const doctype2 = await ceramic2.loadDocument(doctype1.id)
    expect(doctype1.content).toEqual(doctype2.content)
    expect(doctype1.state.log.length).toEqual(doctype2.state.log.length)

    await ceramic1.close()
    await ceramic2.close()
  })

  it('test genesis and the following anchored', async () => {
    await swarmConnect(ipfs2, ipfs1)

    const [ceramic1, ceramic2] = await Promise.all([
      createCeramic(ipfs1, true),
      createCeramic(ipfs2, false)
    ])
    const controller = ceramic1.context.did.id

    const doctype1 = await ceramic1.createDocument(DOCTYPE_TILE, { content: { a: 123 } })
    await doctype1.change({ content: { a: 4567 }, metadata: { controllers: [controller] } })

    expect(doctype1.state.log.length).toEqual(2)

    await anchorDoc(ceramic1, doctype1)

    expect(doctype1.content).toEqual({ a: 4567 })
    expect(doctype1.state.log.length).toEqual(3)

    const doctype2 = await ceramic2.loadDocument(doctype1.id)
    expect(doctype1.content).toEqual(doctype2.content)
    expect(doctype1.state.log.length).toEqual(doctype2.state.log.length)

    await ceramic1.close()
    await ceramic2.close()
  })

  it('test genesis anchored, the middle not, last one anchored', async () => {
    await swarmConnect(ipfs1, ipfs2)

    const [ceramic1, ceramic2] = await Promise.all([
      createCeramic(ipfs1, true),
      createCeramic(ipfs2, false)
    ])
    const controller = ceramic1.context.did.id

    const doctype1 = await ceramic1.createDocument(DOCTYPE_TILE, { content: { x: 1 } }, {})

    await doctype1.change({ content: { x: doctype1.content.x + 1 }, metadata: { controllers: [controller] } }, { anchor: false, publish: false })
    await doctype1.change({ content: { x: doctype1.content.x + 1 }, metadata: { controllers: [controller] } }, { anchor: true, publish: true })

    await anchorDoc(ceramic1, doctype1)

    expect(doctype1.content).toEqual({ x: 3 })
    expect(doctype1.state.log.length).toEqual(4)

    const doctype2 = await ceramic2.loadDocument(doctype1.id)
    expect(doctype1.content).toEqual(doctype2.content)
    expect(doctype1.state.log.length).toEqual(doctype2.state.log.length)

    await ceramic1.close()
    await ceramic2.close()
  })

  it('test last one anchored', async () => {
    await swarmConnect(ipfs1, ipfs2)

    const [ceramic1, ceramic2] = await Promise.all([
      createCeramic(ipfs1, true),
      createCeramic(ipfs2, false)
    ])
    const controller = ceramic1.context.did.id

    const doctype1 = await ceramic1.createDocument(DOCTYPE_TILE, { content: { x: 1 } }, { anchor: false, publish: false })
    await doctype1.change({ content: { x: doctype1.content.x + 1 }, metadata: { controllers: [controller] } }, { anchor: false, publish: false })
    await doctype1.change({ content: { x: doctype1.content.x + 1 }, metadata: { controllers: [controller] } }, { anchor: true, publish: true })

    await anchorDoc(ceramic1, doctype1)

    expect(doctype1.content).toEqual({ x: 3 })
    expect(doctype1.state.log.length).toEqual(4)

    const doctype2 = await ceramic2.loadDocument(doctype1.id)
    expect(doctype1.content).toEqual(doctype2.content)
    expect(doctype1.state.log.length).toEqual(doctype2.state.log.length)

    await ceramic1.close()
    await ceramic2.close()
  })

  it('in the middle anchored', async () => {
    await swarmConnect(ipfs1, ipfs2)

    const [ceramic1, ceramic2] = await Promise.all([
      createCeramic(ipfs1, true),
      createCeramic(ipfs2, false)
    ])
    const controller = ceramic1.context.did.id

    const doctype1 = await ceramic1.createDocument(DOCTYPE_TILE, { content: { x: 1 } }, { anchor: false, publish: false })
    await doctype1.change({ content: { x: doctype1.content.x + 1 }, metadata: { controllers: [controller] } }, { anchor: false, publish: false })

    expect(doctype1.content).toEqual({ x: 2 })
    expect(doctype1.state.log.length).toEqual(2)

    await doctype1.change({ content: { x: doctype1.content.x + 1 }, metadata: { controllers: [controller] } }, { anchor: true, publish: true })

    await anchorDoc(ceramic1, doctype1)

    expect(doctype1.content).toEqual({ x: 3 })
    expect(doctype1.state.log.length).toEqual(4)

    await doctype1.change({ content: { x: doctype1.content.x + 1 }, metadata: { controllers: [controller] } }, { anchor: false, publish: false })
    await doctype1.change({ content: { x: doctype1.content.x + 1 }, metadata: { controllers: [controller] } }, { anchor: false, publish: false })
    await doctype1.change({ content: { x: doctype1.content.x + 1 }, metadata: { controllers: [controller] } }, { anchor: true, publish: true })

    await anchorDoc(ceramic1, doctype1)

    expect(doctype1.content).toEqual({ x: 6 })
    expect(doctype1.state.log.length).toEqual(8)

    const doctype2 = await ceramic2.loadDocument(doctype1.id)
    expect(doctype1.content).toEqual(doctype2.content)
    expect(doctype1.state.log.length).toEqual(doctype2.state.log.length)

    await ceramic1.close()
    await ceramic2.close()
  })

  it('test the same doc anchored twice (different Ceramic instances), first one wins)', async () => {
    await swarmConnect(ipfs3, ipfs1)
    await swarmConnect(ipfs3, ipfs2)

    const [ceramic1, ceramic2, ceramic3] = await Promise.all([
      createCeramic(ipfs1, true),
      createCeramic(ipfs2, true),
      createCeramic(ipfs3, true),
    ])
    const controller = ceramic1.context.did.id

    ceramic1.context.anchorService = ceramic3.context.anchorService // use ceramic3 in-memory anchor service
    ceramic2.context.anchorService = ceramic3.context.anchorService // use ceramic3 in-memory anchor service

    const doctype1 = await ceramic1.createDocument(DOCTYPE_TILE, { content: { x: 1 } }, { anchor: false, publish: true })
    const doctype2 = await ceramic2.loadDocument(doctype1.id)

    // Create two conflicting updates, each on a different ceramic instance
    const newContent1 = { x: 7 }
    const newContent2 = { x: 5 }
    await doctype1.change({ content: newContent1, metadata: { controllers: [controller] } }, { anchor: true, publish: false })
    await doctype2.change({ content: newContent2, metadata: { controllers: [controller] } }, { anchor: true, publish: false })

    // Which update wins depends on which update got assigned the lower CID
    const update1ShouldWin = doctype1.state.log[doctype1.state.log.length - 1].cid.bytes < doctype2.state.log[doctype2.state.log.length - 1].cid.bytes
    const winningContent = update1ShouldWin ? newContent1 : newContent2

    const handle1 = registerChangeListener(doctype1)
    const handle2 = registerChangeListener(doctype2)

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await ceramic3.context.anchorService.anchor()

    await handle1
    await handle2

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
