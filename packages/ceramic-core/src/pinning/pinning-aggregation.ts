import {IpfsPinning} from "./ipfs-pinning";
import {Pinning, PinningStatic} from "./pinning";
import {Context} from "@ceramicnetwork/ceramic-common";
import {PowergatePinning} from "./powergate-pinning";
import CID from "cids";

export class UnknownPinningService extends Error {
    constructor(designator: string) {
        super(`Unknown pinning service ${designator}`);
    }
}

/**
 * Multitude of pinning services united.
 */
export class PinningAggregation implements Pinning {
    readonly backends: Pinning[]

    constructor(context: Context, connectionStrings: string[], pinners: Array<PinningStatic> = [IpfsPinning, PowergatePinning]) {
        this.backends = connectionStrings.map(s => {
            const protocol = new URL(s).protocol.replace(':', '')
            const designator = protocol.match(/^(\w+)\+?/)[1]
            const found = pinners.find(pinner => pinner.designator === designator)
            if (found) {
                return new found(s, context)
            } else {
                throw new UnknownPinningService(designator)
            }

        })
    }

    /**
     * Open all the services.
     * Async semantics: every call should succeed.
     */
    async open(): Promise<void> {
        await Promise.all(this.backends.map(async service => service.open()))
    }

    /**
     * Close all the services.
     * Async semantics: every call should succeed.
     */
    async close(): Promise<void> {
        await Promise.all(this.backends.map(async service => service.close()))
    }

    /**
     * Pin document.
     * Async semantics: every call should succeed.
     */
    async pin(cid: CID): Promise<void> {
        await Promise.all(this.backends.map(async service => service.pin(cid)))
    }

    /**
     * Unpin the document.
     * Async semantics: individual call failures do not propagate upstream; anything goes.
     * @param docId
     */
    async unpin(cid: CID): Promise<void> {
        Promise.all(this.backends.map(async service => service.unpin(cid))).catch(() => {
            // Do Nothing
        })
    }
}