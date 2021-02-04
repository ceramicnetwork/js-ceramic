import { Context, PinningBackendStatic } from "@ceramicnetwork/common";
import { LevelStateStore } from "./level-state-store";
import { PinningAggregation } from "@ceramicnetwork/pinning-aggregation";
import { PinStore } from "./pin-store";
import CID from 'cids'
import path from "path";
import os from "os";
import { promises as fs } from 'fs'
import { IpfsPinning } from '@ceramicnetwork/pinning-ipfs-backend'

const DEFAULT_PINSET_DIRECTORY = path.join(os.homedir(), ".ceramic", "pinset")
const IPFS_GET_TIMEOUT = 30000 // 30 seconds

export type Props = {
    networkName?: string;
    pinsetDirectory?: string;
    pinningEndpoints?: string[];
    pinningBackends?: PinningBackendStatic[];
}

export class PinStoreFactory {
    readonly stateStorePath: string
    readonly pinningEndpoints: string[]
    readonly pinningBackends: PinningBackendStatic[];

    constructor(readonly context: Context, props: Props) {
        const directoryRoot = props.pinsetDirectory || DEFAULT_PINSET_DIRECTORY
        // Always store the pinning state in a network-specific directory
        this.stateStorePath = path.join(directoryRoot, props.networkName)
        this.pinningEndpoints = props.pinningEndpoints && props.pinningEndpoints.length > 0 ? props.pinningEndpoints : ['ipfs+context']
        this.pinningBackends = props.pinningBackends && props.pinningBackends.length > 0 ? props.pinningBackends : [IpfsPinning]
    }

    async open(): Promise<PinStore> {
        await fs.mkdir(this.stateStorePath, { recursive: true }) // create dir if it doesn't exist
        const stateStore = new LevelStateStore(this.stateStorePath)
        const pinning = PinningAggregation.build(this.context, this.pinningEndpoints, this.pinningBackends)
        const ipfs = this.context.ipfs
        const retrieve = async (cid: CID): Promise<any> => {
            const blob = await ipfs.dag.get(cid, { timeout: IPFS_GET_TIMEOUT })
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
