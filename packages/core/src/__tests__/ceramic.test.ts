import Ceramic from '../ceramic'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import IPFS from 'ipfs-core'
import tmp from 'tmp-promise'
import { IpfsApi } from "@ceramicnetwork/common"

import dagJose from 'dag-jose'
import basicsImport from 'multiformats/cjs/src/basics-import.js'
import legacy from 'multiformats/cjs/src/legacy.js'
import * as u8a from 'uint8arrays'

jest.mock('../store/level-state-store')

const seed = u8a.fromString('6e34b2e1a9624113d81ece8a8a22e6e97f0e145c25c1d4d2d0e62753b4060c83', 'base16')

/**
 * Create an IPFS instance
 * @param overrideConfig - IPFS config for override
 */
const createIPFS = async (overrideConfig: Record<string, unknown> = {}): Promise<IpfsApi> => {
    basicsImport.multicodec.add(dagJose)
    const format = legacy(basicsImport, dagJose.name)

    const config = {
        ipld: { formats: [format] },
    }

    Object.assign(config, overrideConfig)
    return IPFS.create(config)
}

/**
 * Creates a Ceramic instance
 * @param ipfs - IPFS instance
 */
const createCeramic = async (ipfs: IpfsApi): Promise<Ceramic> => {
    const ceramic = await Ceramic.create(ipfs, {
        stateStorePath: await tmp.tmpName(),
    })
    const provider = new Ed25519Provider(seed)
    await ceramic.setDIDProvider(provider)

    return ceramic
}

/**
 * Generates string of particular size in bytes
 * @param size - Size in bytes
 */
const generateStringOfSize = (size): string => {
    const chars = 'abcdefghijklmnopqrstuvwxyz'.split('');
    const len = chars.length;
    const random_data = [];

    while (size--) {
        random_data.push(chars[Math.random() * len | 0]);
    }
    return random_data.join('');
}

describe('Ceramic', () => {
    jest.setTimeout(30000)
    let ipfs: IpfsApi;
    let ceramic: Ceramic
    let tmpFolder: any;

    beforeAll(async () => {
        tmpFolder = await tmp.dir({ unsafeCleanup: true })

        ipfs = await createIPFS({
            repo: `${tmpFolder.path}`, config: {
                Addresses: { Swarm: [`/ip4/127.0.0.1/tcp/${3001}`] }, Bootstrap: []
            }
        })
    })

    afterAll(async () => {
        await ipfs.stop(() => console.log('IPFS stopped'))
        await tmpFolder.cleanup()
        await new Promise(resolve => setTimeout(() => resolve(), 1000))
    })

    describe('network', () => {
        it('can create Ceramic instance on default network', async () => {
            const stateStorePath = await tmp.tmpName()
            const ceramic = await Ceramic.create(ipfs, { stateStorePath })
            const supportedChains = await ceramic.getSupportedChains()
            expect(supportedChains).toEqual(['inmemory:12345'])
            await ceramic.close()
        })

        it('can create Ceramic instance explicitly on inmemory network', async () => {
            const stateStorePath = await tmp.tmpName()
            const ceramic = await Ceramic.create(ipfs, { networkName: 'inmemory', stateStorePath })
            const supportedChains = await ceramic.getSupportedChains()
            expect(supportedChains).toEqual(['inmemory:12345'])
            await ceramic.close()
        })

        it('cannot create Ceramic instance on network not supported by our anchor service', async () => {
            const stateStorePath = await tmp.tmpName()
            await expect(Ceramic.create(ipfs, {
                networkName: 'local', stateStorePath
            })).rejects.toThrow("No usable chainId for anchoring was found.  The ceramic network 'local' supports the chains: ['eip155:1337'], but the configured anchor service 'inmemory' only supports the chains: ['inmemory:12345']")
        })

        it('cannot create Ceramic instance on invalid network', async () => {
            const stateStorePath = await tmp.tmpName()
            await expect(Ceramic.create(ipfs, {
                networkName: 'fakenetwork', stateStorePath
            })).rejects.toThrow("Unrecognized Ceramic network name: 'fakenetwork'. Supported networks are: 'mainnet', 'testnet-clay', 'local', 'inmemory'")
        })
    })

    describe('records', () => {
        it('can store record if the size is lesser than the maximum size ~500KB', async () => {
            ceramic = await createCeramic(ipfs)

            const doctype = await ceramic.createDocument('tile', { content: { test: generateStringOfSize(10000) } })
            expect(doctype).not.toBeNull();

            await ceramic.close()
        })

        it('cannot store record if the size is greated than the maximum size ~500KB', async () => {
            ceramic = await createCeramic(ipfs)

            await expect(ceramic.createDocument('tile', { content: { test: generateStringOfSize(1000000) } })).rejects.toThrow(/exceeds the maximum block size of/)
            await ceramic.close()
        })
    })
})
