import fetch from "cross-fetch"
import { IpfsApi } from "@ceramicnetwork/common"

const PEER_FILE_URLS = {
    "testnet-clay": "https://raw.githubusercontent.com/ceramicnetwork/peerlist/main/testnet-clay.json"
}

const PEER_DISCOVERY_INTERVAL_DELAY = 1000 * 60 * 60 // 1 hour

let peerDiscoveryPeriodicTask;

async function fetchJson(url: string): Promise<any> {
    const res = await fetch(url).then(response => response.json())
    if (res.error) {
        throw new Error(res.error)
    }
    return res
}

/**
 * As a temporary workaround to the js-ipfs DHT being broken, we are doing ipfs peer discovery manually
 * by querying a centralized file that lists all registered ceramic nodes.
 * @param network - ceramic network name
 * @param ipfs - ipfs connection
 */
async function connectToPeers(network: string, ipfs: IpfsApi): Promise<void> {
    const url = PEER_FILE_URLS[network]
    if (!url) {
        console.warn(`Peer discovery is not supported for ceramic network ${network}. This node may fail to load documents from other nodes on the network`)
        return
    }
    console.log(`Connecting to peers found in '${url}'`)
    const peers = await fetchJson(url)

    await Promise.all(peers.map(async peer => {
        try {
            await ipfs.swarm.connect(peer)
        } catch (error) {
            console.warn(`Can not connect to ${peer}`)
            console.warn(error)
        }
    }))

    const connectedPeers = await ipfs.swarm.peers()
    console.log("Connected to peers: " + connectedPeers.map((obj) => {return obj.addr}).join(', '))
}

/**
 * Calls `connectToPeers` once, then starts a background task to periodically re-call it.
 * @param network - ceramic network name
 * @param ipfs - ipfs connection
 */
export async function periodicallyConnectToPeers(network: string, ipfs: IpfsApi): Promise<void> {
    await connectToPeers(network, ipfs)
    peerDiscoveryPeriodicTask = setInterval(async () => {
        await connectToPeers(network, ipfs)
    }, PEER_DISCOVERY_INTERVAL_DELAY)
}

/**
 * Stops the periodic job that was started with `periodicallyConnectToPeers`
 */
export async function cancelPeriodicConnectToPeersTask() {
    clearInterval(peerDiscoveryPeriodicTask)
}