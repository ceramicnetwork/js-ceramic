import Ceramic from '@ceramicnetwork/core'
import CeramicClient from '@ceramicnetwork/http-client'
import * as tmp from 'tmp-promise'
import CeramicDaemon from '../ceramic-daemon'
import { IpfsApi } from '@ceramicnetwork/common';
import { TileDoctypeHandler } from "@ceramicnetwork/doctype-tile-handler"
import { TileDoctype } from "@ceramicnetwork/doctype-tile";
import getPort from "get-port";
import { createIPFS } from './create-ipfs';
import { makeDID } from './make-did';

const seed = 'SEED'
const TOPIC = '/ceramic'

async function swarmConnect(a: IpfsApi, b: IpfsApi) {
    const addressB = (await b.id()).addresses[0].toString();
    await a.swarm.connect(addressB);
}

const makeCeramicCore = async(ipfs: IpfsApi, stateStoreDirectory: string): Promise<Ceramic> => {
    const core = await Ceramic.create(ipfs, {pubsubTopic: TOPIC, stateStoreDirectory, anchorOnRequest: false})

    const doctypeHandler = new TileDoctypeHandler()
    doctypeHandler.verifyJWS = (): Promise<void> => { return }
    // @ts-ignore
    core._doctypeHandlers.add(doctypeHandler)
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
        tmpFolder1 = await tmp.dir({ unsafeCleanup: true });
        tmpFolder2 = await tmp.dir({ unsafeCleanup: true });

        [ipfs1, ipfs2] = await Promise.all([tmpFolder1, tmpFolder2].map((tmpFolder) => createIPFS(tmpFolder.path)));

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
        daemon1 = new CeramicDaemon(core1, { port: port1 })
        await daemon1.listen()
        daemon2 = new CeramicDaemon(core2, { port: port2 })
        await daemon2.listen()
        client1 = new CeramicClient('http://localhost:' + port1, { docSyncInterval: 500 })
        client2 = new CeramicClient('http://localhost:' + port2, { docSyncInterval: 500 })

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

    it("doesn't sync if sync: false", async () => {
        const initialContent = {test: 123}
        const updatedContent = {test: 456}
        // Create a document with updates on the first node so that the updates aren't visible
        // on node 2 and 3 without querying pubsub
        const doc1 = await TileDoctype.create(core1, initialContent, null, {anchor: false});
        await doc1.update(updatedContent)

        // Loading the doc with sync:false should only load the initial genesis contents
        const doc2 = await TileDoctype.load(client2, doc1.id, {sync: false})
        expect(doc2.content).toEqual(initialContent)
        // TODO uncomment when sync() is changed to always force sync
        //await doc2.sync()
        //expect(doc2.content).toEqual(updatedContent)
    })

    it("does sync if sync: true", async () => {
        const initialContent = {test: 123}
        const updatedContent = {test: 456}
        // Create a document with updates on the first node so that the updates aren't visible
        // on node 2 and 3 without querying pubsub
        const doc1 = await TileDoctype.create(core1, initialContent, null, {anchor: false});
        await doc1.update(updatedContent)

        // Loading the doc with sync:true should get the current contents
        const doc2 = await TileDoctype.load(client2, doc1.id, {sync: true})
        expect(doc2.content).toEqual(updatedContent)
    })
})
