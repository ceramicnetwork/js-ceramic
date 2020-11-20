import {Pinning} from "./pinning";
import ipfsClient from "ipfs-http-client";
import {Context} from "@ceramicnetwork/ceramic-common";
import CID from "cids";
import { IPFSApi } from "../declarations"

const FROM_CONTEXT = '__context'

/**
 * Pin document to a IPFS node.
 *
 * +connectionString+ indicates what node to connect to. It has a form of URL starting with `ipfs+http(s)` protocol,
 * for example: `ipfs+http://3.3.3.3:5001`. It would translate into `http://3.3.3.3:5001` IPFS endpoint connection.
 *
 * Ceramic node already manages a connection to IPFS. If it is preferred to reuse the connection, one should
 * pass a special `ipfs+context` connection string.
 */
export class IpfsPinning implements Pinning {
    static designator = 'ipfs'

    readonly ipfsAddress: string

    readonly #context: Context
    #ipfs: IPFSApi

    constructor(connectionString: string, context: Context) {
        if (connectionString == 'ipfs+context') {
            this.ipfsAddress = FROM_CONTEXT
        } else {
            const url = new URL(connectionString)
            const ipfsHost = url.hostname
            const ipfsPort = parseInt(url.port, 10) || 5001
            const protocol = url.protocol
                .replace('ipfs+http:', 'http')
                .replace('ipfs+https:', 'https')
                .replace('ipfs+context:', FROM_CONTEXT)
            if (protocol === FROM_CONTEXT) {
                this.ipfsAddress = FROM_CONTEXT
            } else {
                this.ipfsAddress = `${protocol}://${ipfsHost}:${ipfsPort}`
            }
        }
        this.#context = context
    }

    get ipfs() {
        return this.#ipfs
    }

    async open(): Promise<void> {
        if (this.ipfsAddress === FROM_CONTEXT) {
            this.#ipfs = this.#context.ipfs
        } else {
            this.#ipfs = ipfsClient({
                url: this.ipfsAddress
            })
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
