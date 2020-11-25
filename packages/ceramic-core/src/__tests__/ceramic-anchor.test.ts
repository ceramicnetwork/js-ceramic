import Ceramic from '../ceramic'
import IdentityWallet from 'identity-wallet'
import { Doctype, IpfsApi } from "@ceramicnetwork/ceramic-common"
import { TileDoctype } from "@ceramicnetwork/ceramic-doctype-tile"
import tmp from 'tmp-promise'
import IPFS from 'ipfs-core'
import * as u8a from 'uint8arrays'

import getPort from 'get-port'

import dagJose from 'dag-jose'
import basicsImport from 'multiformats/cjs/src/basics-import.js'
import legacy from 'multiformats/cjs/src/legacy.js'

jest.mock('../store/level-state-store')

const seed = u8a.fromString('6e34b2e1a9624113d81ece8a8a22e6e97f0e145c25c1d4d2d0e62753b4060c837097f768559e17ec89ee20cba153b23b9987912ec1e860fa1212ba4b84c776ce', 'base16')

/**
 * Create an IPFS instance
 * @param overrideConfig - IFPS config for override
 */
const createIPFS =(overrideConfig: Record<string, unknown> = {}): Promise<any> => {
  basicsImport.multicodec.add(dagJose)
  const format = legacy(basicsImport, dagJose.name)

  const config = {
    ipld: { formats: [format] },
  }

  Object.assign(config, overrideConfig)
  return IPFS.create(config)
}

const createCeramic = async (ipfs: IpfsApi, anchorManual: boolean, topic: string): Promise<Ceramic> => {
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

const anchor = async (ceramic: Ceramic): Promise<void> => {
  await ceramic.context.anchorService.anchor()
}

const syncDoc = async (doctype: Doctype): Promise<void> => {
  await new Promise(resolve => {
    doctype.on('change', () => {
      resolve()
    })
  })
}

describe('Ceramic anchoring', () => {
  jest.setTimeout(60000)
  let ipfs1: IpfsApi;
  let ipfs2: IpfsApi;
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

    const buildConfig = (path: string, port: number): Record<string, unknown> => {
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

    const controller = ceramic1.context.did.id

    const doctype1 = await ceramic1.createDocument(DOCTYPE_TILE, { content: { a: 1 } }, { applyOnly: false })
    await doctype1.change({ content: { a: 2 }, metadata: { controllers: [controller] } }, { applyOnly: false })
    await doctype1.change({ content: { a: 3 }, metadata: { controllers: [controller] } }, { applyOnly: false })

    await anchor(ceramic1)
    await syncDoc(doctype1)

    expect(doctype1.content).toEqual({ a: 3 })
    expect(doctype1.state.log.length).toEqual(3)

    const doctype2 = await ceramic2.loadDocument(doctype1.id)
    expect(doctype1.content).toEqual(doctype2.content)
    expect(doctype1.state.log.length).toEqual(doctype2.state.log.length)

    await ceramic1.close()
    await ceramic2.close()
  })

  it('test no records anchored', async () => {
    await ipfs2.swarm.connect(multaddr1)

    const [ceramic1, ceramic2] = await Promise.all([
      createCeramic(ipfs1, true, topic),
      createCeramic(ipfs2, false, topic)
    ])

    const controller = ceramic1.context.did.id

    const doctype1 = await ceramic1.createDocument(DOCTYPE_TILE, { content: { a: 1 } }, { applyOnly: true })
    await doctype1.change({ content: { a: 2 }, metadata: { controllers: [controller] } }, { applyOnly: true })
    await doctype1.change({ content: { a: 3 }, metadata: { controllers: [controller] } }, { applyOnly: true })

    expect(doctype1.content).toEqual({ a: 3 })
    expect(doctype1.state.log.length).toEqual(2)

    const doctype2 = await ceramic2.loadDocument(doctype1.id)
    expect(doctype1.content).toEqual(doctype2.content)
    expect(doctype1.state.log.length).toEqual(doctype2.state.log.length)

    await ceramic1.close()
    await ceramic2.close()
  })

  it('test genesis anchored and others not', async () => {
    await ipfs2.swarm.connect(multaddr1)

    const [ceramic1, ceramic2] = await Promise.all([
      createCeramic(ipfs1, true, topic),
      createCeramic(ipfs2, false, topic)
    ])
    const controller = ceramic1.context.did.id

    const doctype1 = await ceramic1.createDocument(DOCTYPE_TILE, { content: { a: 123, b: 4567 } }, { applyOnly: false })
    await doctype1.change({ content: { a: 4567 }, metadata: { controllers: [controller] } }, { applyOnly: true })
    await doctype1.change({ content: { b: 123 }, metadata: { controllers: [controller] } }, { applyOnly: true })

    expect(doctype1.state.log.length).toEqual(2)

    await anchor(ceramic1)
    await syncDoc(doctype1)

    expect(doctype1.content).toEqual({ a: 123, b: 4567 })
    expect(doctype1.state.log.length).toEqual(2)

    const doctype2 = await ceramic2.loadDocument(doctype1.id)
    expect(doctype1.content).toEqual(doctype2.content)
    expect(doctype1.state.log.length).toEqual(doctype2.state.log.length)

    await ceramic1.close()
    await ceramic2.close()
  })

  it('test genesis and the following anchored', async () => {
    await ipfs2.swarm.connect(multaddr1)

    const [ceramic1, ceramic2] = await Promise.all([
      createCeramic(ipfs1, true, topic),
      createCeramic(ipfs2, false, topic)
    ])
    const controller = ceramic1.context.did.id

    const doctype1 = await ceramic1.createDocument(DOCTYPE_TILE, { content: { a: 123 } })
    await doctype1.change({ content: { a: 4567 }, metadata: { controllers: [controller] } })

    expect(doctype1.state.log.length).toEqual(2)

    await anchor(ceramic1)
    await syncDoc(doctype1)

    expect(doctype1.content).toEqual({ a: 123 })
    expect(doctype1.state.log.length).toEqual(2)

    const doctype2 = await ceramic2.loadDocument(doctype1.id)
    expect(doctype1.content).toEqual(doctype2.content)
    expect(doctype1.state.log.length).toEqual(doctype2.state.log.length)

    await ceramic1.close()
    await ceramic2.close()
  })

  it('test genesis anchored, the middle not, last one anchored', async () => {
    await ipfs2.swarm.connect(multaddr1)

    const [ceramic1, ceramic2] = await Promise.all([
      createCeramic(ipfs1, true, topic),
      createCeramic(ipfs2, false, topic)
    ])
    const controller = ceramic1.context.did.id

    const doctype1 = await ceramic1.createDocument(DOCTYPE_TILE, { content: { x: 1 } }, { applyOnly: false })

    await doctype1.change({ content: { x: doctype1.content.x + 1 }, metadata: { controllers: [controller] } }, { applyOnly: true })
    await doctype1.change({ content: { x: doctype1.content.x + 1 }, metadata: { controllers: [controller] } }, { applyOnly: false })

    await anchor(ceramic1)
    await syncDoc(doctype1)

    expect(doctype1.content).toEqual({ x: 3 })
    expect(doctype1.state.log.length).toEqual(3)

    const doctype2 = await ceramic2.loadDocument(doctype1.id)
    expect(doctype1.content).toEqual(doctype2.content)
    expect(doctype1.state.log.length).toEqual(doctype2.state.log.length)

    await ceramic1.close()
    await ceramic2.close()
  })

  it('test last one anchored', async () => {
    await ipfs2.swarm.connect(multaddr1)

    const [ceramic1, ceramic2] = await Promise.all([
      createCeramic(ipfs1, true, topic),
      createCeramic(ipfs2, false, topic)
    ])
    const controller = ceramic1.context.did.id

    const doctype1 = await ceramic1.createDocument(DOCTYPE_TILE, { content: { x: 1 } }, { applyOnly: true })
    await doctype1.change({ content: { x: doctype1.content.x + 1 }, metadata: { controllers: [controller] } }, { applyOnly: true })
    await doctype1.change({ content: { x: doctype1.content.x + 1 }, metadata: { controllers: [controller] } }, { applyOnly: false })

    await anchor(ceramic1)
    await syncDoc(doctype1)

    expect(doctype1.content).toEqual({ x: 3 })
    expect(doctype1.state.log.length).toEqual(3)

    const doctype2 = await ceramic2.loadDocument(doctype1.id)
    expect(doctype1.content).toEqual(doctype2.content)
    expect(doctype1.state.log.length).toEqual(doctype2.state.log.length)

    await ceramic1.close()
    await ceramic2.close()
  })

  it('in the middle anchored', async () => {
    await ipfs2.swarm.connect(multaddr1)

    const [ceramic1, ceramic2] = await Promise.all([
      createCeramic(ipfs1, true, topic),
      createCeramic(ipfs2, false, topic)
    ])
    const controller = ceramic1.context.did.id

    const doctype1 = await ceramic1.createDocument(DOCTYPE_TILE, { content: { x: 1 } }, { applyOnly: true })
    await doctype1.change({ content: { x: doctype1.content.x + 1 }, metadata: { controllers: [controller] } }, { applyOnly: true })

    expect(doctype1.content).toEqual({ x: 2 })
    expect(doctype1.state.log.length).toEqual(2)

    await doctype1.change({ content: { x: doctype1.content.x + 1 }, metadata: { controllers: [controller] } }, { applyOnly: false })

    await anchor(ceramic1)
    await syncDoc(doctype1)

    expect(doctype1.content).toEqual({ x: 3 })
    expect(doctype1.state.log.length).toEqual(3)

    await doctype1.change({ content: { x: doctype1.content.x + 1 }, metadata: { controllers: [controller] } }, { applyOnly: true })
    await doctype1.change({ content: { x: doctype1.content.x + 1 }, metadata: { controllers: [controller] } }, { applyOnly: true })
    await doctype1.change({ content: { x: doctype1.content.x + 1 }, metadata: { controllers: [controller] } }, { applyOnly: false })

    await anchor(ceramic1)
    await syncDoc(doctype1)

    expect(doctype1.content).toEqual({ x: 6 })
    expect(doctype1.state.log.length).toEqual(5)

    const doctype2 = await ceramic2.loadDocument(doctype1.id)
    expect(doctype1.content).toEqual(doctype2.content)
    expect(doctype1.state.log.length).toEqual(doctype2.state.log.length)

    await ceramic1.close()
    await ceramic2.close()
  })

  it('test the same state anchored twice, first one wins', async () => {
    await ipfs2.swarm.connect(multaddr1)

    const [ceramic1, ceramic2] = await Promise.all([
      createCeramic(ipfs1, true, topic),
      createCeramic(ipfs2, false, topic)
    ])
    const controller = ceramic1.context.did.id

    const doctype1 = await ceramic1.createDocument(DOCTYPE_TILE, { content: { x: 1 } }, { applyOnly: true })
    const cloned = new TileDoctype(doctype1.state, doctype1.context)
    await doctype1.change({ content: { x: 7 }, metadata: { controllers: [controller] } }, { applyOnly: false })
    await cloned.change({ content: { x: 5 }, metadata: { controllers: [controller] } }, { applyOnly: false })

    await anchor(ceramic1)
    await syncDoc(doctype1)

    expect(doctype1.content).toEqual({ x: 7 })
    expect(doctype1.state.log.length).toEqual(3)

    const doctype2 = await ceramic2.loadDocument(doctype1.id)
    expect(doctype1.content).toEqual(doctype2.content)
    expect(doctype1.state.log.length).toEqual(doctype2.state.log.length)

    await ceramic1.close()
    await ceramic2.close()
  })
})
