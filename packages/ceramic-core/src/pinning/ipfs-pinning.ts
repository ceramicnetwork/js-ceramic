import {Pinning} from "./pinning";
import ipfsClient from "ipfs-http-client";
import {Ipfs} from "ipfs";
import {Context} from "@ceramicnetwork/ceramic-common";
import CID from "cids";

const FROM_CONTEXT_HOST = '__context'

/**
 * Pin document to a IPFS node.
 *
 * +connectionString+ indicates what node to connect to. It has a form of URL starting with `ipfs` protocol,
 * for example: `ipfs://3.3.3.3:5001`. It would translate into `http://3.3.3.3:5001` IPFS endpoint connection.
 *
 * Ceramic node already manages a connection to IPFS. If it is preferred to reuse the connection, one should
 * pass a special `__context` hostname into the connection string: `ipfs:///__context:5001`.
 */
export class IpfsPinning implements Pinning {
    static designator = 'ipfs'

    readonly ipfsAddress: string

    readonly #context: Context
    #ipfs: Ipfs

    constructor(connectionString: string, context: Context) {
        const url = new URL(connectionString)
        const ipfsHost = url.hostname
        const ipfsPort = parseInt(url.port, 10) || 5001
        if (ipfsHost === FROM_CONTEXT_HOST) {
            this.ipfsAddress = FROM_CONTEXT_HOST
        } else {
            const protocol = url.protocol
                .replace('ipfs:', 'http')
                .replace('ipfs+http:', 'http')
                .replace('ipfs+https:', 'https')
            this.ipfsAddress = `${protocol}://${ipfsHost}:${ipfsPort}`
        }
        this.#context = context
    }

    get ipfs() {
        return this.#ipfs
    }

    async open(): Promise<void> {
        if (this.ipfsAddress === FROM_CONTEXT_HOST) {
            this.#ipfs = this.#context.ipfs
        } else {
            this.#ipfs = ipfsClient(this.ipfsAddress)
        }
    }

    async close(): Promise<void> {
        // Do Nothing
    }

    async pin(cid: CID): Promise<void> {
        await this.#ipfs.pin.add(cid, {recursive: false})
    }

    async unpin(cid: CID): Promise<void> {
        await this.#ipfs.pin.rm(cid)
    }
}