import Ceramic from '../ceramic'
import IdentityWallet from 'identity-wallet'
import tmp from 'tmp-promise'
import Ipfs from 'ipfs'
import { DoctypeUtils, DocState } from "@ceramicnetwork/ceramic-common"
import { ThreeIdDoctype } from "@ceramicnetwork/ceramic-doctype-three-id"

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
    libp2p: {
      config: {
        dht: {
          enabled: true
        }
      }
    }
  }

  Object.assign(config, overrideConfig)
  return Ipfs.create(config)
}

const expectEqualStates = (state1: DocState, state2: DocState): void => {
  expect(DoctypeUtils.serializeState(state1)).toEqual(DoctypeUtils.serializeState(state2))
}

const createCeramic = async (ipfs: Ipfs): Promise<Ceramic> => {
  const ceramic = await Ceramic.create(ipfs, {
    stateStorePath: await tmp.tmpName()
  })

  await IdentityWallet.create({
    getPermission: async (): Promise<Array<string>> => [],
    seed,
    ceramic,
  })

  return ceramic
}

describe('Ceramic integration', () => {
  jest.setTimeout(30000)
  let ipfs1: Ipfs;
  let ipfs2: Ipfs;
  let ipfs3: Ipfs;
  let multaddr1: string;
  let multaddr2: string;
  let multaddr3: string;
  let tmpFolder: any;

  const DOCTYPE_TILE = 'tile'
  const DOCTYPE_3ID = '3id'

  let ipfsIndexOffset = 0

  beforeEach(async () => {
    tmpFolder = await tmp.dir({ unsafeCleanup: true })

    const buildConfig = (path: string, id: number): object => {
      return {
        repo: `${path}/ipfs${id}/`, config: {
          Addresses: { Swarm: [`/ip4/127.0.0.1/tcp/${4004 + id}`] }, Bootstrap: []
        }
      }
    }

    ([ipfs1, ipfs2, ipfs3] = await Promise.all([1, 2, 3].map(id => createIPFS(buildConfig(tmpFolder.path, ipfsIndexOffset + id)))))

    const id1 = await ipfs1.id()
    const id2 = await ipfs2.id()
    const id3 = await ipfs3.id()
    multaddr1 = id1.addresses[0].toString()
    multaddr2 = id2.addresses[0].toString()
    multaddr3 = id3.addresses[0].toString()
  })

  afterEach(async () => {
    await ipfs1.stop(() => console.log('IPFS1 stopped'))
    await ipfs2.stop(() => console.log('IPFS2 stopped'))
    await ipfs3.stop(() => console.log('IPFS3 stopped'))
    await tmpFolder.cleanup()

    ipfsIndexOffset += 3
  })

  it('can propagate update across two connected nodes', async () => {
    await ipfs2.swarm.connect(multaddr1)

    const ceramic1 = await createCeramic(ipfs1)
    const ceramic2 = await createCeramic(ipfs2)
    const doctype1 = await ceramic1.createDocument(DOCTYPE_TILE, { content: { test: 123 } }, { applyOnly: true })
    const doctype2 = await ceramic2.loadDocument(doctype1.id)
    expect(doctype1.content).toEqual(doctype2.content)
    expectEqualStates(doctype1.state, doctype2.state)
    await ceramic1.close()
    await ceramic2.close()
  })

  it('won\'t propagate update across two disconnected nodes', async () => {
    const ceramic1 = await createCeramic(ipfs1)
    const ceramic2 = await createCeramic(ipfs2)

    const owner = ceramic1.context.did.id

    const doctype1 = await ceramic1.createDocument(DOCTYPE_3ID, { content: { test: 456 }, metadata: { owners: [owner] } })
    // we can't load document from id since nodes are not connected
    // so we won't find the genesis object from it's CID
    const doctype2 = await ceramic2.createDocument(DOCTYPE_3ID, { content: { test: 456 }, metadata: { owners: [owner] } },{ applyOnly: true })
    expect(doctype1.content).toEqual(doctype2.content)
    expect(doctype2.state).toEqual(expect.objectContaining({ content: { test: 456 } }))
    await ceramic1.close()
    await ceramic2.close()
  })

  it('can propagate update across nodes with common connection', async () => {
    // ipfs1 <-> ipfs2 <-> ipfs3
    // ipfs1 <!-> ipfs3
    await ipfs1.swarm.connect(multaddr2)
    await ipfs2.swarm.connect(multaddr3)

    const ceramic1 = await createCeramic(ipfs1)
    const ceramic2 = await createCeramic(ipfs2)
    const ceramic3 = await createCeramic(ipfs3)

    const owner = ceramic1.context.did.id
    // ceramic node 2 shouldn't need to have the document open in order to forward the message
    const doctype1 = await ceramic1.createDocument(DOCTYPE_3ID, { content: { test: 789 }, metadata: { owners: [owner] } }, { applyOnly: true })
    const doctype3 = await ceramic3.createDocument(DOCTYPE_3ID, { content: { test: 789 }, metadata: { owners: [owner] } }, { applyOnly: true })
    expect(doctype3.content).toEqual(doctype1.content)
    expectEqualStates(doctype3.state, doctype1.state)
    await ceramic1.close()
    await ceramic2.close()
    await ceramic3.close()
  })

  it('can propagate multiple update across nodes with common connection', async () => {
    // ipfs1 <-> ipfs2 <-> ipfs3
    // ipfs1 <!-> ipfs3
    await ipfs1.swarm.connect(multaddr2)
    await ipfs2.swarm.connect(multaddr3)

    const ceramic1 = await Ceramic.create(ipfs1, {
      stateStorePath: await tmp.tmpName()
    })

    const idw = await IdentityWallet.create({
      getPermission: async (): Promise<Array<string>> => [],
      seed,
      ceramic: ceramic1,
    })

    const ceramic2 = await Ceramic.create(ipfs2, {
      stateStorePath: await tmp.tmpName()
    })
    await ceramic2.setDIDProvider(idw.getDidProvider())

    const ceramic3 = await Ceramic.create(ipfs3, {
      stateStorePath: await tmp.tmpName()
    })
    await ceramic3.setDIDProvider(idw.getDidProvider())

    //const owner = ceramic1.context.did.id
    const owner = idw._threeIdx.managementDID

    // ceramic node 2 shouldn't need to have the document open in order to forward the message
    const doctype1 = await ceramic1.createDocument<ThreeIdDoctype>(DOCTYPE_3ID, { content: { test: 321 }, metadata: { owners: [owner] } })
    const doctype3 = await ceramic3.createDocument<ThreeIdDoctype>(DOCTYPE_3ID, { content: { test: 321 }, metadata: { owners: [owner] } }, { applyOnly: true })

    expect(doctype3.content).toEqual(doctype1.content)
    expectEqualStates(doctype3.state, doctype1.state)

    const updatePromise = new Promise(resolve => {
      let c = 0 // wait for two updates
      // the change update and the anchor update
      doctype3.on('change', () => {
        if (++c > 1) {
          resolve()
        }
      })
    })

    await doctype1.change({ content: { test: 'abcde' }, metadata: { owners: [owner]} })
    await updatePromise
    expect(doctype1.content).toEqual({ test: 'abcde' })
    expect(doctype3.content).toEqual(doctype1.content)
    expectEqualStates(doctype3.state, doctype1.state)
    await ceramic1.close()
    await ceramic2.close()
    await ceramic3.close()
  })
})
