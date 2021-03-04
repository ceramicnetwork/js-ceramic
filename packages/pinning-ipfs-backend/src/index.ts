import type {
    CidList, PinningBackend, PinningInfo, Context, IpfsApi,
} from "@ceramicnetwork/common";
import type CID from "cids";
import * as sha256 from "@stablelib/sha256";
import * as base64 from "@stablelib/base64";
import ipfsClient from "ipfs-http-client"

const FROM_CONTEXT_HOST = "ipfs+context";

export class NoIpfsInstanceError extends Error {
    constructor() {
        super("No IPFS instance available");
    }
}

const textEncoder = new TextEncoder();

/**
 * Pin document to a IPFS node.
 *
 * +connectionString+ indicates what node to connect to. It has a form of URL starting with `ipfs` protocol,
 * for example: `ipfs://3.3.3.3:5001`. It would translate into `http://3.3.3.3:5001` IPFS endpoint connection.
 *
 * Ceramic node already manages a connection to IPFS. If it is preferred to reuse the connection, one should
 * pass a special `__context` hostname into the connection string: `ipfs:///__context:5001`.
 */
export class IpfsPinning implements PinningBackend {
    static designator = "ipfs";

    readonly ipfsAddress: string;
    readonly id: string;

    #ipfs: IpfsApi | undefined;

    constructor(readonly connectionString: string, ipfs: IpfsApi) {
        if (connectionString == 'ipfs+context') {
            this.ipfsAddress = FROM_CONTEXT_HOST
        } else {
            const url = new URL(connectionString)
            const ipfsHost = url.hostname
            const ipfsPort = parseInt(url.port, 10) || 5001
            const protocol = url.protocol
                .replace('ipfs+http:', 'http')
                .replace('ipfs+https:', 'https')
                .replace('ipfs+context:', FROM_CONTEXT_HOST)
            if (protocol === FROM_CONTEXT_HOST) {
                this.ipfsAddress = FROM_CONTEXT_HOST
            } else {
                this.ipfsAddress = `${protocol}://${ipfsHost}:${ipfsPort}`
            }
        }
        this.#ipfs = ipfs;

        const bytes = textEncoder.encode(this.connectionString);
        const digest = base64.encodeURLSafe(sha256.hash(bytes));
        this.id = `${IpfsPinning.designator}@${digest}`;
    }

    get ipfs(): IpfsApi {
        return this.#ipfs;
    }

    open(): void {
        if (this.ipfsAddress === FROM_CONTEXT_HOST) {
            if (!this.#ipfs) {
                throw new NoIpfsInstanceError();
            }
        } else {
            this.#ipfs = ipfsClient({
                url: this.ipfsAddress
            });
        }
    }

    async close(): Promise<void> {
        // Do Nothing
    }

    async pin(cid: CID): Promise<void> {
        await this.#ipfs?.pin.add(cid, { recursive: false });
    }

    async unpin(cid: CID): Promise<void> {
        await this.#ipfs?.pin.rm(cid);
    }

    async ls(): Promise<CidList> {
        const iterable = this.#ipfs?.pin.ls();
        if (iterable) {
            const result: CidList = {};
            for await (const r of iterable) {
                result[r.cid.toString()] = [this.id];
            }
            return result;
        } else {
            return {};
        }
    }

    async info(): Promise<PinningInfo> {
        return { [this.id]: {} };
    }
}
