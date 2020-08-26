import Ceramic from '@ceramicnetwork/ceramic-core'
import CeramicClient from '@ceramicnetwork/ceramic-http-client'
import IdentityWallet from 'identity-wallet'
import tmp from 'tmp-promise'
import Ipfs from 'ipfs'
import CeramicDaemon from '../ceramic-daemon'
import { AnchorStatus } from "@ceramicnetwork/ceramic-common"
import { TileDoctypeHandler } from "@ceramicnetwork/ceramic-doctype-tile"
import { EventEmitter } from "events"

jest.mock('@ceramicnetwork/ceramic-core/lib/store/level-state-store')

const seed = '0x5872d6e0ae7347b72c9216db218ebbb9d9d0ae7ab818ead3557e8e78bf944184'
const genIpfsConf = (path: string, id: number): any => {
  return {
    repo: `${path}/ipfs${id}/`,
    config: {
      Addresses: { Swarm: [] },
      Discovery: {
        MDNS: { Enabled: false },
        webRTCStar: { Enabled: false }
      },
      Bootstrap: []
    },
  }
}
const anchorUpdate = (doc: EventEmitter): Promise<void> => new Promise(resolve => doc.on('change', resolve))
const port = 7777
const apiUrl = 'http://localhost:' + port

describe('Ceramic interop: core <> http-client', () => {
  jest.setTimeout(7000)
  let ipfs: Ipfs
  let tmpFolder: any
  let core: Ceramic
  let daemon: CeramicDaemon
  let client: CeramicClient

  const DOCTYPE_TILE = 'tile'

  beforeAll(async () => {
    tmpFolder = await tmp.dir({ unsafeCleanup: true })
    ipfs = await Ipfs.create(genIpfsConf(tmpFolder.path, 0))
  })

  afterAll(async () => {
    await ipfs.stop()
    await tmpFolder.cleanup()
  })

  beforeEach(async () => {
    core = await Ceramic.create(ipfs)

    const doctypeHandler = new TileDoctypeHandler()
    doctypeHandler.verifyJWS = (): Promise<void> => { return }
    core._doctypeHandlers['tile'] = doctypeHandler

    daemon = new CeramicDaemon(core, { port })
    client = new CeramicClient(apiUrl)

    const identityWallet = await IdentityWallet.create({
      getPermission: async (): Promise<Array<string>> => [], seed, ceramic: core, useThreeIdProv: true,
    })

    await client.setDIDProvider(identityWallet.get3idProvider())
  })

  afterEach(async () => {
    await client.close()
    await daemon.close()
    await core.close()
  })

  it('properly creates document', async () => {
    const doc1 = await core.createDocument(DOCTYPE_TILE, { content: { test: 123 } }, { applyOnly: true, skipWait: true })
    const doc2 = await client.createDocument(DOCTYPE_TILE, { content: { test: 123 } }, { applyOnly: true, skipWait: true })
    expect(doc1.content).toEqual(doc2.content)

    const state1 = doc1.state
    const state2 = doc2.state

    // TODO fix: logs are different because of the kid version (0 != anchored CID)
    delete state1.log
    delete state2.log

    expect(state1).toEqual(state2)
  })

  it('gets anchor record updates', async () => {
    const doc1 = await client.createDocument(DOCTYPE_TILE, { content: { test: 123 } })
    await anchorUpdate(doc1)
    expect(doc1.state.log.length).toEqual(2)
    expect(doc1.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    const doc2 = await client.createDocument(DOCTYPE_TILE, { content : { test: 1234 } })
    await anchorUpdate(doc2)
    expect(doc2.state.log.length).toEqual(2)
    expect(doc2.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
  })

  it('loads documents correctly', async () => {
    const doc1 = await core.createDocument(DOCTYPE_TILE, { content: { test: 123 } })
    await anchorUpdate(doc1)
    const doc2 = await client.loadDocument(doc1.id)
    expect(doc1.content).toEqual(doc2.content)
    expect(doc1.state).toEqual(doc2.state)

    const doc3 = await client.createDocument(DOCTYPE_TILE, { content: { test: 456 } })
    await anchorUpdate(doc3)
    const doc4 = await core.loadDocument(doc3.id)
    expect(doc3.content).toEqual(doc4.content)
    expect(doc3.state).toEqual(doc4.state)
  })

  it('makes and gets updates correctly', async () => {
    const doc1 = await core.createDocument(DOCTYPE_TILE, { content: { test: 123 } })
    await anchorUpdate(doc1)
    const doc2 = await client.loadDocument(doc1.id)
    // change from core viewable in client
    await doc1.change({ content: {test: 123, abc: 987} })
    await anchorUpdate(doc1)
    await anchorUpdate(doc2)
    expect(doc1.content).toEqual(doc2.content)
    expect(doc1.state).toEqual(doc2.state)
    // change from client viewable in core

    await doc2.change({ content: {test: 456, abc: 654} })

    await anchorUpdate(doc2)
    expect(doc1.content).toEqual(doc2.content)
    expect(doc1.state).toEqual(doc2.state)
  })
})
