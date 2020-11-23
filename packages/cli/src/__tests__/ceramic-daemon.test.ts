import Ceramic from '@ceramicnetwork/core'
import CeramicClient from '@ceramicnetwork/http-client'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import tmp from 'tmp-promise'
import IPFS from 'ipfs'
import { IPFSApi } from "../declarations"
import CeramicDaemon from '../ceramic-daemon'
import { AnchorStatus, DoctypeUtils } from "@ceramicnetwork/common"
import { TileDoctypeHandler } from "@ceramicnetwork/doctype-tile"
import { EventEmitter } from "events"
import * as u8a from 'uint8arrays'

import dagJose from 'dag-jose'
import basicsImport from 'multiformats/cjs/src/basics-import.js'
import legacy from 'multiformats/cjs/src/legacy.js'

const seed = u8a.fromString('6e34b2e1a9624113d81ece8a8a22e6e97f0e145c25c1d4d2d0e62753b4060c83', 'base16')
const anchorUpdate = (doc: EventEmitter): Promise<void> => new Promise(resolve => doc.on('change', resolve))
const port = 7777
const apiUrl = 'http://localhost:' + port

/**
 * Create an IPFS instance
 * @param overrideConfig - IFPS config for override
 */
const createIPFS = (overrideConfig: Record<string, unknown> = {}): Promise<IPFSApi> => {
    basicsImport.multicodec.add(dagJose)
    const format = legacy(basicsImport, dagJose.name)

    const config = {
        ipld: { formats: [format] },
    }

    Object.assign(config, overrideConfig)
    return IPFS.create(config)
}

describe('Ceramic interop: core <> http-client', () => {
    jest.setTimeout(20000)
    let ipfs: IPFSApi
    let tmpFolder: any
    let core: Ceramic
    let daemon: CeramicDaemon
    let client: CeramicClient

    const DOCTYPE_TILE = 'tile'

    const topic = 'ceramic_daemon_test'

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
        core = await Ceramic.create(ipfs, { topic })

        const doctypeHandler = new TileDoctypeHandler()
        doctypeHandler.verifyJWS = (): Promise<void> => { return }
        core._doctypeHandlers['tile'] = doctypeHandler

        daemon = new CeramicDaemon(core, { port })
        client = new CeramicClient(apiUrl, { docSyncEnabled: true })

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
            applyOnly: true,
            skipWait: true
        })
        const doc2 = await client.createDocument(DOCTYPE_TILE, { content: { test: 123 } }, {
            applyOnly: true,
            skipWait: true
        })
        expect(doc1.content).toEqual(doc2.content)

        const state1 = doc1.state
        const state2 = doc2.state

        // TODO fix: logs are different because of the kid version (0 != anchored CID)
        delete state1.log
        delete state2.log

        expect(state1).toEqual(state2)
        // Ensure that chainId gets populated correctly
        expect(state1.metadata.chainId).toEqual("inmemory:12345")
    })

    it('gets anchor record updates', async () => {
        const doc1 = await client.createDocument(DOCTYPE_TILE, { content: { test: 123 } })
        await anchorUpdate(doc1)
        expect(doc1.state.log.length).toEqual(2)
        expect(doc1.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
        const doc2 = await client.createDocument(DOCTYPE_TILE, { content: { test: 1234 } })
        await anchorUpdate(doc2)
        expect(doc2.state.log.length).toEqual(2)
        expect(doc2.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    })

    it('loads documents correctly', async () => {
        const doc1 = await core.createDocument(DOCTYPE_TILE, { content: { test: 123 } })
        await anchorUpdate(doc1)
        const doc2 = await client.loadDocument(doc1.id)
        expect(doc1.content).toEqual(doc2.content)
        expect(DoctypeUtils.serializeState(doc1.state)).toEqual(DoctypeUtils.serializeState(doc2.state))

        const doc3 = await client.createDocument(DOCTYPE_TILE, { content: { test: 456 } })
        await anchorUpdate(doc3)
        const doc4 = await core.loadDocument(doc3.id)
        expect(doc3.content).toEqual(doc4.content)
        expect(DoctypeUtils.serializeState(doc3.state)).toEqual(DoctypeUtils.serializeState(doc4.state))
    })

    it('loads document records correctly', async () => {
        const doc1 = await core.createDocument(DOCTYPE_TILE, { content: { test: 123 } })
        await anchorUpdate(doc1)
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
        await anchorUpdate(doc1)
        const doc2 = await client.loadDocument(doc1.id)
        // change from core viewable in client
        await doc1.change({ content: { test: 123, abc: 987 } })
        await anchorUpdate(doc1)
        await anchorUpdate(doc2)
        expect(doc1.content).toEqual(doc2.content)
        expect(DoctypeUtils.serializeState(doc1.state)).toEqual(DoctypeUtils.serializeState(doc2.state))
        // change from client viewable in core

        await doc2.change({ content: { test: 456, abc: 654 } })

        await anchorUpdate(doc2)
        expect(doc1.content).toEqual(doc2.content)
        expect(DoctypeUtils.serializeState(doc1.state)).toEqual(DoctypeUtils.serializeState(doc2.state))
    })
})
