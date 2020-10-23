import Ceramic from '../ceramic'
import IdentityWallet from 'identity-wallet'
import { TileDoctype } from "@ceramicnetwork/ceramic-doctype-tile"
import tmp from 'tmp-promise'
import Ipfs from 'ipfs'

import getPort from 'get-port'

import dagJose from 'dag-jose'
import basicsImport from 'multiformats/cjs/src/basics-import.js'
import legacy from 'multiformats/cjs/src/legacy.js'

jest.mock('../store/level-state-store')

const seed = '0x5872d6e0ae7347b72c9216db218ebbb9d9d0ae7ab818ead3557e8e78bf944184'

/**
 * Create an IPFS instance
 * @param overrideConfig - IFPS config for override
 */
const createIPFS =(overrideConfig: object = {}): Promise<any> => {
  basicsImport.multicodec.add(dagJose)
  const format = legacy(basicsImport, dagJose.name)

  const config = {
    ipld: { formats: [format] },
  }

  Object.assign(config, overrideConfig)
  return Ipfs.create(config)
}

const createCeramic = async (ipfs: Ipfs, anchorManual: boolean, topic: string): Promise<Ceramic> => {
  const ceramic = await Ceramic.create(ipfs, {
    stateStorePath: await tmp.tmpName(),
    topic,
    anchorOnRequest: !anchorManual,
  })

  await IdentityWallet.create({
    getPermission: async (): Promise<Array<string>> => [],
    seed,
    ceramic,
    disableIDX: true,
  })

  return ceramic
}

describe('Ceramic anchoring', () => {
  jest.setTimeout(60000)
  let ipfs1: Ipfs;
  let ipfs2: Ipfs;
  let multaddr1: string;
  let tmpFolder: any;

  const DOCTYPE_TILE = 'tile'

  let p1Start = 4000
  let p2Start = 4100

  const pOffset = 100

  let port1: number;
  let port2: number;

  const topic = '/ceramic_anchor'

  beforeEach(async () => {
    tmpFolder = await tmp.dir({ unsafeCleanup: true })

    const buildConfig = (path: string, port: number): object => {
      return {
        repo: `${path}/ipfs${port}/`, config: {
          Addresses: { Swarm: [`/ip4/127.0.0.1/tcp/${port}`] }, Bootstrap: []
        }
      }
    }

    const findPort = async (start: number, offset: number): Promise<number> => {
      return await getPort({port: getPort.makeRange(start + 1, start + offset)})
    }

    ([port1, port2] = await Promise.all([p1Start, p2Start].map(start => findPort(start, pOffset))));
    ([ipfs1, ipfs2] = await Promise.all([port1, port2].map(port => createIPFS(buildConfig(tmpFolder.path, port)))));
    ([p1Start, p2Start] = [p1Start, p2Start].map(start => start + pOffset))

    multaddr1 = (await ipfs1.id()).addresses[0].toString()

    const id1 = await ipfs1.id()
    multaddr1 = id1.addresses[0].toString()
  })

  afterEach(async () => {
    await ipfs1.stop(() => console.log('IPFS1 stopped'))
    await ipfs2.stop(() => console.log('IPFS2 stopped'))

    await tmpFolder.cleanup()
  })

  it('test all records anchored', async () => {
    await ipfs2.swarm.connect(multaddr1)

    const [ceramic1, ceramic2] = await Promise.all([
      createCeramic(ipfs1, true, topic),
      createCeramic(ipfs2, false, topic)
    ])

    const owner = ceramic1.context.did.id

    const doctype = await ceramic1.createDocument(DOCTYPE_TILE, { content: { a: 1 } }, { applyOnly: false })
    await doctype.change({ content: { a: 2 }, metadata: { owners: [owner] } }, { applyOnly: false })
    await doctype.change({ content: { a: 3 }, metadata: { owners: [owner] } }, { applyOnly: false })

    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    await ceramic1.context.anchorService.anchor()

    const updatePromise = new Promise(resolve => {
      doctype.once('change', () => {
        resolve()
      })
    })

    await updatePromise

    expect(doctype.content).toEqual({ a: 3 })
    expect(doctype.state.log.length).toEqual(3)

    const doctype2 = await ceramic2.loadDocument(doctype.id)
    expect(doctype.content).toEqual(doctype2.content)
    expect(doctype.state.log.length).toEqual(doctype2.state.log.length)

    await ceramic1.close()
    await ceramic2.close()
  })

  it('test no records anchored', async () => {
    await ipfs2.swarm.connect(multaddr1)

    const [ceramic1, ceramic2] = await Promise.all([
      createCeramic(ipfs1, true, topic),
      createCeramic(ipfs2, false, topic)
    ])

    const owner = ceramic1.context.did.id

    const doctype = await ceramic1.createDocument(DOCTYPE_TILE, { content: { a: 1 } }, { applyOnly: true })
    await doctype.change({ content: { a: 2 }, metadata: { owners: [owner] } }, { applyOnly: true })
    await doctype.change({ content: { a: 3 }, metadata: { owners: [owner] } }, { applyOnly: true })

    expect(doctype.content).toEqual({ a: 3 })
    expect(doctype.state.log.length).toEqual(2)

    // const doctype2 = await ceramic2.loadDocument(doctype.id)
    // expect(doctype.content).toEqual(doctype2.content)
    // expect(doctype.state.log.length).toEqual(doctype2.state.log.length)

    await ceramic1.close()
    await ceramic2.close()
  })

  it('test first anchored and others not', async () => {
    await ipfs2.swarm.connect(multaddr1)

    const [ceramic1, ceramic2] = await Promise.all([
      createCeramic(ipfs1, true, topic),
      createCeramic(ipfs2, false, topic)
    ])
    const owner = ceramic1.context.did.id

    const doctype = await ceramic1.createDocument(DOCTYPE_TILE, { content: { a: 123, b: 4567 } }, { applyOnly: false })
    await doctype.change({ content: { a: 4567 }, metadata: { owners: [owner] } }, { applyOnly: true })
    await doctype.change({ content: { b: 123 }, metadata: { owners: [owner] } }, { applyOnly: true })

    expect(doctype.state.log.length).toEqual(2)

    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    await ceramic1.context.anchorService.anchor()

    const updatePromise = new Promise(resolve => {
      doctype.once('change', () => {
        resolve()
      })
    })

    await updatePromise

    expect(doctype.content).toEqual({ a: 123, b: 4567 })
    expect(doctype.state.log.length).toEqual(2)

    const doctype2 = await ceramic2.loadDocument(doctype.id)
    expect(doctype.content).toEqual(doctype2.content)
    expect(doctype.state.log.length).toEqual(doctype2.state.log.length)

    await ceramic1.close()
    await ceramic2.close()
  })

  it('test first anchored, the middle not, last one anchored', async () => {
    await ipfs2.swarm.connect(multaddr1)

    const [ceramic1, ceramic2] = await Promise.all([
      createCeramic(ipfs1, true, topic),
      createCeramic(ipfs2, false, topic)
    ])
    const owner = ceramic1.context.did.id

    const doctype = await ceramic1.createDocument(DOCTYPE_TILE, { content: { x: 1 } }, { applyOnly: false })

    await doctype.change({ content: { x: doctype.content.x + 1 }, metadata: { owners: [owner] } }, { applyOnly: true })
    await doctype.change({ content: { x: doctype.content.x + 1 }, metadata: { owners: [owner] } }, { applyOnly: false })

    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    await ceramic1.context.anchorService.anchor()

    const updatePromise = new Promise(resolve => {
      doctype.once('change', () => {
        resolve()
      })
    })

    await updatePromise

    expect(doctype.content).toEqual({ x: 3 })
    expect(doctype.state.log.length).toEqual(3)

    const doctype2 = await ceramic2.loadDocument(doctype.id)
    expect(doctype.content).toEqual(doctype2.content)
    expect(doctype.state.log.length).toEqual(doctype2.state.log.length)

    await ceramic1.close()
    await ceramic2.close()
  })

  it('test last one anchored', async () => {
    await ipfs2.swarm.connect(multaddr1)

    const [ceramic1, ceramic2] = await Promise.all([
      createCeramic(ipfs1, true, topic),
      createCeramic(ipfs2, false, topic)
    ])
    const owner = ceramic1.context.did.id

    const doctype = await ceramic1.createDocument(DOCTYPE_TILE, { content: { x: 1 } }, { applyOnly: true })
    await doctype.change({ content: { x: doctype.content.x + 1 }, metadata: { owners: [owner] } }, { applyOnly: true })
    await doctype.change({ content: { x: doctype.content.x + 1 }, metadata: { owners: [owner] } }, { applyOnly: false })

    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    await ceramic1.context.anchorService.anchor()

    const updatePromise = new Promise(resolve => {
      doctype.once('change', () => {
        resolve()
      })
    })

    await updatePromise

    expect(doctype.content).toEqual({ x: 3 })
    expect(doctype.state.log.length).toEqual(3)

    const doctype2 = await ceramic2.loadDocument(doctype.id)
    expect(doctype.content).toEqual(doctype2.content)
    expect(doctype.state.log.length).toEqual(doctype2.state.log.length)

    await ceramic1.close()
    await ceramic2.close()
  })

  it('in the middle anchored', async () => {
    await ipfs2.swarm.connect(multaddr1)

    const [ceramic1, ceramic2] = await Promise.all([
      createCeramic(ipfs1, true, topic),
      createCeramic(ipfs2, false, topic)
    ])
    const owner = ceramic1.context.did.id

    const doctype = await ceramic1.createDocument(DOCTYPE_TILE, { content: { x: 1 } }, { applyOnly: true })
    await doctype.change({ content: { x: doctype.content.x + 1 }, metadata: { owners: [owner] } }, { applyOnly: true })

    expect(doctype.content).toEqual({ x: 2 })
    expect(doctype.state.log.length).toEqual(2)

    await doctype.change({ content: { x: doctype.content.x + 1 }, metadata: { owners: [owner] } }, { applyOnly: false })

    let updatePromise = new Promise(resolve => {
      doctype.once('change', () => {
        resolve()
      })
    })

    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    await ceramic1.context.anchorService.anchor()
    await updatePromise

    expect(doctype.content).toEqual({ x: 3 })
    expect(doctype.state.log.length).toEqual(3)

    await doctype.change({ content: { x: doctype.content.x + 1 }, metadata: { owners: [owner] } }, { applyOnly: true })
    await doctype.change({ content: { x: doctype.content.x + 1 }, metadata: { owners: [owner] } }, { applyOnly: true })
    await doctype.change({ content: { x: doctype.content.x + 1 }, metadata: { owners: [owner] } }, { applyOnly: false })

    updatePromise = new Promise(resolve => {
      doctype.once('change', () => {
        resolve()
      })
    })

    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    await ceramic1.context.anchorService.anchor()
    await updatePromise

    expect(doctype.content).toEqual({ x: 6 })
    expect(doctype.state.log.length).toEqual(5)

    const doctype2 = await ceramic2.loadDocument(doctype.id)
    expect(doctype.content).toEqual(doctype2.content)
    expect(doctype.state.log.length).toEqual(doctype2.state.log.length)

    await ceramic1.close()
    await ceramic2.close()
  })

  it('test the same state anchored twice, first one wins', async () => {
    await ipfs2.swarm.connect(multaddr1)

    const [ceramic1, ceramic2] = await Promise.all([
      createCeramic(ipfs1, true, topic),
      createCeramic(ipfs2, false, topic)
    ])
    const owner = ceramic1.context.did.id

    const doctype = await ceramic1.createDocument(DOCTYPE_TILE, { content: { x: 1 } }, { applyOnly: true })
    const cloned = new TileDoctype(doctype.state, doctype.context)
    await doctype.change({ content: { x: 7 }, metadata: { owners: [owner] } }, { applyOnly: false })
    await cloned.change({ content: { x: 5 }, metadata: { owners: [owner] } }, { applyOnly: false })

    const updatePromise = new Promise(resolve => {
      doctype.on('change', () => {
        resolve()
      })
    })

    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    await ceramic1.context.anchorService.anchor()
    await updatePromise

    expect(doctype.content).toEqual({ x: 7 })
    expect(doctype.state.log.length).toEqual(3)

    const doctype2 = await ceramic2.loadDocument(doctype.id)
    expect(doctype.content).toEqual(doctype2.content)
    expect(doctype.state.log.length).toEqual(doctype2.state.log.length)

    await ceramic1.close()
    await ceramic2.close()
  })
})
