import Ipfs from "ipfs"

import dagJose from 'dag-jose'
// @ts-ignore
import legacy from 'multiformats/legacy'
// @ts-ignore
import multiformats from 'multiformats/basics'

export class IpfsUtils {

    static async create(path: string, id: number): Promise<any> {
        multiformats.multicodec.add(dagJose)
        const format = legacy(multiformats, dagJose.name)

        return Ipfs.create({
            repo: `${path}/ipfs${id}/`,
            ipld: { formats: [format] },
            libp2p: {
                config: {
                    dht: {
                        enabled: true
                    }
                }
            },
            config: {
                Addresses: { Swarm: [ `/ip4/127.0.0.1/tcp/${4004 + id}` ] },
                Discovery: {
                    MDNS: { Enabled: false },
                    webRTCStar: { Enabled: false }
                },
                Bootstrap: []
            }
        })
    }

}
