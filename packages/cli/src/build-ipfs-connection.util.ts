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
const IPFS_GET_TIMEOUT = 30000 // 30 seconds

const BOOTSTRAP = {
    "testnet-clay": [
        '/dns4/ipfs-clay.3boxlabs.com/tcp/4012/wss/p2p/QmWiY3CbNawZjWnHXx3p3DXsg21pZYTj4CRY1iwMkhP8r3',
        '/dns4/ipfs-clay.ceramic.network/tcp/4012/wss/p2p/QmSqeKpCYW89XrHHxtEQEWXmznp6o336jzwvdodbrGeLTk',
        '/dns4/ipfs-clay-internal.3boxlabs.com/tcp/4012/wss/p2p/QmQotCKxiMWt935TyCBFTN23jaivxwrZ3uD58wNxeg5npi',
        '/dns4/ipfs-clay-cas.3boxlabs.com/tcp/4012/wss/p2p/QmbeBTzSccH8xYottaYeyVX8QsKyox1ExfRx7T1iBqRyCd'
    ],
    "dev-unstable": [
        '/dns4/ipfs-dev.3boxlabs.com/tcp/4012/wss/p2p/Qmc4BVsZbVkuvax6SKgwq5BrcKjzBdwx5dW45cWfLVHabx',
        '/dns4/ipfs-dev.ceramic.network/tcp/4012/wss/p2p/QmStNqcAjwh6s2sxUWr2ZXT3MhRZmqpJ9Dj6fp3gPdHr6E',
        '/dns4/ipfs-dev-internal.3boxlabs.com/tcp/4012/wss/p2p/QmYkpxusRem2iup8ZAfVGYv7iq1ks1yyq2XxQh3z2a8xXq',
        '/dns4/ipfs-dev-cas.3boxlabs.com/tcp/4012/wss/p2p/QmPHLQoWhK4CMPPgxGQxjNYEp1fMB8NPpoLaaR2VDMNbcr'
    ]
}

export async function buildIpfsConnection(network: string, ipfsEndpoint?: string): Promise<IpfsApi>{
    const bootstrapList = BOOTSTRAP[network] || []
    let ipfs: IpfsApi

    if (ipfsEndpoint) {
        ipfs = ipfsClient({ url: ipfsEndpoint, ipld: { formats: [dagJoseFormat] }, timeout: IPFS_GET_TIMEOUT })
    } else {
        // TODO: Add global timeout, remove timeout from every call to ipfs.dag.get()
        ipfs = await IPFS.create({
            ipld: {
                formats: [dagJoseFormat]
            },
            libp2p: {
                config: {
                    dht: {
                        enabled: false,
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
            },
            preload: {
                enabled: false
            }
        })
    }

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
