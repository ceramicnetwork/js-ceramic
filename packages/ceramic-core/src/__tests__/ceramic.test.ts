import Ceramic from '../ceramic'
import IdentityWallet from 'identity-wallet'
import tmp from 'tmp-promise'
import Ipfs from 'ipfs'
import { ThreeIdDoctype } from "@ceramicnetwork/ceramic-doctype-three-id"
import { AnchorStatus } from "@ceramicnetwork/ceramic-common"

jest.mock('../store/level-state-store')

const seed = '0x5872d6e0ae7347b72c9216db218ebbb9d9d0ae7ab818ead3557e8e78bf944184'
const genIpfsConf = (path: string, id: number): any => {
  return {
    repo: `${path}/ipfs${id}/`,
    config: {
      Addresses: { Swarm: [ `/ip4/127.0.0.1/tcp/${4004 + id}` ] },
      Bootstrap: []
    },
  }
}

const createCeramic = async (ipfs: Ipfs): Promise<Ceramic> => {
  const ceramic = await Ceramic.create(ipfs, {
    stateStorePath: await tmp.tmpName()
  })

  await IdentityWallet.create({
    getPermission: async (): Promise<Array<string>> => [],
    seed,
    ceramic,
    useThreeIdProv: true,
  })

  return ceramic
}

describe('Ceramic integration', () => {
  jest.setTimeout(20000)
  let ipfs1: Ipfs;
  let ipfs2: Ipfs;
  let ipfs3: Ipfs;
  let multaddr1: string;
  let multaddr2: string;
  let multaddr3: string;
  let tmpFolder: any;

  const DOCTYPE_TILE = 'tile'
  const DOCTYPE_3ID = '3id'

  beforeAll(async () => {
    tmpFolder = await tmp.dir({ unsafeCleanup: true })
    ipfs1 = await Ipfs.create(genIpfsConf(tmpFolder.path, 0))
    ipfs2 = await Ipfs.create(genIpfsConf(tmpFolder.path, 1))
    ipfs3 = await Ipfs.create(genIpfsConf(tmpFolder.path, 2))
    multaddr1 = (await ipfs1.id()).addresses[0].toString()
    multaddr2 = (await ipfs2.id()).addresses[0].toString()
    multaddr3 = (await ipfs3.id()).addresses[0].toString()
  })

  afterAll(async () => {
    await ipfs1.stop()
    await ipfs2.stop()
    await ipfs3.stop()
    await tmpFolder.cleanup()
  })

  it('can propagate update across two connected nodes', async () => {
    await ipfs2.swarm.connect(multaddr1)

    const ceramic1 = await createCeramic(ipfs1)
    const ceramic2 = await createCeramic(ipfs2)
    const doctype1 = await ceramic1.createDocument(DOCTYPE_TILE, { content: { test: 123 } }, { applyOnly: true })
    const doctype2 = await ceramic2.loadDocument(doctype1.id)
    expect(doctype1.content).toEqual(doctype2.content)
    expect(doctype1.state).toEqual(doctype2.state)
    await ceramic1.close()
    await ceramic2.close()

    await ipfs2.swarm.disconnect(multaddr1)
  })

  it('won\'t propagate update across two disconnected nodes', async () => {
    const ceramic1 = await createCeramic(ipfs1)
    const ceramic2 = await createCeramic(ipfs2)

    const owner = ceramic1.context.user.id

    const doctype1 = await ceramic1.createDocument(DOCTYPE_3ID, { content: { test: 456 }, metadata: { owners: [owner] } })
    // we can't load document from id since nodes are not connected
    // so we won't find the genesis object from it's CID
    const doctype2 = await ceramic2.createDocument(DOCTYPE_3ID, { content: { test: 456 }, metadata: { owners: [owner] } },{ applyOnly: true })
    expect(doctype1.content).toEqual(doctype2.content)
    expect(doctype2.state).toEqual(expect.objectContaining({ anchorStatus: 0, content: { test: 456 } }))
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

    const owner = ceramic1.context.user.id
    // ceramic node 2 shouldn't need to have the document open in order to forward the message
    const doctype1 = await ceramic1.createDocument(DOCTYPE_3ID, { content: { test: 789 }, metadata: { owners: [owner] } }, { applyOnly: true })
    const doctype3 = await ceramic3.createDocument(DOCTYPE_3ID, { content: { test: 789 }, metadata: { owners: [owner] } }, { applyOnly: true })
    expect(doctype3.content).toEqual(doctype1.content)
    expect(doctype3.state).toEqual(doctype1.state)
    await ceramic1.close()
    await ceramic2.close()
    await ceramic3.close()

    await ipfs1.swarm.disconnect(multaddr2)
    await ipfs2.swarm.disconnect(multaddr3)
  })

  it('can propagate multiple update across nodes with common connection', async () => {
    // ipfs1 <-> ipfs2 <-> ipfs3
    // ipfs1 <!-> ipfs3
    await ipfs1.swarm.connect(multaddr2)
    await ipfs2.swarm.connect(multaddr3)
    const ceramic1 = await createCeramic(ipfs1)
    const ceramic2 = await createCeramic(ipfs2)
    const ceramic3 = await createCeramic(ipfs3)

    const owner = ceramic1.context.user.id

    // ceramic node 2 shouldn't need to have the document open in order to forward the message
    const doctype1 = await ceramic1.createDocument<ThreeIdDoctype>(DOCTYPE_3ID, { content: { test: 321 }, metadata: { owners: [owner] } })
    while (doctype1.state.anchorStatus !== AnchorStatus.ANCHORED) {
      // wait to propagate
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    const doctype3 = await ceramic3.createDocument<ThreeIdDoctype>(DOCTYPE_3ID, { content: { test: 321 }, metadata: { owners: [owner] } }, { applyOnly: true })
    expect(doctype3.content).toEqual(doctype1.content)
    expect(doctype3.state).toEqual(doctype1.state)

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
    expect(doctype3.state).toEqual(doctype1.state)
    await ceramic1.close()
    await ceramic2.close()
    await ceramic3.close()

    await ipfs1.swarm.disconnect(multaddr2)
    await ipfs2.swarm.disconnect(multaddr3)
  })
})
