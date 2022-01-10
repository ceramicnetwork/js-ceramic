import Ceramic from '@ceramicnetwork/core'
import CeramicClient from '@ceramicnetwork/http-client'
import * as tmp from 'tmp-promise'
import { CeramicDaemon } from '../ceramic-daemon'
import { IpfsApi, StreamState, SyncOptions } from '@ceramicnetwork/common'
import { TileDocumentHandler } from '@ceramicnetwork/stream-tile-handler'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import getPort from 'get-port'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { makeDID } from './make-did'
import { DaemonConfig } from '../daemon-config'

const seed = 'SEED'
const TOPIC = '/ceramic'

async function swarmConnect(a: IpfsApi, b: IpfsApi) {
  const addressB = (await b.id()).addresses[0].toString()
  await a.swarm.connect(addressB)
}

const makeCeramicCore = async (ipfs: IpfsApi, stateStoreDirectory: string): Promise<Ceramic> => {
  const core = await Ceramic.create(ipfs, {
    pubsubTopic: TOPIC,
    stateStoreDirectory,
    anchorOnRequest: false,
  })

  const handler = new TileDocumentHandler()
  handler.verifyJWS = (): Promise<void> => {
    return
  }
  // @ts-ignore
  core._streamHandlers.add(handler)
  return core
}

describe('Ceramic interop between multiple daemons and http clients', () => {
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

  beforeAll(async () => {
    tmpFolder1 = await tmp.dir({ unsafeCleanup: true })
    tmpFolder2 = await tmp.dir({ unsafeCleanup: true })
    ;[ipfs1, ipfs2] = await Promise.all([createIPFS(), createIPFS()])

    // Make sure the nodes can talk to each other
    await swarmConnect(ipfs1, ipfs2)
  })

  afterAll(async () => {
    await Promise.all([ipfs1.stop(), ipfs2.stop()])
    await Promise.all([tmpFolder1.cleanup(), tmpFolder2.cleanup()])
  })

  beforeEach(async () => {
    core1 = await makeCeramicCore(ipfs1, tmpFolder1.path)
    core2 = await makeCeramicCore(ipfs2, tmpFolder1.path)
    const port1 = await getPort()
    const port2 = await getPort()
    daemon1 = new CeramicDaemon(core1, DaemonConfig.fromObject({ 'http-api': { port: port1 } }))
    await daemon1.listen()
    daemon2 = new CeramicDaemon(core2, DaemonConfig.fromObject({ 'http-api': { port: port2 } }))
    await daemon2.listen()
    client1 = new CeramicClient('http://localhost:' + port1, { syncInterval: 500 })
    client2 = new CeramicClient('http://localhost:' + port2, { syncInterval: 500 })

    await core1.setDID(makeDID(core1, seed))
    await client1.setDID(makeDID(client1, seed))
    await core2.setDID(makeDID(core2, seed))
    await client2.setDID(makeDID(client2, seed))
  })

  afterEach(async () => {
    await Promise.all([client1.close(), client2.close()])
    await Promise.all([daemon1.close(), daemon2.close()])
    await Promise.all([core1.close(), core2.close()])
  })

  it("doesn't sync if syncTimeoutSeconds:0", async () => {
    const initialContent = { test: 123 }
    const updatedContent = { test: 456 }
    // Create a document with updates on the first node so that the updates aren't visible
    // on node 2 and 3 without querying pubsub
    const doc1 = await TileDocument.create(core1, initialContent, null, { anchor: false })
    await doc1.update(updatedContent)

    // Loading the doc without syncing the tip should only load the initial genesis contents
    const doc2 = await TileDocument.load(client2, doc1.id, { syncTimeoutSeconds: 0 })
    expect(doc2.content).toEqual(initialContent)

    // Now query daemon2 again and ensure that the update is successfully loaded
    await doc2.sync({ sync: SyncOptions.SYNC_ALWAYS })
    expect(doc2.content).toEqual(updatedContent)
  })

  it('does sync by default', async () => {
    const initialContent = { test: 123 }
    const updatedContent = { test: 456 }
    // Create a document with updates on the first node so that the updates aren't visible
    // on node 2 and 3 without querying pubsub
    const doc1 = await TileDocument.create(core1, initialContent, null, { anchor: false })
    await doc1.update(updatedContent)

    // Loading the doc with default sync behavior should get current contents
    const doc2 = await TileDocument.load(client2, doc1.id)
    expect(doc2.content).toEqual(updatedContent)
  })

  it('unpin publishes tip', async () => {
    const initialContent = { test: 123 }
    const updatedContent = { test: 456 }

    // Create a stream, pin and load it against both nodes via the http client.
    const doc1 = await TileDocument.create(client1, initialContent, null, { anchor: false })
    const doc2 = await TileDocument.load(client2, doc1.id)
    await client1.pin.add(doc1.id)
    await client2.pin.add(doc2.id)

    // Do an update on node 1, but don't publish it so node 2 still doesn't know about it.
    await doc1.update(updatedContent, null, { publish: false, anchor: false })

    // node 2 still doesn't know about it
    await doc2.sync({ sync: SyncOptions.PREFER_CACHE })
    expect(doc2.content).toEqual(initialContent)
    expect(doc1.content).toEqual(updatedContent)

    // Unpin from node 1 and publish tip at the same time
    await client1.pin.rm(doc1.id, { publish: true })

    // wait for doc2 to learn about the new state
    const receivedUpdatePromise = new Promise((resolve) => {
      doc2.subscribe((state) => {
        if (state.log.length > 1) {
          resolve(state)
        }
      })
    })
    const stateUpdate = await receivedUpdatePromise
    expect((stateUpdate as StreamState).next.content).toEqual(updatedContent)

    await doc2.sync({ sync: SyncOptions.PREFER_CACHE })
    expect(doc2.content).toEqual(updatedContent)
  })
})
