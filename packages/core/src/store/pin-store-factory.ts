import { Context, PinningBackendStatic } from "@ceramicnetwork/common";
import { LevelStateStore } from "./level-state-store";
import { PinningAggregation } from "@ceramicnetwork/pinning-aggregation";
import { PinStore } from "./pin-store";
import CID from 'cids'
import path from "path";
import { IpfsPinning } from '@ceramicnetwork/pinning-ipfs-backend'

export type Props = {
    networkName?: string;
    stateStorePath?: string;
    pinnings?: string[];
    pinningBackends?: PinningBackendStatic[];
}

export class PinStoreFactory {
    readonly stateStorePath: string
    readonly pinnings: string[]
    readonly pinningBackends: PinningBackendStatic[];

    constructor(readonly context: Context, props: Props) {
        const directoryName = ".pinning.store." + props.networkName
        const directoryRoot = props.stateStorePath || process.cwd()
        this.stateStorePath = path.join(directoryRoot, directoryName)
        this.pinnings = props.pinnings && props.pinnings.length > 0 ? props.pinnings : ['ipfs+context']
        this.pinningBackends = props.pinningBackends && props.pinningBackends.length > 0 ? props.pinningBackends : [IpfsPinning]
    }

    async open(): Promise<PinStore> {
        const stateStore = new LevelStateStore(this.stateStorePath)
        const pinning = PinningAggregation.build(this.context, this.pinnings, this.pinningBackends)
        const ipfs = this.context.ipfs
        const retrieve = async (cid: CID): Promise<any> => {
            const blob = await ipfs.dag.get(cid)
            return blob?.value
        }
        const resolve = async (path: string): Promise<CID> => {
            return (await ipfs.dag.resolve(path)).cid
        }
        const pinStore = new PinStore(stateStore, pinning, retrieve, resolve)
        await pinStore.open()
        return pinStore
    }
}
