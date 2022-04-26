import mergeOpts from 'merge-options'
import * as dagJose from 'dag-jose'
import * as ipfsClient from 'ipfs-http-client'
import { DiagnosticsLogger, IpfsApi } from '@ceramicnetwork/common'
import { IpfsMode } from './daemon-config.js'
import * as http from 'http'
import * as https from 'https'
import * as ipfs from '@ceramicnetwork/ipfs-daemon'

const IPFS_GET_TIMEOUT = 60000 // 1 minute

const mergeOptions = mergeOpts.bind({ ignoreUndefined: true })

const ipfsHttpAgent = (ipfsEndpoint: string | ipfsClient.multiaddr) => {
  const agentOptions = {
    keepAlive: false,
    maxSockets: Infinity,
  }
  if (typeof ipfsEndpoint === 'string' && ipfsEndpoint.startsWith('https')) {
    return new https.Agent(agentOptions)
  } else {
    return new http.Agent(agentOptions)
  }
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
      agent: ipfsHttpAgent(ipfsEndpoint),
    })
  } else {
    return createGoIPFS()
  }
}

async function createGoIPFS(overrideConfig: Partial<ipfsClient.Options> = {}): Promise<IpfsApi> {
  const swarmPort = 4011
  const apiPort = 5011
  const gatewayPort = 9011
  const defaultConfig = {
    ipld: { codecs: [dagJose] },
    repo: process.env.IPFS_PATH || '~/.goipfs',
    config: {
      Pubsub: {
        Enabled: true,
      },
      Addresses: {
        Swarm: [`/ip4/0.0.0.0/tcp/${swarmPort}`],
        Gateway: `/ip4/127.0.0.1/tcp/${gatewayPort}`,
        API: `/ip4/127.0.0.1/tcp/${apiPort}`,
      },
      Bootstrap: [
        '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
        '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
        '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
        '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt',
        '/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ',
        '/ip4/104.131.131.82/udp/4001/quic/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ',
      ],
    },
  }

  const appliedConfig = mergeOptions(defaultConfig, overrideConfig)

  return ipfs.createIPFS(appliedConfig, false)
}
