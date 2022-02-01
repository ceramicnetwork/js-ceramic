import { jest } from '@jest/globals'
import { Ceramic } from '@ceramicnetwork/core'
import { CeramicClient } from '@ceramicnetwork/http-client'
import tmp from 'tmp-promise'
import { CeramicDaemon } from '../ceramic-daemon.js'
import { AnchorStatus, fetchJson, Stream, StreamUtils, IpfsApi } from '@ceramicnetwork/common'
import { TileDocumentHandler } from '@ceramicnetwork/stream-tile-handler'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { firstValueFrom } from 'rxjs'
import { filter } from 'rxjs/operators'

import { CommitID, StreamID } from '@ceramicnetwork/streamid'
import getPort from 'get-port'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { makeDID } from './make-did.js'
import { DaemonConfig } from '../daemon-config.js'

const seed = 'SEED'
const TOPIC = '/ceramic'

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

/**
 * Generates string of particular size in bytes
 * @param size - Size in bytes
 */
const generateStringOfSize = (size): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz'.split('')
  const len = chars.length
  const random_data = []

  while (size--) {
    random_data.push(chars[(Math.random() * len) | 0])
  }
  return random_data.join('')
}

describe('Ceramic interop: core <> http-client', () => {
  jest.setTimeout(30000)
  let ipfs: IpfsApi
  let tmpFolder: any
  let core: Ceramic
  let daemon: CeramicDaemon
  let client: CeramicClient

  beforeAll(async () => {
    tmpFolder = await tmp.dir({ unsafeCleanup: true })
    ipfs = await createIPFS()
  })

  afterAll(async () => {
    await ipfs.stop()
    await tmpFolder.cleanup()
  })

  beforeEach(async () => {
    core = await makeCeramicCore(ipfs, tmpFolder.path)
    const port = await getPort()
    const apiUrl = 'http://localhost:' + port
    daemon = new CeramicDaemon(core, DaemonConfig.fromObject({ 'http-api': { port } }))
    await daemon.listen()
    client = new CeramicClient(apiUrl, { syncInterval: 500 })

    await core.setDID(makeDID(core, seed))
    await client.setDID(makeDID(client, seed))
  })

  afterEach(async () => {
    await client.close()
    await daemon.close()
    await core.close()
  })

  describe('pin api', () => {
    let docA, docB

    beforeEach(async () => {
      docB = await TileDocument.create(core, { foo: 'bar' }, null, { pin: false })
      docA = await TileDocument.create(core, { foo: 'baz' }, null, { pin: false })
    })

    const pinLs = async (streamId?: StreamID): Promise<Array<any>> => {
      const pinnedDocsIterator = await client.pin.ls(streamId)
      const docs = []
      for await (const doc of pinnedDocsIterator) {
        docs.push(doc)
      }
      return docs
    }

    it('pin API CRUD test', async () => {
      // Make sure no docs are pinned to start
      let pinnedDocs = await pinLs()
      expect(pinnedDocs).toHaveLength(0)

      // Pin docA
      await client.pin.add(docA.id)

      // Make sure docA shows up in list of all pinned docs
      pinnedDocs = await pinLs()
      expect(pinnedDocs).toEqual([docA.id.toString()])

      // Make sure docA shows as pinned when checking for its specific streamId
      pinnedDocs = await pinLs(docA.id)
      expect(pinnedDocs).toEqual([docA.id.toString()])

      // Make sure docB doesn't show up as pinned when checking for its streamId
      pinnedDocs = await pinLs(docB.id)
      expect(pinnedDocs).toHaveLength(0)

      // Now pin docB as well, and make sure 'ls' works as expected in all cases
      await client.pin.add(docB.id)

      pinnedDocs = await pinLs()
      expect(pinnedDocs).toHaveLength(2)
      expect(pinnedDocs).toContain(docA.id.toString())
      expect(pinnedDocs).toContain(docB.id.toString())

      pinnedDocs = await pinLs(docA.id)
      expect(pinnedDocs).toEqual([docA.id.toString()])

      pinnedDocs = await pinLs(docB.id)
      expect(pinnedDocs).toEqual([docB.id.toString()])

      // Now unpin docA
      await client.pin.rm(docA.id)

      pinnedDocs = await pinLs()
      expect(pinnedDocs).toEqual([docB.id.toString()])

      // Make sure docB still shows as pinned when checking for its specific streamId
      pinnedDocs = await pinLs(docB.id)
      expect(pinnedDocs).toEqual([docB.id.toString()])

      // Make sure docA no longer shows up as pinned when checking for its streamId
      pinnedDocs = await pinLs(docA.id)
      expect(pinnedDocs).toHaveLength(0)
    })

    it('force pin', async () => {
      const pinSpy = jest.spyOn(ipfs.pin, 'add')
      await client.pin.add(docA.id)

      // 2 CIDs pinned for the one genesis commit (signed envelope + payload)
      expect(pinSpy).toBeCalledTimes(2)

      // Pin a second time, shouldn't cause any more calls to ipfs.pin.add
      await client.pin.add(docA.id)
      expect(pinSpy).toBeCalledTimes(2)

      // Now force re-pin and make sure underlying state and ipfs records get re-pinned
      await client.pin.add(docA.id, true)
      expect(pinSpy).toBeCalledTimes(4)
    })
  })
})
