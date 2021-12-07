import { IpfsApi } from '@ceramicnetwork/common'
import getPort from 'get-port'
import * as dagJose from 'dag-jose'
import { create } from 'ipfs-core'

/**
 * Create an IPFS instance
 */
export async function createIPFS(path: string): Promise<IpfsApi> {
  const port = await getPort()

  const config = {
    ipld: { codecs: [dagJose] },
    repo: `${path}/ipfs${port}/`,
    config: {
      Addresses: { Swarm: [`/ip4/127.0.0.1/tcp/${port}`] },
      Discovery: { DNS: { Enabled: false }, webRTCStar: { Enabled: false } },
      Bootstrap: [],
    },
  }

  return create(config)
}
