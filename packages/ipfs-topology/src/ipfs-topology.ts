import fetch from "cross-fetch";
import type { DiagnosticsLogger, IpfsApi  } from "@ceramicnetwork/common";
import { Multiaddr } from 'multiaddr';

const PEER_FILE_URLS = {
  "testnet-clay":
    "https://raw.githubusercontent.com/ceramicnetwork/peerlist/main/testnet-clay.json",
  "dev-unstable":
    "https://raw.githubusercontent.com/ceramicnetwork/peerlist/main/dev-unstable.json",
};

const BASE_BOOTSTRAP_LIST = {
  "testnet-clay": [
    new Multiaddr("/dns4/ipfs-clay.3boxlabs.com/tcp/4012/wss/p2p/QmWiY3CbNawZjWnHXx3p3DXsg21pZYTj4CRY1iwMkhP8r3"),
    new Multiaddr("/dns4/ipfs-clay.ceramic.network/tcp/4012/wss/p2p/QmSqeKpCYW89XrHHxtEQEWXmznp6o336jzwvdodbrGeLTk"),
    new Multiaddr("/dns4/ipfs-clay-internal.3boxlabs.com/tcp/4012/wss/p2p/QmQotCKxiMWt935TyCBFTN23jaivxwrZ3uD58wNxeg5npi"),
    new Multiaddr("/dns4/ipfs-clay-cas.3boxlabs.com/tcp/4012/wss/p2p/QmbeBTzSccH8xYottaYeyVX8QsKyox1ExfRx7T1iBqRyCd"),
  ],
  "dev-unstable": [
    new Multiaddr("/dns4/ipfs-dev.3boxlabs.com/tcp/4012/wss/p2p/Qmc4BVsZbVkuvax6SKgwq5BrcKjzBdwx5dW45cWfLVHabx"),
    new Multiaddr("/dns4/ipfs-dev.ceramic.network/tcp/4012/wss/p2p/QmStNqcAjwh6s2sxUWr2ZXT3MhRZmqpJ9Dj6fp3gPdHr6E"),
    new Multiaddr("/dns4/ipfs-dev-internal.3boxlabs.com/tcp/4012/wss/p2p/QmYkpxusRem2iup8ZAfVGYv7iq1ks1yyq2XxQh3z2a8xXq"),
    new Multiaddr("/dns4/ipfs-dev-cas.3boxlabs.com/tcp/4012/wss/p2p/QmPHLQoWhK4CMPPgxGQxjNYEp1fMB8NPpoLaaR2VDMNbcr"),
  ],
};

async function fetchJson(url: string): Promise<any> {
  try {
    const res = await fetch(url).then((response) => response.json());
    if (res.error) {
      throw new Error(res.error);
    }
    return res;
  } catch (error) {
    return []
  }
}

export const DEFAULT_PEER_DISCOVERY_PERIOD = 1000 * 60 * 60; // 1 hour

export class IpfsTopology {
  intervalId: any;

  constructor(
    readonly ipfs: IpfsApi,
    readonly ceramicNetwork: string,
    readonly logger: DiagnosticsLogger,
    readonly period: number = DEFAULT_PEER_DISCOVERY_PERIOD
  ) {}

  async forceConnection(): Promise<void> {
    const base: Multiaddr[] = BASE_BOOTSTRAP_LIST[this.ceramicNetwork] || [];
    const dynamic = await this._dynamicBoostrapList(this.ceramicNetwork);
    const bootstrapList = base.concat(dynamic);
    await this._forceBootstrapConnection(this.ipfs, bootstrapList);
  }

  async start() {
    await this.forceConnection();
    this.intervalId = setInterval(async () => {
      await this.forceConnection();
    }, this.period);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private async _dynamicBoostrapList(network: string): Promise<Multiaddr[]> {
    const url = PEER_FILE_URLS[network];
    if (!url) {
      this.logger.warn(
        `Peer discovery is not supported for ceramic network ${network}. This node may fail to load documents from other nodes on the network`
      );
      return [];
    }
    this.logger.imp(`Connecting to peers found in '${url}'`);
    const list = await fetchJson(url);
    return list || [];
  }

  private async _forceBootstrapConnection(
    ipfs: IpfsApi,
    bootstrapList: Multiaddr[]
  ): Promise<void> {
    await Promise.all(
      bootstrapList.map(async (node) => {
        try {
          await ipfs.swarm.connect(node);
        } catch (error) {
          this.logger.warn(`Can not connect to ${node}`);
          this.logger.warn(error);
        }
      })
    );

    const connectedPeers = await ipfs.swarm.peers();
    if (connectedPeers.length > 0) {
      const peerAddresses = connectedPeers.map((obj) => obj.addr);
      this.logger.imp(`Connected to peers: ${peerAddresses.join(", ")}`);
    }
  }
}
