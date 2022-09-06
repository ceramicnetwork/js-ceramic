import { Networks } from '@ceramicnetwork/common'
import type { DiagnosticsLogger, IpfsApi } from '@ceramicnetwork/common'
import { Multiaddr } from 'multiaddr'

/**
 * Hardcoded list of bootstrap peers run by 3BoxLabs for each major network.
 */
const BOOTSTRAP_LIST = (ceramicNetwork: Networks): Array<Multiaddr> | null => {
  switch (ceramicNetwork) {
    case Networks.MAINNET:
    case Networks.ELP:
      return [
        new Multiaddr(
          '/dns4/go-ipfs-ceramic-public-mainnet-external.ceramic.network/tcp/4011/ws/p2p/QmS2hvoNEfQTwqJC4v6xTvK8FpNR2s6AgDVsTL3unK11Ng'
        ),
        new Multiaddr(
          '/dns4/go-ipfs-ceramic-private-mainnet-external.3boxlabs.com/tcp/4011/ws/p2p/QmXALVsXZwPWTUbsT8G6VVzzgTJaAWRUD7FWL5f7d5ubAL'
        ),
        new Multiaddr(
          '/dns4/go-ipfs-ceramic-private-cas-mainnet-external.3boxlabs.com/tcp/4011/ws/p2p/QmUvEKXuorR7YksrVgA7yKGbfjWHuCRisw2cH9iqRVM9P8'
        ),
      ]
    case Networks.TESTNET_CLAY:
      return [
        new Multiaddr(
          '/dns4/go-ipfs-ceramic-public-clay-external.3boxlabs.com/tcp/4011/ws/p2p/QmWiY3CbNawZjWnHXx3p3DXsg21pZYTj4CRY1iwMkhP8r3'
        ),
        new Multiaddr(
          '/dns4/go-ipfs-ceramic-public-clay-external.ceramic.network/tcp/4011/ws/p2p/QmSqeKpCYW89XrHHxtEQEWXmznp6o336jzwvdodbrGeLTk'
        ),
        new Multiaddr(
          '/dns4/go-ipfs-ceramic-private-clay-external.3boxlabs.com/tcp/4011/ws/p2p/QmQotCKxiMWt935TyCBFTN23jaivxwrZ3uD58wNxeg5npi'
        ),
        new Multiaddr(
          '/dns4/go-ipfs-ceramic-private-cas-clay-external.3boxlabs.com/tcp/4011/ws/p2p/QmbeBTzSccH8xYottaYeyVX8QsKyox1ExfRx7T1iBqRyCd'
        ),
      ]
    case Networks.DEV_UNSTABLE:
      return [
        new Multiaddr(
          '/dns4/go-ipfs-ceramic-public-qa-external.3boxlabs.com/tcp/4011/ws/p2p/QmPP3RdaSWDkhcxZReGo591FWanLw9ucvgmUZhtSLt9t6D'
        ),
        new Multiaddr(
          '/dns4/go-ipfs-ceramic-public-qa-external.ceramic.network/tcp/4011/ws/p2p/QmUSSp4CY3wBALoy71T7BU4WjP3x9L5JzDJZkEDALmxhCq'
        ),
        new Multiaddr(
          '/dns4/go-ipfs-ceramic-private-qa-external.3boxlabs.com/tcp/4011/ws/p2p/QmXcmXfLkkaGbQdj98cgGvHr5gkwJp4r79j9xbJajsoYHr'
        ),
        new Multiaddr(
          '/dns4/go-ipfs-ceramic-private-cas-qa-external.3boxlabs.com/tcp/4011/ws/p2p/QmRvJ4HX4N6H26NgtqjoJEUyaDyDRUhGESP1aoyCJE1X1b'
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
    this.logger.debug(`Performing periodic reconnection to bootstrap peers`)
    const bootstrapList: Multiaddr[] = BOOTSTRAP_LIST(this.ceramicNetwork as Networks) || []
    await this._forceBootstrapConnection(this.ipfs, bootstrapList)
  }

  async start() {
    await this.forceConnection()
    this.intervalId = setInterval(async () => {
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
