
import type CID from "cids";
import type {
  CidList, PinningBackend, PinningBackendStatic, PinningInfo, IpfsApi,
} from "@ceramicnetwork/common";
import * as base64 from "@stablelib/base64";
import * as sha256 from "@stablelib/sha256";

export class UnknownPinningService extends Error {
    constructor(designator: string | null) {
        super(`Unknown pinning service ${designator}`);
    }
}

const textEncoder = new TextEncoder();

function uniq<A>(input: A[]): A[] {
  return [...new Set(input)]
}

/**
 * Multitude of pinning services united.
 */
export class PinningAggregation implements PinningBackend {
    readonly id: string;
    readonly backends: PinningBackend[];

    static build(ipfs: IpfsApi, connectionStrings: string[], pinners: Array<PinningBackendStatic> = []): PinningAggregation {
        const backends = connectionStrings.map<PinningBackend>((s) => {
            const protocol = s.match(`://`) ? new URL(s).protocol.replace(":", "") : s;
            const match = protocol.match(/^(\w+)\+?/);
            const designator = match ? match[1] : "";

            const found = pinners.find((pinner) => pinner.designator === designator);
            if (found) {
                return new found(s, ipfs);
            } else {
                throw new UnknownPinningService(designator);
            }
        });
        return new PinningAggregation(backends);
    }

    constructor(backends: PinningBackend[]) {
        this.backends = backends;

        const allIds = this.backends.map((b) => b.id).join("\n");
        const bytes = textEncoder.encode(allIds);
        const digest = base64.encodeURLSafe(sha256.hash(bytes));
        this.id = `pinning-aggregation@${digest}`;
    }

    /**
     * Open all the services.
     * Async semantics: every call should succeed.
     */
    open(): void {
        this.backends.forEach((service) => service.open())
    }

    /**
     * Close all the services.
     * Async semantics: every call should succeed.
     */
    async close(): Promise<void> {
        await Promise.all(this.backends.map(async (service) => service.close()));
    }

    /**
     * Pin document.
     * Async semantics: every call should succeed.
     */
    async pin(cid: CID): Promise<void> {
        await Promise.all(this.backends.map(async (service) => service.pin(cid)));
    }

    /**
     * Unpin CID.
     * Async semantics: individual call failures do not propagate upstream; anything goes.
     * @param cid
     */
    async unpin(cid: CID): Promise<void> {
        Promise.all(this.backends.map(async (service) => service.unpin(cid))).catch(() => {
          // noop
        });
    }

    /**
     * List pinned CIDs.
     */
    async ls(): Promise<CidList> {
        const perBackend = await Promise.all(this.backends.map((b) => b.ls()));
        const allCids = uniq(perBackend.flatMap((p) => Object.keys(p)));
        const result: CidList = {};
        allCids.forEach((cid) => {
            result[cid] = perBackend.flatMap((p) => p[cid]).filter(Boolean);
        });
        return result;
    }

    async info(): Promise<PinningInfo> {
        const perBackend = await Promise.all(this.backends.map((b) => b.info()));
        return Object.assign({}, ...perBackend);
    }
}
