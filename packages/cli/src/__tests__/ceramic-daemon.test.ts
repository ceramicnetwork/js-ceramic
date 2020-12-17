import Ceramic from '@ceramicnetwork/core'
import CeramicClient from '@ceramicnetwork/http-client'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import tmp from 'tmp-promise'
import IPFS from 'ipfs-core'
import CeramicDaemon from '../ceramic-daemon'
import { AnchorStatus, DoctypeUtils, IpfsApi } from "@ceramicnetwork/common"
import { TileDoctypeHandler } from "@ceramicnetwork/doctype-tile"
import { EventEmitter } from "events"
import * as u8a from 'uint8arrays'

import dagJose from 'dag-jose'
import basicsImport from 'multiformats/cjs/src/basics-import.js'
import legacy from 'multiformats/cjs/src/legacy.js'
import DocID from "@ceramicnetwork/docid";

const seed = u8a.fromString('6e34b2e1a9624113d81ece8a8a22e6e97f0e145c25c1d4d2d0e62753b4060c83', 'base16')
const waitChange = (doc: EventEmitter, count = 1): Promise<void> => {
    return new Promise(resolve => {
        let c = 0
        doc.on('change', () => {
            if (++c === count) {
                resolve()
                doc.removeAllListeners('change')
            }
        })
    })
}
const port = 7777
const apiUrl = 'http://localhost:' + port

/**
 * Create an IPFS instance
 * @param overrideConfig - IFPS config for override
 */
const createIPFS = (overrideConfig: Record<string, unknown> = {}): Promise<IpfsApi> => {
    basicsImport.multicodec.add(dagJose)
    const format = legacy(basicsImport, dagJose.name)

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
    })

    afterAll(async () => {
        await ipfs.stop()
        await tmpFolder.cleanup()
    })

    beforeEach(async () => {
        // TODO: Many of the tests in this file are racy and depend on an anchor not having been
        // performed yet by the time the test checks.  To eliminate this race condition we should set
        // anchorOnRequest to false in the config for the InMemoryAnchorService and anchor manually
        // throughout the tests.
        core = await Ceramic.create(ipfs)

        const doctypeHandler = new TileDoctypeHandler()
        doctypeHandler.verifyJWS = (): Promise<void> => { return }
        // @ts-ignore
        core._doctypeHandlers['tile'] = doctypeHandler

        daemon = new CeramicDaemon(core, { port, debug: false })
        client = new CeramicClient(apiUrl, { docSyncEnabled: true, docSyncInterval: 1000 })

        const provider = new Ed25519Provider(seed)
        await core.setDIDProvider(provider)
        await client.setDIDProvider(provider)
    })

    afterEach(async () => {
        await client.close()
        await daemon.close()
        await core.close()
    })

    it('properly creates document', async () => {
        const doc1 = await core.createDocument(DOCTYPE_TILE, { content: { test: 123 } }, {
            anchor: false,
            publish: false,
            sync: false,
        })
        const doc2 = await client.createDocument(DOCTYPE_TILE, { content: { test: 123 } }, {
            anchor: false,
            publish: false,
            sync: false,
        })
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
        await waitChange(doc1, 2)
        expect(doc1.state.log.length).toEqual(2)
        expect(doc1.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
        const doc2 = await client.createDocument(DOCTYPE_TILE, { content: { test: 1234 } })
        await waitChange(doc2, 2)
        expect(doc2.state.log.length).toEqual(2)
        expect(doc2.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    })

    it('loads documents correctly', async () => {
        const doc1 = await core.createDocument(DOCTYPE_TILE, { content: { test: 123 } })
        await waitChange(doc1)
        const doc2 = await client.loadDocument(doc1.id)
        expect(doc1.content).toEqual(doc2.content)
        expect(DoctypeUtils.serializeState(doc1.state)).toEqual(DoctypeUtils.serializeState(doc2.state))

        const doc3 = await client.createDocument(DOCTYPE_TILE, { content: { test: 456 } })
        await waitChange(doc3)
        const doc4 = await core.loadDocument(doc3.id)
        expect(doc3.content).toEqual(doc4.content)
        expect(DoctypeUtils.serializeState(doc3.state)).toEqual(DoctypeUtils.serializeState(doc4.state))
    })

    it('loads document records correctly', async () => {
        const doc1 = await core.createDocument(DOCTYPE_TILE, { content: { test: 123 } })
        await waitChange(doc1)
        const doc2 = await client.loadDocument(doc1.id)
        expect(doc1.content).toEqual(doc2.content)

        const records1 = await core.loadDocumentRecords(doc1.id)
        expect(records1).toBeDefined()

        const records2 = await client.loadDocumentRecords(doc2.id)
        expect(records2).toBeDefined()

        const serializeRecords = (records: any): any => records.map((r: any) => {
            return {
                cid: r.cid, value: DoctypeUtils.serializeRecord(r.value)
            }
        })

        expect(serializeRecords(records1)).toEqual(serializeRecords(records2))
    })

    it('makes and gets updates correctly', async () => {
        const doc1 = await core.createDocument(DOCTYPE_TILE, { content: { test: 123 } })
        await waitChange(doc1)
        const doc2 = await client.loadDocument(doc1.id)
        // change from core viewable in client
        await doc1.change({ content: { test: 123, abc: 987 } })
        await waitChange(doc1)
        await waitChange(doc2)
        expect(doc1.content).toEqual(doc2.content)
        expect(DoctypeUtils.serializeState(doc1.state)).toEqual(DoctypeUtils.serializeState(doc2.state))
        // change from client viewable in core

        const finalContent = { test: 456, abc: 654 }
        await doc2.change({ content: finalContent })

        await waitChange(doc2)
        expect(doc1.content).toEqual(doc2.content)
        expect(doc1.content).toEqual(finalContent)
        expect(DoctypeUtils.serializeState(doc1.state)).toEqual(DoctypeUtils.serializeState(doc2.state))
    })

    it('loads commits correctly', async () => {
        // Create multiple commits of the same document
        const content1 = {test: 123}
        const content2 = {test: 456}
        const content3 = {test: 789}
        const doc = await core.createDocument(DOCTYPE_TILE, {content: content1})
        await waitChange(doc)
        expect(doc.state.log.length).toEqual(2)
        expect(doc.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
        await doc.change({content: content2})
        await waitChange(doc)
        expect(doc.state.log.length).toEqual(4)
        expect(doc.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
        await doc.change({content: content3})
        await waitChange(doc)
        expect(doc.state.log.length).toEqual(6)
        expect(doc.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

        // Load genesis commit
        const v0Id = DocID.fromOther(doc.id, doc.id.cid)
        const docV0Core = await core.loadDocument(v0Id)
        const docV0Client = await client.loadDocument(v0Id)
        expect(docV0Core.content).toEqual(content1)
        expect(docV0Core.state.log.length).toEqual(1)
        expect(DoctypeUtils.serializeState(docV0Core.state)).toEqual(DoctypeUtils.serializeState(docV0Client.state))

        // Load v1 (anchor on top of genesis commit)
        const v1Id = DocID.fromOther(doc.id, doc.state.log[1].cid)
        const docV1Core = await core.loadDocument(v1Id)
        const docV1Client = await client.loadDocument(v1Id)
        expect(docV1Core.content).toEqual(content1)
        expect(docV1Core.state.log.length).toEqual(2)
        expect(DoctypeUtils.serializeState(docV1Core.state)).toEqual(DoctypeUtils.serializeState(docV1Client.state))

        // Load v2
        const v2Id = DocID.fromOther(doc.id, doc.state.log[2].cid)
        const docV2Core = await core.loadDocument(v2Id)
        const docV2Client = await client.loadDocument(v2Id)
        expect(docV2Core.content).toEqual(content2)
        expect(docV2Core.state.log.length).toEqual(3)
        expect(DoctypeUtils.serializeState(docV2Core.state)).toEqual(DoctypeUtils.serializeState(docV2Client.state))

        // Load v3 (anchor on top of v2)
        const v3Id = DocID.fromOther(doc.id, doc.state.log[3].cid)
        const docV3Core = await core.loadDocument(v3Id)
        const docV3Client = await client.loadDocument(v3Id)
        expect(docV3Core.content).toEqual(content2)
        expect(docV3Core.state.log.length).toEqual(4)
        expect(DoctypeUtils.serializeState(docV3Core.state)).toEqual(DoctypeUtils.serializeState(docV3Client.state))

        // Load v4
        const v4Id = DocID.fromOther(doc.id, doc.state.log[4].cid)
        const docV4Core = await core.loadDocument(v4Id)
        const docV4Client = await client.loadDocument(v4Id)
        expect(docV4Core.content).toEqual(content3)
        expect(docV4Core.state.log.length).toEqual(5)
        expect(DoctypeUtils.serializeState(docV4Core.state)).toEqual(DoctypeUtils.serializeState(docV4Client.state))

        // Load v5
        const v5Id = DocID.fromOther(doc.id, doc.state.log[5].cid)
        const docV5Core = await core.loadDocument(v5Id)
        const docV5Client = await client.loadDocument(v5Id)
        expect(docV5Core.content).toEqual(content3)
        expect(docV5Core.state.log.length).toEqual(6)
        expect(DoctypeUtils.serializeState(docV5Core.state)).toEqual(DoctypeUtils.serializeState(docV5Client.state))
    })

    describe('multiqueries', () => {
        let docA, docB, docC, docD
        beforeAll(async () => {
          const controller = core.context.did.id
          docD = await core.createDocument(DOCTYPE_TILE, {
            content: { test: '321d'  },
            metadata: { controllers: [controller] }
          })
          docC = await core.createDocument(DOCTYPE_TILE, {
            content: { test: '321c' },
            metadata: { controllers: [controller] }
          })
          docB = await core.createDocument(DOCTYPE_TILE, {
            content: { d: docD.id.toUrl(),
                       notDoc: '123' },
            metadata: { controllers: [controller] }
          })
          docA = await core.createDocument(DOCTYPE_TILE, {
            content: { b: docB.id.toUrl(),
                       c: docC.id.toUrl(),
                       notDoc: '123' },
            metadata: { controllers: [controller] }
          })
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
})
