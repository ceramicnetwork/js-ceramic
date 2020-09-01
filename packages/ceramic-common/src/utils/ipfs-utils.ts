import Ipfs from "ipfs"

import dagJose from 'dag-jose'
// @ts-ignore
import basicsImport from 'multiformats/cjs/src/basics-import.js'
// @ts-ignore
import legacy from 'multiformats/cjs/src/legacy.js'

export class IpfsUtils {

    /**
     * Create an IPFS instance
     * @param overrideConfig - IFPS config for override
     */
    static async createIPFS(overrideConfig: object = {}): Promise<any> {
        basicsImport.multicodec.add(dagJose)
        const format = legacy(basicsImport, dagJose.name)

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
