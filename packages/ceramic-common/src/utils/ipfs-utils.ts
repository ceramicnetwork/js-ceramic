import Ipfs from "ipfs"

import dagJose from 'dag-jose'
// @ts-ignore
import legacy from 'multiformats/legacy'
// @ts-ignore
import multiformats from 'multiformats/basics'

export class IpfsUtils {

    /**
     * Create an IPFS instance
     * @param overrideConfig - IFPS config for override
     */
    static async createIPFS(overrideConfig: object = {}): Promise<any> {
        multiformats.multicodec.add(dagJose)
        const format = legacy(multiformats, dagJose.name)

        const config = {
            ipld: { formats: [format] },
            libp2p: {
                config: {
                    dht: {
                        enabled: true
                    }
                }
            }
        }

        Object.assign(config, overrideConfig)
        return Ipfs.create(config)
    }

}
