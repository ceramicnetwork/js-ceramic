import { EnvironmentUtils, Networks } from '@ceramicnetwork/common'
import type { DiagnosticsLogger, IpfsApi } from '@ceramicnetwork/common'
import { Multiaddr, multiaddr } from '@multiformats/multiaddr'

/**
 * Hardcoded list of bootstrap peers run by 3BoxLabs for each major network.
 */
const BOOTSTRAP_LIST = (ceramicNetwork: Networks): Array<Multiaddr> | null => {
  if (!EnvironmentUtils.useRustCeramic()) {
    // Go/Kubo based lists
    switch (ceramicNetwork) {
      case Networks.MAINNET:
        return [
          multiaddr(
            '/dns4/go-ipfs-ceramic-private-mainnet-external.3boxlabs.com/tcp/4011/ws/p2p/QmXALVsXZwPWTUbsT8G6VVzzgTJaAWRUD7FWL5f7d5ubAL'
          ),
          multiaddr(
            '/dns4/go-ipfs-ceramic-private-cas-mainnet-external.3boxlabs.com/tcp/4011/ws/p2p/QmUvEKXuorR7YksrVgA7yKGbfjWHuCRisw2cH9iqRVM9P8'
          ),
        ]
      case Networks.TESTNET_CLAY:
        return [
          multiaddr(
            '/dns4/go-ipfs-ceramic-public-clay-external.3boxlabs.com/tcp/4011/ws/p2p/QmWiY3CbNawZjWnHXx3p3DXsg21pZYTj4CRY1iwMkhP8r3'
          ),
          multiaddr(
            '/dns4/go-ipfs-ceramic-private-clay-external.3boxlabs.com/tcp/4011/ws/p2p/QmQotCKxiMWt935TyCBFTN23jaivxwrZ3uD58wNxeg5npi'
          ),
          multiaddr(
            '/dns4/go-ipfs-ceramic-private-cas-clay-external.3boxlabs.com/tcp/4011/ws/p2p/QmbeBTzSccH8xYottaYeyVX8QsKyox1ExfRx7T1iBqRyCd'
          ),
        ]
      case Networks.DEV_UNSTABLE:
        return [
          multiaddr(
            '/dns4/ipfs-ceramic-public-qa-swarm.3boxlabs.com/tcp/4010/p2p/QmPP3RdaSWDkhcxZReGo591FWanLw9ucvgmUZhtSLt9t6D'
          ),
          multiaddr(
            '/dns4/ipfs-ceramic-private-qa-swarm.3boxlabs.com/tcp/4010/p2p/12D3KooWAQvp6Wnqho9ririWvbmtodnNQX9GECQEps2gb6kwBf2h'
          ),
          multiaddr(
            '/dns4/ipfs-ceramic-private-cas-qa-swarm.3boxlabs.com/tcp/4010/p2p/QmRvJ4HX4N6H26NgtqjoJEUyaDyDRUhGESP1aoyCJE1X1b'
          ),
        ]
      case Networks.LOCAL:
      case Networks.INMEMORY:
        return null
      default: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const preventCompilingUnhandledCase: never = ceramicNetwork
        return null
      }
    }
  } else {
    // Rust/Ceramic-one based lists
    switch (ceramicNetwork) {
      case Networks.MAINNET:
        return [
          multiaddr(
            '/dns4/bootstrap-mainnet-rust-ceramic-1.3box.io/tcp/4101/p2p/12D3KooWJC1yR4KiCnocV9kuAEwtsMNh7Xmu2vzqpBvk2o3MrYd6'
          ),
          multiaddr(
            '/dns4/bootstrap-mainnet-rust-ceramic-2.3box.io/tcp/4101/p2p/12D3KooWCuS388c1im7KkmdrpsLMziihF8mbcv2w6HPCp4Qmww6m'
          ),
        ]
      case Networks.TESTNET_CLAY:
        return [
          multiaddr(
            '/dns4/bootstrap-tnet-rust-ceramic-1.3box.io/tcp/4101/p2p/12D3KooWMqCFj5bnwuNi6D6KLhYiK4C8Eh9xSUKv2E6Jozs4nWEE'
          ),
          multiaddr(
            '/dns4/bootstrap-tnet-rust-ceramic-2.3box.io/tcp/4101/p2p/12D3KooWPFGbRHWfDaWt5MFFeqAHBBq3v5BqeJ4X7pmn2V1t6uNs'
          ),
        ]
      case Networks.DEV_UNSTABLE:
        return [
          multiaddr(
            '/dns4/bootstrap-devqa-rust-ceramic-1.3box.io/tcp/4101/p2p/12D3KooWJmYPnXgst4gW5GoyAYzRB3upLgLVR1oDVGwjiS9Ce7sA'
          ),
          multiaddr(
            '/dns4/bootstrap-devqa-rust-ceramic-2.3box.io/tcp/4101/p2p/12D3KooWFCf7sKeW8NHoT35EutjJX5vCpPekYqa4hB4tTUpYrcam'
          ),
        ]
      case Networks.LOCAL:
      case Networks.INMEMORY:
        return null
      default: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const preventCompilingUnhandledCase: never = ceramicNetwork
        return null
      }
    }
  }
}

export const DEFAULT_BOOTSTRAP_CONNECTION_PERIOD = 1000 * 60 * 60 // 1 hour

/**
 * Used to connect the IPFS node used by Ceramic to the bootstrap nodes run by 3BoxLabs.
 */
export class IpfsTopology {
  intervalId: any

  constructor(
    readonly ipfs: IpfsApi,
    readonly ceramicNetwork: string,
    readonly logger: DiagnosticsLogger,
    readonly period: number = DEFAULT_BOOTSTRAP_CONNECTION_PERIOD
  ) {}

  async forceConnection(): Promise<void> {
    const bootstrapList: Multiaddr[] = BOOTSTRAP_LIST(this.ceramicNetwork as Networks) || []
    await this._forceBootstrapConnection(this.ipfs, bootstrapList)
  }

  async start() {
    this.logger.imp(`Connecting to bootstrap peers for network ${this.ceramicNetwork}`)

    await this.forceConnection()
    const connectedPeers = (await this.ipfs.swarm.peers()).map((peer) => peer.addr.toString())
    this.logger.debug(`Connected to peers: ${connectedPeers.join(',')}`)

    this.intervalId = setInterval(async () => {
      this.logger.debug(
        `Performing periodic reconnection to bootstrap peers for network ${this.ceramicNetwork}`
      )
      await this.forceConnection()
    }, this.period)
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }
  }

  private async _forceBootstrapConnection(
    ipfs: IpfsApi,
    bootstrapList: Multiaddr[]
  ): Promise<void> {
    // Don't want to swarm connect to ourself
    let myPeerId
    try {
      myPeerId = (await ipfs.id()).id
    } catch (error) {
      this.logger.warn(
        `Error loading our PeerID from IPFS: ${error}. Skipping connection to bootstrap peers`
      )
      return
    }

    const filteredBootstrapList = bootstrapList.filter((addr) => {
      return !addr.getPeerId()?.endsWith(myPeerId)
    })

    for (const node of filteredBootstrapList) {
      try {
        await ipfs.swarm.connect(node)
      } catch (error) {
        this.logger.warn(`Can not connect to ${node}`)
        this.logger.warn(error)
      }
    }
  }
}
