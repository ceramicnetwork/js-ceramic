import IPFS from 'ipfs-core'
import Ceramic from '../ceramic'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import tmp from 'tmp-promise'
import getPort from 'get-port'
import { DoctypeUtils, DocState, Doctype, IpfsApi } from "@ceramicnetwork/common"
import { TileDoctype } from "@ceramicnetwork/doctype-tile"

import dagJose from 'dag-jose'
import basicsImport from 'multiformats/cjs/src/basics-import.js'
import legacy from 'multiformats/cjs/src/legacy.js'
import * as u8a from 'uint8arrays'

//jest.mock('../store/level-state-store')

const seed = u8a.fromString('6e34b2e1a9624113d81ece8a8a22e6e97f0e145c25c1d4d2d0e62753b4060c83', 'base16')

/**
 * Create an IPFS instance
 * @param overrideConfig - IPFS config for override
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

const expectEqualStates = (state1: DocState, state2: DocState): void => {
  expect(DoctypeUtils.serializeState(state1)).toEqual(DoctypeUtils.serializeState(state2))
}

async function delay(mills: number): Promise<void> {
  await new Promise(resolve => setTimeout(() => resolve(), mills))
}

const createCeramic = async (ipfs: IpfsApi, stateStorePath, anchorOnRequest = false): Promise<Ceramic> => {
  const ceramic = await Ceramic.create(ipfs, {
    stateStorePath,
    anchorOnRequest,
    pubsubTopic: "/ceramic/inmemory/test" // necessary so Ceramic instances can talk to each other
  })
  const provider = new Ed25519Provider(seed)
  await ceramic.setDIDProvider(provider)

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

const createDoc = async (ceramic: CeramicApi, controller: string, family: string): Promise<void> => {
  return ceramic.createDocument(
    'tile',
    { deterministic: true, metadata: { controllers: [controller], family } },
    { anchor: false, publish: false }
  )
}


describe('Ceramic document pinning', () => {
  jest.setTimeout(60000)
  let ipfs1: IpfsApi;
  let tmpFolder: any;

  const DOCTYPE_TILE = 'tile'

  let p1Start = 4400

  const pOffset = 100

  let port1: number;

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

    ipfs1 = await createIPFS(buildConfig(tmpFolder.path), await findPort(p1Start, pOffset))
    p1Start += pOffset
  })

  afterEach(async () => {
    await ipfs1.stop(() => console.log('IPFS1 stopped'))
    await tmpFolder.cleanup()
  })

  it('Document not pinned will not retain data on restart', async () => {
    let ceramic = await createCeramic(ipfs1, tmpFolder.path)
    const doc1 = await createDoc(ceramic, ceramic.did.id, 'test')
    const content = { some: 'data' }
    await doc1.change({ content })
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
    await doc1.change({ content })
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
    await doc1.change({ content })
    expect(doc1.content).toEqual(content)
    await ceramic.close()

    ceramic = await createCeramic(ipfs1, tmpFolder.path)
    const doc2 = await createDoc(ceramic, ceramic.did.id, 'test')
    expect(doc2.content).toEqual(content)
    await ceramic.close()
  })
})
