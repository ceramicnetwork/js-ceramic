import Ceramic from '../ceramic'
import IdentityWallet from 'identity-wallet'
import tmp from 'tmp-promise'
import Ipfs from 'ipfs'

const seed = '0x5872d6e0ae7347b72c9216db218ebbb9d9d0ae7ab818ead3557e8e78bf944184'
const genIpfsConf = (path, id): any => {
  return {
    repo: `${path}/ipfs${id}/`,
    config: {
      Addresses: { Swarm: [ `/ip4/127.0.0.1/tcp/${4004 + id}` ] },
      //Discovery: {
        //MDNS: { Enabled: false },
        //webRTCStar: { Enabled: false }
      //},
      Bootstrap: []
    },
  }
}

describe('Ceramic integration', () => {
  jest.setTimeout(7000)
  let ipfs1, ipfs2, ipfs3, multaddr1, multaddr2, multaddr3
  let tmpFolder, idWallet

  const DOCTYPE_TILE = 'tile'
  const DOCTYPE_3ID = '3id'

  beforeAll(async () => {
    idWallet = new IdentityWallet(() => true, { seed })
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
    tmpFolder.cleanup()
  })

  it('can propagate update across two connected nodes', async () => {
    await ipfs2.swarm.connect(multaddr1)
    const ceramic1 = await Ceramic.create(ipfs1)
    await ceramic1.setDIDProvider(idWallet.get3idProvider())
    const ceramic2 = await Ceramic.create(ipfs2)
    const doc1 = await ceramic1.createDocument({ test: 123 }, DOCTYPE_TILE)
    const doc2 = await ceramic2.loadDocument(doc1.id)
    expect(doc1.content).toEqual(doc2.content)
    expect(doc1.state).toEqual(doc2.state)
    await ceramic1.close()
    await ceramic2.close()
  })

  it('won\'t propagate update across two disconnected nodes', async () => {
    await ipfs2.swarm.disconnect(multaddr1)
    await ipfs2.swarm.disconnect(multaddr3)
    const ceramic1 = await Ceramic.create(ipfs1)
    await ceramic1.setDIDProvider(idWallet.get3idProvider())
    const owner = ceramic1.user.publicKeys.managementKey
    const ceramic2 = await Ceramic.create(ipfs2)
    const doc1 = await ceramic1.createDocument({ test: 456 }, DOCTYPE_3ID, { owners: [owner] })
    // we can't load document from id since nodes are not connected
    // so we won't find the genesis object from it's CID
    const doc2 = await ceramic2.createDocument({ test: 456 }, DOCTYPE_3ID, { onlyGenesis: true, owners: [owner] })
    expect(doc1.content).toEqual(doc2.content)
    expect(doc2.state).toEqual(expect.objectContaining({ anchorStatus: 0, content: { test: 456 } }))
    await ceramic1.close()
    await ceramic2.close()
  })

  it('can propagate update across nodes with common connection', async () => {
    // ipfs1 <-> ipfs2 <-> ipfs3
    // ipfs1 <!-> ipfs3
    await ipfs1.swarm.connect(multaddr2)
    await ipfs2.swarm.connect(multaddr3)
    await ipfs1.swarm.disconnect(multaddr3)
    const ceramic1 = await Ceramic.create(ipfs1)
    await ceramic1.setDIDProvider(idWallet.get3idProvider())
    const owner = ceramic1.user.publicKeys.managementKey
    const ceramic2 = await Ceramic.create(ipfs2)
    const ceramic3 = await Ceramic.create(ipfs3)
    // ceramic node 2 shouldn't need to have the document open in order to forward the message
    const doc1 = await ceramic1.createDocument({ test: 789 }, DOCTYPE_3ID, { owners: [owner] })
    const doc3 = await ceramic3.createDocument({ test: 789 }, DOCTYPE_3ID, { onlyGenesis: true, owners: [owner] })
    expect(doc3.content).toEqual(doc1.content)
    expect(doc3.state).toEqual(doc1.state)
    await ceramic1.close()
    await ceramic2.close()
    await ceramic3.close()
  })

  it('can propagate multiple update across nodes with common connection', async () => {
    // ipfs1 <-> ipfs2 <-> ipfs3
    // ipfs1 <!-> ipfs3
    await ipfs1.swarm.connect(multaddr2)
    await ipfs2.swarm.connect(multaddr3)
    await ipfs1.swarm.disconnect(multaddr3)
    const ceramic1 = await Ceramic.create(ipfs1)
    await ceramic1.setDIDProvider(idWallet.get3idProvider())
    const owner = ceramic1.user.publicKeys.managementKey
    const ceramic2 = await Ceramic.create(ipfs2)
    const ceramic3 = await Ceramic.create(ipfs3)
    // ceramic node 2 shouldn't need to have the document open in order to forward the message
    const doc1 = await ceramic1.createDocument({ test: 321 }, DOCTYPE_3ID, { owners: [owner] })
    const doc3 = await ceramic3.createDocument({ test: 321 }, DOCTYPE_3ID, { onlyGenesis: true, owners: [owner] })
    expect(doc3.content).toEqual(doc1.content)
    expect(doc3.state).toEqual(doc1.state)
    const updatePromise = new Promise(resolve => {
      let c = 0 // wait for two updates
      // the change update and the anchor update
      doc3.on('change', () => {
        if (++c > 1) resolve()
      })
    })
    await doc1.change({ test: 'abcde' })
    await updatePromise
    expect(doc1.content).toEqual({ test: 'abcde' })
    expect(doc3.content).toEqual(doc1.content)
    expect(doc3.state).toEqual(doc1.state)
    await ceramic1.close()
    await ceramic2.close()
    await ceramic3.close()
  })
})
