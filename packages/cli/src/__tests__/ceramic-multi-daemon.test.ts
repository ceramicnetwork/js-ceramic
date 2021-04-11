import Ceramic from '@ceramicnetwork/core'
import CeramicClient from '@ceramicnetwork/http-client'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import tmp from 'tmp-promise'
import IPFS from 'ipfs-core'
import CeramicDaemon from '../ceramic-daemon'
import { CeramicApi, IpfsApi } from '@ceramicnetwork/common';
import { TileDoctypeHandler } from "@ceramicnetwork/doctype-tile-handler"
import { TileDoctype } from "@ceramicnetwork/doctype-tile";
import * as u8a from 'uint8arrays'
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'
import KeyDidResolver from 'key-did-resolver'
import { Resolver } from "did-resolver"
import { DID } from 'dids'

import dagJose from 'dag-jose'
import { sha256 } from 'multiformats/hashes/sha2'
import legacy from 'multiformats/legacy'
import getPort from "get-port";

const seed = u8a.fromString('6e34b2e1a9624113d81ece8a8a22e6e97f0e145c25c1d4d2d0e62753b4060c83', 'base16')
const TOPIC = '/ceramic'

async function swarmConnect(a: IpfsApi, b: IpfsApi) {
    const addressB = (await b.id()).addresses[0].toString();
    await a.swarm.connect(addressB);
}

/**
 * Create an IPFS instance
 */
const createIPFS = async (path: string): Promise<IpfsApi> => {
    const port = await getPort()
    const hasher = {}
    hasher[sha256.code] = sha256
    const format = legacy(dagJose, {hashes: hasher})

    const config = {
        ipld: { formats: [format] },
        repo: `${path}/ipfs${port}/`,
        config: {
            Addresses: { Swarm: [`/ip4/127.0.0.1/tcp/${port}`] },
            Discovery: { DNS: { Enabled: false }, webRTCStar: { Enabled: false }},
            Bootstrap: []
        }
    }

    return IPFS.create(config)
}

const makeDID = function(seed: Uint8Array, ceramic: CeramicApi): DID {
    const provider = new Ed25519Provider(seed)

    const keyDidResolver = KeyDidResolver.getResolver()
    const threeIdResolver = ThreeIdResolver.getResolver(ceramic)
    const resolver = new Resolver({
        ...threeIdResolver, ...keyDidResolver,
    })
    return new DID({ provider, resolver })
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
    jest.setTimeout(30000)
    let ipfs1: IpfsApi
    let ipfs2: IpfsApi
    let ipfs3: IpfsApi
    let tmpFolder1: any
    let tmpFolder2: any
    let tmpFolder3: any
    let core1: Ceramic
    let core2: Ceramic
    let core3: Ceramic
    let daemon1: CeramicDaemon
    let daemon2: CeramicDaemon
    let daemon3: CeramicDaemon
    let client1: CeramicClient
    let client2: CeramicClient
    let client3: CeramicClient

    beforeAll(async () => {
        tmpFolder1 = await tmp.dir({ unsafeCleanup: true });
        tmpFolder2 = await tmp.dir({ unsafeCleanup: true });
        tmpFolder3 = await tmp.dir({ unsafeCleanup: true });

        [ipfs1, ipfs2, ipfs3] = await Promise.all([tmpFolder1, tmpFolder2, tmpFolder3].map((tmpFolder) => createIPFS(tmpFolder)));

        // Make sure nodes 2 and 3 can load updates from node 1
        await swarmConnect(ipfs1, ipfs2)
        await swarmConnect(ipfs1, ipfs3)
    })

    afterAll(async () => {
        await Promise.all([ipfs1.stop(), ipfs2.stop(), ipfs3.stop()])
        await Promise.all([tmpFolder1.clean(), tmpFolder2.cleanup(), tmpFolder3.cleanup()])
    })

    beforeEach(async () => {
        core1 = await makeCeramicCore(ipfs1, tmpFolder1.path)
        core2 = await makeCeramicCore(ipfs2, tmpFolder1.path)
        core3 = await makeCeramicCore(ipfs3, tmpFolder1.path)
        const port1 = await getPort()
        const port2 = await getPort()
        const port3 = await getPort()
        daemon1 = new CeramicDaemon(core1, { port: port1 })
        daemon2 = new CeramicDaemon(core2, { port: port2 })
        daemon3 = new CeramicDaemon(core3, { port: port3 })
        client1 = new CeramicClient('http://localhost:' + port1, { docSyncInterval: 500 })
        client2 = new CeramicClient('http://localhost:' + port2, { docSyncInterval: 500 })
        client3 = new CeramicClient('http://localhost:' + port3, { docSyncInterval: 500 })

        await core1.setDID(makeDID(seed, core1))
        await client1.setDID(makeDID(seed, client1))
        await core2.setDID(makeDID(seed, core2))
        await client2.setDID(makeDID(seed, client2))
        await core3.setDID(makeDID(seed, core3))
        await client3.setDID(makeDID(seed, client3))
    })

    afterEach(async () => {
        await Promise.all([client1.close(), client2.close(), client3.close()])
        await Promise.all([daemon1.close(), daemon2.close(), daemon3.close()])
        await Promise.all([core1.close(), core2.close(), core3.close()])
    })

    it('respects sync DocOpts', async () => {
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

        // Loading the doc with sync:true should get the current contents
        const doc3 = await TileDoctype.load(client3, doc1.id, {sync: true})
        expect(doc3.content).toEqual(updatedContent)
    })
})
