import type { Options } from 'ipfs-core'
import mergeOpts from 'merge-options'
import * as Ctl from 'ipfsd-ctl'
import dagJose from 'dag-jose'
import * as ipfsClient from 'ipfs-http-client'
import { DiagnosticsLogger, IpfsApi } from '@ceramicnetwork/common'
import { IpfsMode } from './daemon-config.js'
import { path } from 'go-ipfs'

const IPFS_DHT_SERVER_MODE = process.env.IPFS_DHT_SERVER_MODE === 'true'
const IPFS_GET_TIMEOUT = 60000 // 1 minute

const mergeOptions = mergeOpts.bind({ ignoreUndefined: true })

const ipfsHttpModule = {
  create: (ipfsEndpoint: string) => {
    return ipfsClient.create({
      url: ipfsEndpoint,
      ipld: { codecs: [dagJose] },
    })
  },
}
export async function buildIpfsConnection(
  mode: IpfsMode,
  network: string,
  logger: DiagnosticsLogger,
  ipfsEndpoint?: string
): Promise<IpfsApi> {
  if (mode == IpfsMode.REMOTE) {
    return ipfsClient.create({
      url: ipfsEndpoint,
      ipld: { codecs: [dagJose] },
      timeout: IPFS_GET_TIMEOUT,
    })
  } else {
    return createGoIPFS()
  }
}

async function createGoIPFS(overrideConfig: Partial<Options> = {}): Promise<IpfsApi> {
  const swarmPort = 4011
  const apiPort = 5011
  const gatewayPort = 9011
  const defaultConfig = {
    ipld: { codecs: [dagJose] },
    config: {
      Pubsub: {
        Enabled: true,
      },
      Addresses: {
        Swarm: [`/ip4/127.0.0.1/tcp/${swarmPort}`],
        Gateway: `/ip4/127.0.0.1/tcp/${gatewayPort}`,
        API: `/ip4/127.0.0.1/tcp/${apiPort}`,
      },
      Bootstrap: [],
    },
  }

  const appliedConfig = mergeOptions(defaultConfig, overrideConfig)

  const ipfsd = await Ctl.createController({
    ipfsHttpModule: ipfsHttpModule,
    ipfsBin: path(),
    ipfsOptions: appliedConfig,
    disposable: true,
  })
  return ipfsd.api
}
