import Ceramic from '@ceramicnetwork/core'
import CeramicClient from '@ceramicnetwork/http-client'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import tmp from 'tmp-promise'
import IPFS from 'ipfs-core'
import CeramicDaemon from '../ceramic-daemon'
import { AnchorStatus, Doctype, DoctypeUtils, IpfsApi } from '@ceramicnetwork/common';
import { TileDoctypeHandler } from "@ceramicnetwork/doctype-tile-handler"
import { TileDoctype } from "@ceramicnetwork/doctype-tile";
import { filter, take } from "rxjs/operators"
import * as u8a from 'uint8arrays'

import dagJose from 'dag-jose'
import { sha256 } from 'multiformats/hashes/sha2'
import legacy from 'multiformats/legacy'
import DocID from "@ceramicnetwork/docid";

const seed = u8a.fromString('6e34b2e1a9624113d81ece8a8a22e6e97f0e145c25c1d4d2d0e62753b4060c83', 'base16')
const port = 7777
const apiUrl = 'http://localhost:' + port
const topic = '/ceramic'

/**
 * Create an IPFS instance
 * @param overrideConfig - IFPS config for override
 */
const createIPFS = (overrideConfig: Record<string, unknown> = {}): Promise<IpfsApi> => {
    const hasher = {}
    hasher[sha256.code] = sha256
    const format = legacy(dagJose, {hashes: hasher})

    const config = {
        ipld: { formats: [format] },
    }

    Object.assign(config, overrideConfig)
    return IPFS.create(config)
}

describe('Ceramic interop: core <> http-client', () => {
    jest.setTimeout(30000)
    let ipfs: IpfsApi
    let tmpFolder: any
    let core: Ceramic
    let daemon: CeramicDaemon
    let client: CeramicClient

    const DOCTYPE_TILE = 'tile'

    beforeAll(async () => {
        tmpFolder = await tmp.dir({ unsafeCleanup: true })
        ipfs = await createIPFS({
            repo: `${tmpFolder.path}/ipfs${5011}/`, config: {
                Addresses: { Swarm: [`/ip4/127.0.0.1/tcp/${5011}`] }, Discovery: {
                    MDNS: { Enabled: false }, webRTCStar: { Enabled: false }
                }, Bootstrap: []
            }
        })
        if (!ipfs.pubsub) {
            ipfs.pubsub = {}
        }
        ipfs.pubsub.subscribe = jest.fn()
    })

    afterAll(async () => {
        await ipfs.stop()
        await tmpFolder.cleanup()
    })

    beforeEach(async () => {
        const stateStoreDirectory = tmpFolder.path
        core = await Ceramic.create(ipfs, {pubsubTopic: topic, stateStoreDirectory, anchorOnRequest: false})

        const doctypeHandler = new TileDoctypeHandler()
        doctypeHandler.verifyJWS = (): Promise<void> => { return }
        // @ts-ignore
        core._doctypeHandlers.add(doctypeHandler)

        daemon = new CeramicDaemon(core, { port, debug: false })
        client = new CeramicClient(apiUrl, { docSyncInterval: 500 })

        const provider = new Ed25519Provider(seed)
        await core.setDIDProvider(provider)
        await client.setDIDProvider(provider)
    })

    afterEach(async () => {
        await client.close()
        await daemon.close()
        await core.close()
    })

    /**
     * Registers a listener for change notifications on a document, instructs the anchor service to
     * perform an anchor, then waits for the change listener to resolve, indicating that the document
     * got anchored.
     * @param doc
     */
    const anchorDoc = async (doc: Doctype): Promise<void> => {
        const changeHandle = doc.pipe(filter(state => state.anchorStatus === AnchorStatus.ANCHORED || state.anchorStatus === AnchorStatus.FAILED), take(1)).toPromise()
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await daemon.ceramic.context.anchorService.anchor()
        await changeHandle
    }

    it('properly creates document', async () => {
        const doc1 = await TileDoctype.create(core, { test: 123 }, null,
            { anchor: false, publish: false, sync: false });
        const doc2 = await TileDoctype.create(client, { test: 123 }, null,
            { anchor: false, publish: false, sync: false });

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

    it('gets anchor record updates', async () => {
        const doc1 = await TileDoctype.create(core, { test: 123 });
        await anchorDoc(doc1)
        expect(doc1.state.log.length).toEqual(2)
        expect(doc1.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
        const doc2 = await TileDoctype.create(client, { test: 1234 });
        await anchorDoc(doc2)
        expect(doc2.state.log.length).toEqual(2)
        expect(doc2.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    })

    it('loads documents correctly', async () => {
        const doc1 = await TileDoctype.create(core, { test: 123 });
        await anchorDoc(doc1)
        const doc2 = await client.loadDocument(doc1.id)
        expect(doc1.content).toEqual(doc2.content)
        expect(DoctypeUtils.serializeState(doc1.state)).toEqual(DoctypeUtils.serializeState(doc2.state))

        const doc3 = await TileDoctype.create(client, { test: 456 });
        await anchorDoc(doc3)
        const doc4 = await core.loadDocument(doc3.id)
        expect(doc3.content).toEqual(doc4.content)
        expect(DoctypeUtils.serializeState(doc3.state)).toEqual(DoctypeUtils.serializeState(doc4.state))
    })

    it('loads document records correctly', async () => {
        const doc1 = await TileDoctype.create(core, { test: 123 });
        await anchorDoc(doc1)
        const doc2 = await client.loadDocument(doc1.id)
        expect(doc1.content).toEqual(doc2.content)

        const records1 = await core.loadDocumentRecords(doc1.id)
        expect(records1).toBeDefined()

        const records2 = await client.loadDocumentRecords(doc2.id)
        expect(records2).toBeDefined()

        const serializeCommits = (commits: any): any => commits.map((r: any) => {
            return {
                cid: r.cid, value: DoctypeUtils.serializeCommit(r.value)
            }
        })

        expect(serializeCommits(records1)).toEqual(serializeCommits(records2))
    })

    it('makes and gets updates correctly with subscription', async () => {
      function delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms))
      }
      const initialContent = { a: 'initial' }
      const middleContent = { ...initialContent, b: 'middle' }
      const finalContent = { ...middleContent, c: 'final' }

      const doc1 = await TileDoctype.create(core, initialContent);
      await anchorDoc(doc1)
      const doc2 = await client.loadDocument<TileDoctype>(doc1.id)
      doc1.subscribe()
      doc2.subscribe()
      // change from core viewable in client
      await doc1.update(middleContent)
      await anchorDoc(doc1)
      await delay(1000) // 2x polling interval
      expect(doc1.content).toEqual(middleContent)
      expect(doc1.content).toEqual(doc2.content)
      expect(DoctypeUtils.serializeState(doc1.state)).toEqual(DoctypeUtils.serializeState(doc2.state))
      // change from client viewable in core

      await doc2.update(finalContent)
      await anchorDoc(doc2)
      await delay(1000) // 2x polling interval
      expect(doc1.content).toEqual(doc2.content)
      expect(doc1.content).toEqual(finalContent)
      expect(DoctypeUtils.serializeState(doc1.state)).toEqual(DoctypeUtils.serializeState(doc2.state))
    })

    it('makes and gets updates correctly with manual sync', async () => {
        const initialContent = { a: 'initial' }
        const middleContent = { ...initialContent, b: 'middle' }
        const finalContent = { ...middleContent, c: 'final' }

        const doc1 = await TileDoctype.create(core, initialContent);
        await anchorDoc(doc1)
        const doc2 = await client.loadDocument<TileDoctype>(doc1.id)
        // change from core viewable in client
        await doc1.update(middleContent)
        await anchorDoc(doc1)
        await doc2.sync()
        await doc1.sync()
        expect(doc1.content).toEqual(middleContent)
        expect(doc1.content).toEqual(doc2.content)
        expect(DoctypeUtils.serializeState(doc1.state)).toEqual(DoctypeUtils.serializeState(doc2.state))
        // change from client viewable in core

        await doc2.update(finalContent)
        await anchorDoc(doc2)
        await doc2.sync()
        await doc1.sync()
        expect(doc1.content).toEqual(doc2.content)
        expect(doc1.content).toEqual(finalContent)
        expect(DoctypeUtils.serializeState(doc1.state)).toEqual(DoctypeUtils.serializeState(doc2.state))
    })

    it('loads commits correctly', async () => {
        // Create multiple commits of the same document
        const content1 = {test: 123}
        const content2 = {test: 456}
        const content3 = {test: 789}
        const doc = await TileDoctype.create(core, content1);
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
        const v0Id = doc.id.atCommit(doc.id.cid)
        const docV0Core = await core.loadDocument(v0Id)
        const docV0Client = await client.loadDocument(v0Id)
        expect(docV0Core.content).toEqual(content1)
        expect(docV0Core.state.log.length).toEqual(1)
        expect(DoctypeUtils.serializeState(docV0Core.state)).toEqual(DoctypeUtils.serializeState(docV0Client.state))

        // Load v1 (anchor on top of genesis commit)
        const v1Id = doc.id.atCommit(doc.state.log[1].cid)
        const docV1Core = await core.loadDocument(v1Id)
        const docV1Client = await client.loadDocument(v1Id)
        expect(docV1Core.content).toEqual(content1)
        expect(docV1Core.state.log.length).toEqual(2)
        expect(DoctypeUtils.serializeState(docV1Core.state)).toEqual(DoctypeUtils.serializeState(docV1Client.state))

        // Load v2
        const v2Id = doc.id.atCommit(doc.state.log[2].cid)
        const docV2Core = await core.loadDocument(v2Id)
        const docV2Client = await client.loadDocument(v2Id)
        expect(docV2Core.content).toEqual(content2)
        expect(docV2Core.state.log.length).toEqual(3)
        expect(DoctypeUtils.serializeState(docV2Core.state)).toEqual(DoctypeUtils.serializeState(docV2Client.state))

        // Load v3 (anchor on top of v2)
        const v3Id = doc.id.atCommit(doc.state.log[3].cid)
        const docV3Core = await core.loadDocument(v3Id)
        const docV3Client = await client.loadDocument(v3Id)
        expect(docV3Core.content).toEqual(content2)
        expect(docV3Core.state.log.length).toEqual(4)
        expect(DoctypeUtils.serializeState(docV3Core.state)).toEqual(DoctypeUtils.serializeState(docV3Client.state))

        // Load v4
        const v4Id = doc.id.atCommit(doc.state.log[4].cid)
        const docV4Core = await core.loadDocument(v4Id)
        const docV4Client = await client.loadDocument(v4Id)
        expect(docV4Core.content).toEqual(content3)
        expect(docV4Core.state.log.length).toEqual(5)
        expect(DoctypeUtils.serializeState(docV4Core.state)).toEqual(DoctypeUtils.serializeState(docV4Client.state))

        // Load v5
        const v5Id = doc.id.atCommit(doc.state.log[5].cid)
        const docV5Core = await core.loadDocument(v5Id)
        const docV5Client = await client.loadDocument(v5Id)
        expect(docV5Core.content).toEqual(content3)
        expect(docV5Core.state.log.length).toEqual(6)
        expect(DoctypeUtils.serializeState(docV5Core.state)).toEqual(DoctypeUtils.serializeState(docV5Client.state))
    })

    describe('multiqueries', () => {
        let docA, docB, docC, docD
        beforeEach(async () => {
          docD = await TileDoctype.create(core, { test: '321d' });
          docC = await TileDoctype.create(core, { test: '321c' });
          docB = await TileDoctype.create(core, { d: docD.id.toUrl(), notDoc: '123' });
          docA = await TileDoctype.create(core, { b: docB.id.toUrl(), c: docC.id.toUrl(), notDoc: '123' });
        })

        it('responds to multiqueries request', async () => {
            //mixed docId types
            const queries = [
                {
                  docId: docA.id,
                  paths: ['/c']
                },
                {
                  docId: docB.id.toString(),
                  paths: ['/d']
                }
            ]
            const resCore  = await core.multiQuery(queries)
            const resClient = await client.multiQuery(queries)

            expect(Object.keys(resCore).length).toEqual(4)
            expect(Object.keys(resClient).length).toEqual(4)

            expect(resCore[docA.id.toString()].content).toEqual(resClient[docA.id.toString()].content)
            expect(resCore[docB.id.toString()].content).toEqual(resClient[docB.id.toString()].content)
            expect(resCore[docC.id.toString()].content).toEqual(resClient[docC.id.toString()].content)
            expect(resCore[docD.id.toString()].content).toEqual(resClient[docD.id.toString()].content)
        })
    })

    describe('pin api', () => {

        let docA, docB

        beforeEach(async () => {
            docB = await TileDoctype.create(core, { foo: 'bar' })
            docA = await TileDoctype.create(core, { foo: 'baz' })
        })

        const pinLs = async (docId?: DocID): Promise<Array<any>> => {
            const pinnedDocsIterator = await client.pin.ls(docId);
            const docs = [];
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

            // Make sure docA shows as pinned when checking for its specific docId
            pinnedDocs = await pinLs(docA.id)
            expect(pinnedDocs).toEqual([docA.id.toString()])

            // Make sure docB doesn't show up as pinned when checking for its docId
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

            // Make sure docB still shows as pinned when checking for its specific docId
            pinnedDocs = await pinLs(docB.id)
            expect(pinnedDocs).toEqual([docB.id.toString()])

            // Make sure docA no longer shows up as pinned when checking for its docId
            pinnedDocs = await pinLs(docA.id)
            expect(pinnedDocs).toHaveLength(0)
        })
    })
})
