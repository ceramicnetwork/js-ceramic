import IPFS from "ipfs-core"

import dagJose from 'dag-jose'
// @ts-ignore
import multiformats from 'multiformats/basics'
// @ts-ignore
import legacy from 'multiformats/legacy'
import ipfsClient from "ipfs-http-client"
import { IpfsApi } from "@ceramicnetwork/common"

multiformats.multicodec.add(dagJose)
const dagJoseFormat = legacy(multiformats, dagJose.name)

const IPFS_DHT_SERVER_MODE = process.env.IPFS_DHT_SERVER_MODE === 'true'

const BOOTSTRAP = {
    "testnet-clay": [
        '/dns4/ipfs-clay-cas.3boxlabs.com/tcp/4012/wss/p2p/QmbeBTzSccH8xYottaYeyVX8QsKyox1ExfRx7T1iBqRyCd',
        '/dns4/ipfs-clay.ceramic.network/tcp/4012/wss/p2p/QmQqq1oVkwpJdKNdiWvrftgWE2nov4AFGPBauZ2AakxmoR',
        '/dns4/ipfs-clay.3boxlabs.com/tcp/4012/wss/p2p/QmQotCKxiMWt935TyCBFTN23jaivxwrZ3uD58wNxeg5npi'
    ],
    "dev-unstable": [
        '/dns4/ipfs-dev.3boxlabs.com/tcp/4012/wss/p2p/QmeRWpCaEpQLY1yJFFHf7pFbZZapXoj5E4pKvUtyExMUKk',
        '/dns4/ipfs-dev.ceramic.network/tcp/4012/wss/p2p/QmadvKqYyLMHYjnwswd2bHM3UCFp4F4oSFdobYUKSPjBaZ',
        '/dns4/ipfs-dev-cas.3boxlabs.com/tcp/4012/wss/p2p/QmPHLQoWhK4CMPPgxGQxjNYEp1fMB8NPpoLaaR2VDMNbcr'
    ]
}

export async function buildIpfsConnection(network: string, ipfsEndpoint?: string): Promise<IpfsApi>{
    if (ipfsEndpoint) {
        return ipfsClient({ url: ipfsEndpoint, ipld: { formats: [dagJoseFormat] } })
    } else {
        const bootstrapList = BOOTSTRAP[network] || []
        const ipfs = await IPFS.create({
            ipld: {
                formats: [dagJoseFormat]
            },
            libp2p: {
                config: {
                    dht: {
                        enabled: true,
                        clientMode: !IPFS_DHT_SERVER_MODE,
                        randomWalk: false,
                    },
                },
                pubsub: {
                    enabled: true
                },
            },
            config: {
                Routing: {
                    Type: IPFS_DHT_SERVER_MODE ? 'dhtserver' : 'dhtclient',
                },
                Bootstrap: bootstrapList
            }
        })
        await Promise.all(bootstrapList.map(async node => {
            try {
                await ipfs.swarm.connect(node)
            } catch (error) {
                console.warn(`Can not connect to ${node}`)
                console.warn(error)
            }
        }))
        return ipfs
    }
}
