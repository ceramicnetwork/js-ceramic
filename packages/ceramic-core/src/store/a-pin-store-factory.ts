import {Context} from "@ceramicnetwork/ceramic-common";
import {ALevelStateStore} from "./a-level-state-store";
import {PinningAggregation} from "../pinning/pinning-aggregation";
import {IpfsPinning} from "../pinning/ipfs-pinning";
import {PowergatePinning} from "../pinning/powergate-pinning";
import {APinStore} from "./a-pin-store";
import CID from 'cids'
import path from "path";

export class APinStoreFactory {
    readonly stateStorePath: string
    readonly pinnings: string[]

    constructor(readonly context: Context, stateStorePath: string | undefined, pinnings: string[] | undefined) {
        this.stateStorePath = stateStorePath || path.join(process.cwd(), '.pinning.store')
        this.pinnings = pinnings && pinnings.length > 0 ? pinnings : ['ipfs://__context']
    }

    async open(): Promise<APinStore> {
        const stateStore = new ALevelStateStore(this.stateStorePath)
        const pinning = new PinningAggregation(this.context, this.pinnings, [IpfsPinning, PowergatePinning])
        const ipfs = this.context.ipfs
        const retrieve = async (cid: CID): Promise<any> => {
            const blob = await ipfs.dag.get(cid)
            return blob?.value
        }
        const resolve = async (path: string): Promise<CID> => {
            return ipfs.dag.resolve(path)
        }
        const pinStore = new APinStore(stateStore, pinning, retrieve, resolve)
        await pinStore.open()
        return pinStore
    }
}