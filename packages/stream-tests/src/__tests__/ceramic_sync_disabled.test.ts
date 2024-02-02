import { jest } from '@jest/globals'
import { Ceramic } from '@ceramicnetwork/core'
import { CeramicClient } from '@ceramicnetwork/http-client'
import * as tmp from 'tmp-promise'
import { CeramicDaemon, DaemonConfig, makeDID } from '@ceramicnetwork/cli'
import { IpfsApi, StreamUtils, SyncOptions } from '@ceramicnetwork/common'
import { CommonTestUtils as TestUtils } from '@ceramicnetwork/common-test-utils'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import getPort from 'get-port'
import { createIPFS, swarmConnect } from '@ceramicnetwork/ipfs-daemon'

const seed = 'SEED'
const TOPIC = '/ceramic'

const makeCeramicCore = async (
  ipfs: IpfsApi,
  stateStoreDirectory: string,
  disablePeerDataSync: boolean
): Promise<Ceramic> => {
  const core = await Ceramic.create(ipfs, {
    pubsubTopic: TOPIC,
    stateStoreDirectory,
    anchorOnRequest: false,
    indexing: {
      disableComposedb: true,
    },
    disablePeerDataSync,
  })

  return core
}

// should pass on v4 when updated from TileDocument
const describeIfV3 = process.env.CERAMIC_RECON_MODE ? describe.skip : describe

describeIfV3('Cross node syncing disabled', () => {
  jest.setTimeout(20000)

  let ipfs1: IpfsApi
  let ipfs2: IpfsApi
  let tmpFolder1: tmp.DirectoryResult
  let tmpFolder2: tmp.DirectoryResult
  let disconnectedCore: Ceramic
  let connectedCore: Ceramic
  let daemon1: CeramicDaemon
  let daemon2: CeramicDaemon
  let disconnectedCeramic: CeramicClient
  let connectedCeramic: CeramicClient

  beforeAll(async () => {
    tmpFolder1 = await tmp.dir({ unsafeCleanup: true })
    tmpFolder2 = await tmp.dir({ unsafeCleanup: true })
    ipfs1 = await createIPFS()
    ipfs2 = await createIPFS()

    // Make sure the nodes have direct peer connection
    await swarmConnect(ipfs1, ipfs2)

    disconnectedCore = await makeCeramicCore(ipfs1, tmpFolder1.path, true)
    connectedCore = await makeCeramicCore(ipfs2, tmpFolder2.path, false)
    const port1 = await getPort()
    const port2 = await getPort()
    daemon1 = new CeramicDaemon(
      disconnectedCore,
      DaemonConfig.fromObject({
        'http-api': { port: port1 },
      })
    )
    await daemon1.listen()
    daemon2 = new CeramicDaemon(
      connectedCore,
      DaemonConfig.fromObject({
        'http-api': { port: port2 },
      })
    )
    await daemon2.listen()
    disconnectedCeramic = new CeramicClient('http://localhost:' + port1, { syncInterval: 500 })
    connectedCeramic = new CeramicClient('http://localhost:' + port2, { syncInterval: 500 })

    disconnectedCore.did = makeDID(disconnectedCore, seed)
    disconnectedCeramic.did = makeDID(disconnectedCeramic, seed)
    connectedCore.did = makeDID(connectedCore, seed)
    connectedCeramic.did = makeDID(connectedCeramic, seed)
  })

  afterAll(async () => {
    await Promise.all([disconnectedCeramic.close(), connectedCeramic.close()])
    await Promise.all([daemon1.close(), daemon2.close()])
    await Promise.all([disconnectedCore.close(), connectedCore.close()])

    await Promise.all([ipfs1.stop(), ipfs2.stop()])
    await Promise.all([tmpFolder1.cleanup(), tmpFolder2.cleanup()])
  })

  it('Stream created on one node fails to load on a node with peer data sync disabled', async () => {
    const initialContent = { test: 123 }
    const doc1 = await TileDocument.create(connectedCeramic, initialContent, null, {
      anchor: false,
    })

    await expect(TileDocument.load(disconnectedCeramic, doc1.id)).rejects.toThrow(
      /block was not found locally/
    )
  })

  it('Stream created and updated on node with peer data sync disabled still loads via other well connected nodes', async () => {
    const content0 = { step: 0 }
    const content1 = { step: 1 }
    const content2 = { step: 2 }
    const doc1 = await TileDocument.create(disconnectedCeramic, content0, null, {
      anchor: false,
    })
    await doc1.update(content1, null, { anchor: false })

    const doc2 = await TileDocument.load(connectedCeramic, doc1.id)
    expect(doc1.content).toEqual(doc2.content)

    // Update should also propagate from node with sync disabled to the other node without issue
    await doc1.update(content2, null, { anchor: false })

    await TestUtils.waitForState(
      doc2,
      5000,
      (state) => state.log.length == 3,
      (state) => {
        throw new Error(`Sync failed. State: ${StreamUtils.serializeState(state)}`)
      }
    )

    expect(doc1.content).toEqual(content2)
    expect(doc1.state.log.length).toEqual(3)

    expect(doc2.content).toEqual(content2)
    expect(doc2.state.log.length).toEqual(3)
  })

  it('Updates made on connected node not visible to node with peer data sync disabled', async () => {
    const initialContent = { step: 0 }
    const updatedContent = { step: 1 }
    const doc1 = await TileDocument.create(disconnectedCeramic, initialContent, null, {
      anchor: false,
    })

    const doc2 = await TileDocument.load(connectedCeramic, doc1.id)
    expect(doc1.content).toEqual(doc2.content)

    await doc2.update(updatedContent, null, { anchor: false })

    await doc1.sync({ sync: SyncOptions.SYNC_ALWAYS })

    expect(doc1.content).toEqual(initialContent)
    expect(doc1.state.log.length).toEqual(1)

    expect(doc2.content).toEqual(updatedContent)
    expect(doc2.state.log.length).toEqual(2)
  })
})
