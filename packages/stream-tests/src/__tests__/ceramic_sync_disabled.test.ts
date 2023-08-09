import { jest } from '@jest/globals'
import { Ceramic } from '@ceramicnetwork/core'
import { CeramicClient } from '@ceramicnetwork/http-client'
import * as tmp from 'tmp-promise'
import { CeramicDaemon, DaemonConfig, makeDID } from '@ceramicnetwork/cli'
import { IpfsApi } from '@ceramicnetwork/common'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import getPort from 'get-port'
import { createIPFS, swarmConnect } from '@ceramicnetwork/ipfs-daemon'
import type { DID } from 'dids'

const seed = 'SEED'
const TOPIC = '/ceramic'

const makeCeramicCore = async (ipfs: IpfsApi, stateStoreDirectory: string): Promise<Ceramic> => {
  const core = await Ceramic.create(ipfs, {
    pubsubTopic: TOPIC,
    stateStoreDirectory,
    anchorOnRequest: false,
    indexing: {
      disableComposedb: true,
    },
    disablePeerDataSync: true,
  })

  return core
}

describe('Cross node syncing disabled', () => {
  jest.setTimeout(20000)

  let ipfs1: IpfsApi
  let ipfs2: IpfsApi
  let tmpFolder1: tmp.DirectoryResult
  let tmpFolder2: tmp.DirectoryResult
  let core1: Ceramic
  let core2: Ceramic
  let daemon1: CeramicDaemon
  let daemon2: CeramicDaemon
  let client1: CeramicClient
  let client2: CeramicClient
  let client1Admin: CeramicClient
  let client2Admin: CeramicClient
  let adminDID: DID

  beforeAll(async () => {
    tmpFolder1 = await tmp.dir({ unsafeCleanup: true })
    tmpFolder2 = await tmp.dir({ unsafeCleanup: true })
    ipfs1 = await createIPFS()
    ipfs2 = await createIPFS()

    // Make sure the nodes have direct peer connection
    await swarmConnect(ipfs1, ipfs2)
  })

  afterAll(async () => {
    await Promise.all([ipfs1.stop(), ipfs2.stop()])
    await Promise.all([tmpFolder1.cleanup(), tmpFolder2.cleanup()])
  })

  beforeEach(async () => {
    core1 = await makeCeramicCore(ipfs1, tmpFolder1.path)
    core2 = await makeCeramicCore(ipfs2, tmpFolder2.path)
    adminDID = makeDID(core1, seed)
    await adminDID.authenticate()
    const port1 = await getPort()
    const port2 = await getPort()
    daemon1 = new CeramicDaemon(
      core1,
      DaemonConfig.fromObject({
        'http-api': { port: port1, 'admin-dids': [adminDID.id.toString()] },
      })
    )
    await daemon1.listen()
    daemon2 = new CeramicDaemon(
      core2,
      DaemonConfig.fromObject({
        'http-api': { port: port2, 'admin-dids': [adminDID.id.toString()] },
      })
    )
    await daemon2.listen()
    client1 = new CeramicClient('http://localhost:' + port1, { syncInterval: 500 })
    client2 = new CeramicClient('http://localhost:' + port2, { syncInterval: 500 })
    client1Admin = new CeramicClient('http://localhost:' + port1, { syncInterval: 500 })
    client2Admin = new CeramicClient('http://localhost:' + port2, { syncInterval: 500 })

    await core1.setDID(makeDID(core1, seed))
    await client1.setDID(makeDID(client1, seed))
    await core2.setDID(makeDID(core2, seed))
    await client2.setDID(makeDID(client2, seed))
    await client1Admin.setDID(adminDID)
    await client2Admin.setDID(adminDID)
  })

  afterEach(async () => {
    await Promise.all([client1.close(), client2.close()])
    await Promise.all([daemon1.close(), daemon2.close()])
    await Promise.all([core1.close(), core2.close()])
  })

  it('Loading a stream created on one node fails on the other', async () => {
    const initialContent = { test: 123 }
    const doc1 = await TileDocument.create(core1, initialContent, null, { anchor: false })

    // Loading the doc without syncing the tip should only load the initial genesis contents
    await expect(TileDocument.load(client2, doc1.id)).rejects.toThrow(/block was not found locally/)
  })
})
