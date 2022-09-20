import { jest } from '@jest/globals'
import { Ceramic } from '@ceramicnetwork/core'
import { CeramicClient } from '@ceramicnetwork/http-client'
import tmp from 'tmp-promise'
import { CeramicDaemon } from '../ceramic-daemon.js'
import {
  AnchorStatus,
  fetchJson,
  Stream,
  StreamUtils,
  IpfsApi,
  TimedAbortSignal,
  GenesisCommit,
  TestUtils,
} from '@ceramicnetwork/common'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { firstValueFrom } from 'rxjs'
import { filter } from 'rxjs/operators'
import { randomString } from '@stablelib/random'
import { CommitID, StreamID } from '@ceramicnetwork/streamid'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { makeDID } from './make-did.js'
import fetch from 'cross-fetch'
import { makeCeramicCore } from './make-ceramic-core.js'
import { makeCeramicDaemon } from './make-ceramic-daemon.js'

const seed = 'SEED'

describe('Ceramic interop: core <> http-client', () => {
  jest.setTimeout(30000)
  let ipfs: IpfsApi
  let tmpFolder: tmp.DirectoryResult
  let core: Ceramic
  let daemon: CeramicDaemon
  let client: CeramicClient

  beforeAll(async () => {
    ipfs = await createIPFS()
  })

  afterAll(async () => {
    await ipfs.stop()
  })

  beforeEach(async () => {
    tmpFolder = await tmp.dir({ unsafeCleanup: true })
    core = await makeCeramicCore(ipfs, tmpFolder.path)
    daemon = await makeCeramicDaemon(core)
    const apiUrl = `http://localhost:${daemon.port}`
    client = new CeramicClient(apiUrl, { syncInterval: 500 })

    await core.setDID(makeDID(core, seed))
    await client.setDID(makeDID(client, seed))
  })

  afterEach(async () => {
    await client.close()
    await daemon.close()
    await core.close()
    await tmpFolder.cleanup()
  })

  /**
   * Registers a listener for change notifications on a document, instructs the anchor service to
   * perform an anchor, then waits for the change listener to resolve, indicating that the document
   * got anchored.
   * @param doc
   */
  const anchorDoc = async (doc: Stream): Promise<void> => {
    const changeHandle = firstValueFrom(
      doc.pipe(
        filter(
          (state) =>
            state.anchorStatus === AnchorStatus.ANCHORED ||
            state.anchorStatus === AnchorStatus.FAILED
        )
      )
    )
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await daemon.ceramic.context.anchorService.anchor()
    await changeHandle
  }

  it('healthcheck passes', async () => {
    const res = await fetch(`http://localhost:${daemon.port}/api/v0/node/healthcheck`)
    expect(res.ok).toBeTruthy()
    const text = await res.text()
    expect(text).toEqual('Alive!')
  })

  it('healthcheck fails if ipfs unreachable', async () => {
    const isOnlineSpy = jest.spyOn(ipfs, 'isOnline')
    isOnlineSpy.mockRejectedValue(new Error('ipfs is sad now') as never)
    const res = await fetch(`http://localhost:${daemon.port}/api/v0/node/healthcheck`)
    expect(res.ok).toBeFalsy()
    const text = await res.text()
    expect(text).toEqual('IPFS unreachable')
    isOnlineSpy.mockReset()
  })

  it('healthcheck can skip ipfs check', async () => {
    const isOnlineSpy = jest.spyOn(ipfs, 'isOnline')
    isOnlineSpy.mockRejectedValue(new Error('ipfs is sad now') as never)
    const res = await fetch(
      `http://localhost:${daemon.port}/api/v0/node/healthcheck?checkIpfs=false`
    )
    expect(res.ok).toBeTruthy()
    const text = await res.text()
    expect(text).toEqual('Alive!')
    isOnlineSpy.mockReset()
  })

  it('can store commit if the size is lesser than the maximum size ~256KB', async () => {
    const streamtype = await TileDocument.create(client, { test: randomString(200000) })
    expect(streamtype).not.toBeNull()
  })

  it('cannot store commit if the size is greater than the maximum size ~256KB', async () => {
    await expect(TileDocument.create(client, { test: randomString(300000) })).rejects.toThrow(
      /exceeds the maximum block size of/
    )
  })

  it('properly creates document', async () => {
    const doc1 = await TileDocument.create(core, { test: 123 }, null, {
      anchor: false,
      publish: false,
      syncTimeoutSeconds: 0,
    })
    const doc2 = await TileDocument.create(client, { test: 123 }, null, {
      anchor: false,
      publish: false,
      syncTimeoutSeconds: 0,
    })

    expect(doc1.content).toEqual(doc2.content)

    const state1 = doc1.state
    const state2 = doc2.state

    // TODO fix: logs are different because of the kid version (0 != anchored CID)
    delete state1.log
    delete state2.log
    delete state1.metadata.unique
    delete state2.metadata.unique

    expect(state1).toEqual(state2)
  })

  it('gets anchor commit updates', async () => {
    const doc1 = await TileDocument.create(core, { test: 123 })
    await anchorDoc(doc1)
    expect(doc1.state.log.length).toEqual(2)
    expect(doc1.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    const doc2 = await TileDocument.create(client, { test: 1234 })
    await anchorDoc(doc2)
    expect(doc2.state.log.length).toEqual(2)
    expect(doc2.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
  })

  it('loads documents correctly', async () => {
    const doc1 = await TileDocument.create(core, { test: 123 })
    await anchorDoc(doc1)
    const doc2 = await client.loadStream(doc1.id)
    expect(doc1.content).toEqual(doc2.content)
    expect(StreamUtils.serializeState(doc1.state)).toEqual(StreamUtils.serializeState(doc2.state))

    const doc3 = await TileDocument.create(client, { test: 456 })
    await anchorDoc(doc3)
    const doc4 = await core.loadStream(doc3.id)
    expect(doc3.content).toEqual(doc4.content)
    expect(StreamUtils.serializeState(doc3.state)).toEqual(StreamUtils.serializeState(doc4.state))
  })

  it('loads document commits correctly', async () => {
    const doc1 = await TileDocument.create(core, { test: 123 })
    await anchorDoc(doc1)
    const doc2 = await TileDocument.load(client, doc1.id)
    expect(doc1.content).toEqual(doc2.content)

    const commits1 = await core.loadStreamCommits(doc1.id)
    expect(commits1).toBeDefined()

    const commits2 = await client.loadStreamCommits(doc2.id)
    expect(commits2).toBeDefined()

    const serializeCommits = (commits: any): any =>
      commits.map((r: any) => {
        return {
          cid: r.cid,
          value: StreamUtils.serializeCommit(r.value),
        }
      })

    expect(serializeCommits(commits1)).toEqual(serializeCommits(commits2))
  })

  it('makes and gets updates correctly with subscription', async () => {
    const initialContent = { a: 'initial' }
    const middleContent = { ...initialContent, b: 'middle' }
    const finalContent = { ...middleContent, c: 'final' }

    const doc1 = await TileDocument.create(core, initialContent)
    await anchorDoc(doc1)
    const doc2 = await client.loadStream<TileDocument>(doc1.id)
    doc1.subscribe()
    doc2.subscribe()
    // change from core viewable in client
    await doc1.update(middleContent)
    await anchorDoc(doc1)
    await TestUtils.delay(1000) // 2x polling interval
    expect(doc1.content).toEqual(middleContent)
    expect(doc1.content).toEqual(doc2.content)
    expect(StreamUtils.serializeState(doc1.state)).toEqual(StreamUtils.serializeState(doc2.state))
    // change from client viewable in core

    await doc2.update(finalContent)
    await anchorDoc(doc2)
    await TestUtils.delay(1000) // 2x polling interval
    expect(doc1.content).toEqual(doc2.content)
    expect(doc1.content).toEqual(finalContent)
    expect(StreamUtils.serializeState(doc1.state)).toEqual(StreamUtils.serializeState(doc2.state))
  })

  it('makes and gets updates correctly with manual sync', async () => {
    const initialContent = { a: 'initial' }
    const middleContent = { ...initialContent, b: 'middle' }
    const finalContent = { ...middleContent, c: 'final' }

    const doc1 = await TileDocument.create(core, initialContent)
    await anchorDoc(doc1)
    const doc2 = await client.loadStream<TileDocument>(doc1.id)
    // change from core viewable in client
    await doc1.update(middleContent)
    await anchorDoc(doc1)
    await doc2.sync()
    await doc1.sync()
    expect(doc1.content).toEqual(middleContent)
    expect(doc1.content).toEqual(doc2.content)
    expect(StreamUtils.serializeState(doc1.state)).toEqual(StreamUtils.serializeState(doc2.state))
    // change from client viewable in core

    await doc2.update(finalContent)
    await anchorDoc(doc2)
    await doc2.sync()
    await doc1.sync()
    expect(doc1.content).toEqual(doc2.content)
    expect(doc1.content).toEqual(finalContent)
    expect(StreamUtils.serializeState(doc1.state)).toEqual(StreamUtils.serializeState(doc2.state))
  })

  it('Throw on rejected update', async () => {
    const contentOg = { test: 123 }
    const contentRejected = { test: 'rejected' }

    const streamOg = await TileDocument.create<any>(client, contentOg)

    // Create an anchor commit that the original stream handle won't know about
    const streamCopy = await TileDocument.load(core, streamOg.id)
    await anchorDoc(streamCopy)
    expect(streamCopy.state.log.length).toEqual(2)

    // Do an update via the stale stream handle.  Its view of the log is out of date so its update
    // should be rejected by conflict resolution
    expect(streamOg.state.log.length).toEqual(1)
    await expect(streamOg.update(contentRejected)).rejects.toThrow(
      /rejected by conflict resolution/
    )
    expect(streamOg.state.log.length).toEqual(1)

    await streamOg.sync()
    expect(streamOg.state.log.length).toEqual(2)
  })

  it('loads commits correctly', async () => {
    // Create multiple commits of the same document
    const content1 = { test: 123 }
    const content2 = { test: 456 }
    const content3 = { test: 789 }
    const doc = await TileDocument.create(core, content1)
    await anchorDoc(doc)
    expect(doc.state.log.length).toEqual(2)
    expect(doc.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    await doc.update(content2)
    await anchorDoc(doc)
    expect(doc.state.log.length).toEqual(4)
    expect(doc.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    await doc.update(content3)
    await anchorDoc(doc)
    expect(doc.state.log.length).toEqual(6)
    expect(doc.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

    // Load genesis commit
    const v0Id = new CommitID(doc.id.type, doc.id.cid)
    const docV0Core = await core.loadStream(v0Id)
    const docV0Client = await client.loadStream(v0Id)
    expect(docV0Core.content).toEqual(content1)
    expect(docV0Core.state.log.length).toEqual(1)
    expect(StreamUtils.serializeState(docV0Core.state)).toEqual(
      StreamUtils.serializeState(docV0Client.state)
    )

    // Load v1 (anchor on top of genesis commit)
    const v1Id = CommitID.make(doc.id, doc.state.log[1].cid)
    const docV1Core = await core.loadStream(v1Id)
    const docV1Client = await client.loadStream(v1Id)
    expect(docV1Core.content).toEqual(content1)
    expect(docV1Core.state.log.length).toEqual(2)
    expect(StreamUtils.serializeState(docV1Core.state)).toEqual(
      StreamUtils.serializeState(docV1Client.state)
    )

    // Load v2
    const v2Id = CommitID.make(doc.id, doc.state.log[2].cid)
    const docV2Core = await core.loadStream(v2Id)
    const docV2Client = await client.loadStream(v2Id)
    expect(docV2Core.content).toEqual(content2)
    expect(docV2Core.state.log.length).toEqual(3)
    expect(StreamUtils.serializeState(docV2Core.state)).toEqual(
      StreamUtils.serializeState(docV2Client.state)
    )

    // Load v3 (anchor on top of v2)
    const v3Id = CommitID.make(doc.id, doc.state.log[3].cid)
    const docV3Core = await core.loadStream(v3Id)
    const docV3Client = await client.loadStream(v3Id)
    expect(docV3Core.content).toEqual(content2)
    expect(docV3Core.state.log.length).toEqual(4)
    expect(StreamUtils.serializeState(docV3Core.state)).toEqual(
      StreamUtils.serializeState(docV3Client.state)
    )

    // Load v4
    const v4Id = CommitID.make(doc.id, doc.state.log[4].cid)
    const docV4Core = await core.loadStream(v4Id)
    const docV4Client = await client.loadStream(v4Id)
    expect(docV4Core.content).toEqual(content3)
    expect(docV4Core.state.log.length).toEqual(5)
    expect(StreamUtils.serializeState(docV4Core.state)).toEqual(
      StreamUtils.serializeState(docV4Client.state)
    )

    // Load v5
    const v5Id = CommitID.make(doc.id, doc.state.log[5].cid)
    const docV5Core = await core.loadStream(v5Id)
    const docV5Client = await client.loadStream(v5Id)
    expect(docV5Core.content).toEqual(content3)
    expect(docV5Core.state.log.length).toEqual(6)
    expect(StreamUtils.serializeState(docV5Core.state)).toEqual(
      StreamUtils.serializeState(docV5Client.state)
    )
  })

  it('can get stream contents from /streams/contents', async () => {
    const content1 = { test: 123 }
    const content2 = { test: 456, test2: 'abc' }
    const content3 = { test2: 'def' }

    const doc = await TileDocument.create<any>(core, content1, null, { anchor: false })
    await doc.update(content2, null, { anchor: false })
    await doc.update(content3, null, { anchor: false })

    const json = await fetchJson(`http://localhost:${daemon.port}/api/v0/streams/${doc.id}/content`)

    expect(json).toEqual(content3)
  })

  it('Aborts fetch if it is taking too long', async () => {
    const content1 = { test: 123 }
    const doc = await TileDocument.create(core, content1, null, { anchor: false })

    const loadStreamMock = jest.spyOn(core, 'loadStream')
    let id = null
    loadStreamMock.mockImplementation(() => {
      return new Promise((resolve) => {
        id = setTimeout(() => {
          resolve(doc)
        }, 2000)
      })
    })

    await expect(
      fetchJson(`http://localhost:${daemon.port}/api/v0/streams/${doc.id}/content`, {
        timeout: 1000,
      })
    ).rejects.toThrow(/aborted/)

    clearTimeout(id)
  })

  it('Aborts fetch through passed in AbortSignal', async () => {
    const content1 = { test: 123 }
    const doc = await TileDocument.create(core, content1, null, { anchor: false })

    const loadStreamMock = jest.spyOn(core, 'loadStream')
    let id = null
    loadStreamMock.mockImplementation(() => {
      return new Promise((resolve) => {
        id = setTimeout(() => {
          resolve(doc)
        }, 5000)
      })
    })

    const timedAbortSignal = new TimedAbortSignal(1000)

    await expect(
      fetchJson(`http://localhost:${daemon.port}/api/v0/streams/${doc.id}/content`, {
        signal: timedAbortSignal.signal,
      })
    ).rejects.toThrow(/aborted/)

    timedAbortSignal.clear()
    clearTimeout(id)
  })

  it('Aborts fetch if taking too long even if given an AbortSignal that did not get aborted', async () => {
    const content1 = { test: 123 }
    const doc = await TileDocument.create(core, content1, null, { anchor: false })

    const loadStreamMock = jest.spyOn(core, 'loadStream')
    let id = null
    loadStreamMock.mockImplementation(() => {
      return new Promise((resolve) => {
        id = setTimeout(() => {
          resolve(doc)
        }, 4000)
      })
    })

    const controller = new AbortController()

    await expect(
      fetchJson(`http://localhost:${daemon.port}/api/v0/streams/${doc.id}/content`, {
        signal: controller.signal,
        timeout: 1000,
      })
    ).rejects.toThrow(/aborted/)

    clearTimeout(id)
  })

  it('Aborts fetch if the AbortSignal given has already been aborted', async () => {
    const content1 = { test: 123 }
    const doc = await TileDocument.create(core, content1, null, { anchor: false })

    const controller = new AbortController()
    controller.abort()

    await expect(
      fetchJson(`http://localhost:${daemon.port}/api/v0/streams/${doc.id}/content`, {
        signal: controller.signal,
      })
    ).rejects.toThrow(/aborted/)
  })

  it('requestAnchor works via http api', async () => {
    const content1 = { test: 123 }

    const doc = await TileDocument.create(client, content1, null, { anchor: false })
    expect(doc.state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)

    await doc.requestAnchor()
    await anchorDoc(doc)
    expect(doc.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
  })

  describe('multiqueries', () => {
    let docA, docB, docC, docD
    beforeEach(async () => {
      docD = await TileDocument.create(core, { test: '321d' })
      docC = await TileDocument.create(core, { test: '321c' })
      docB = await TileDocument.create(core, { d: docD.id.toUrl(), notDoc: '123' })
      docA = await TileDocument.create(core, {
        b: docB.id.toUrl(),
        c: docC.id.toUrl(),
        notDoc: '123',
      })
    })

    it('responds to multiqueries request', async () => {
      //mixed streamId types
      const queries = [
        {
          streamId: docA.id,
          paths: ['/c'],
        },
        {
          streamId: docB.id.toString(),
          paths: ['/d'],
        },
      ]
      const resCore = await core.multiQuery(queries)
      const resClient = await client.multiQuery(queries)

      expect(Object.keys(resCore).length).toEqual(4)
      expect(Object.keys(resClient).length).toEqual(4)

      expect(resCore[docA.id.toString()].content).toEqual(resClient[docA.id.toString()].content)
      expect(resCore[docB.id.toString()].content).toEqual(resClient[docB.id.toString()].content)
      expect(resCore[docC.id.toString()].content).toEqual(resClient[docC.id.toString()].content)
      expect(resCore[docD.id.toString()].content).toEqual(resClient[docD.id.toString()].content)
    })

    it('passes timeout', async () => {
      const queries = [{ streamId: docA.id }]
      const loadLinkedStreamsSpy = jest.spyOn(core, '_loadLinkedStreams')

      // explicit timeout
      await client.multiQuery(queries, 10000)
      expect(loadLinkedStreamsSpy).toBeCalledTimes(1)
      expect(loadLinkedStreamsSpy.mock.calls[0][1]).toEqual(10000)

      // default timeout
      await client.multiQuery(queries)
      expect(loadLinkedStreamsSpy).toBeCalledTimes(2)
      expect(loadLinkedStreamsSpy.mock.calls[1][1]).toEqual(7000) // default timeout

      loadLinkedStreamsSpy.mockRestore()
    })

    it('returns stream when using multiquery with genesis and no updates', async () => {
      const metadata = {
        controllers: ['did:test'],
        family: 'test',
      }
      const genesis = (await TileDocument.makeGenesis(
        {
          did: core.did,
        },
        null,
        {
          ...metadata,
          deterministic: true,
        }
      )) as GenesisCommit

      const streamId = await StreamID.fromGenesis('tile', genesis)
      const resCore = await core.multiQuery([{ genesis, streamId }])
      const resClient = await client.multiQuery([{ genesis, streamId }])

      expect(resCore[streamId.toString()].metadata).toEqual(metadata)
      expect(resClient[streamId.toString()].metadata).toEqual(metadata)
    })
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

  describe('admin api', () => {
    it('admin models API CRUD test', async () => {
      // TODO: Implement this test using the highest-level interface once it's ready


      await expect(fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`)).rejects.toThrow(
        /Get Indexed Models Not Implemented/
      )

      await expect(fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, { method:'POST' })).rejects.toThrow(
        /Add Indexed Models Not Implemented/
      )

      await expect(fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, { method:'PUT' })).rejects.toThrow(
        /Replace Indexed Models Not Implemented/
      )

      await expect(fetchJson(`http://localhost:${daemon.port}/api/v0/admin/models`, { method:'DELETE' })).rejects.toThrow(
        /Delete Indexed Models Not Implemented/
      )
    })
  })
})
