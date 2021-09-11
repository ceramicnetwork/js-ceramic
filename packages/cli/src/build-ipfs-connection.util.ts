import { IpfsDaemon } from '@ceramicnetwork/ipfs-daemon'

import dagJose from 'dag-jose'
import { convert } from 'blockcodec-to-ipld-format'
import ipfsClient from 'ipfs-http-client'
import { DiagnosticsLogger, IpfsApi } from '@ceramicnetwork/common'
import { IpfsMode } from './daemon-config'

const dagJoseFormat = convert(dagJose)

const IPFS_DHT_SERVER_MODE = process.env.IPFS_DHT_SERVER_MODE === 'true'
const IPFS_GET_TIMEOUT = 60000 // 1 minute

export async function buildIpfsConnection(
  mode: IpfsMode,
  network: string,
  logger: DiagnosticsLogger,
  ipfsEndpoint?: string
): Promise<IpfsApi> {
  if (mode == IpfsMode.REMOTE) {
    return ipfsClient.create({
      url: ipfsEndpoint,
      ipld: { formats: [dagJoseFormat] },
      timeout: IPFS_GET_TIMEOUT,
    })
  } else {
    const ipfsDaemon = await IpfsDaemon.create({
      ipfsDhtServerMode: IPFS_DHT_SERVER_MODE,
      ipfsEnableApi: true,
      ipfsEnableGateway: true,
      // Do not setup peer connections in IPFS daemon.
      // We do it in Ceramic instance itself.
      useCentralizedPeerDiscovery: false,
      logger,
    }).then((daemon) => daemon.start())
    return ipfsDaemon.ipfs
  }
}
