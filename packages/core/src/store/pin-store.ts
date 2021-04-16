import { StateStore } from "./state-store";
import { LogEntry, StreamState, PinningBackend, StreamStateHolder } from '@ceramicnetwork/common';
import CID from "cids"
import StreamID from '@ceramicnetwork/streamid'

/**
 * Encapsulates logic for pinning documents
 */
export class PinStore {
    constructor(
      readonly stateStore: StateStore,
      readonly pinning: PinningBackend,
      readonly retrieve: (cid: CID) => Promise<any | null>,
      readonly resolve: (path: string) => Promise<CID>
    ) {}

    open(networkName: string): void {
        this.stateStore.open(networkName)
        this.pinning.open()
    }

    async close(): Promise<void> {
        await this.stateStore.close()
        await this.pinning.close()
    }

    async add(streamStateHolder: StreamStateHolder): Promise<void> {
        await this.stateStore.save(streamStateHolder)
        const points = await this.pointsOfInterest(streamStateHolder.state)
        await Promise.all(points.map(point => this.pinning.pin(point)))
    }

    async rm(streamId: StreamID): Promise<void> {
        const state = await this.stateStore.load(streamId)
        if (state) {
            const points = await this.pointsOfInterest(state)
            Promise.all(points.map(point => this.pinning.unpin(point))).catch(() => {
                // Do Nothing
            })
            await this.stateStore.remove(streamId)
        }
    }

    async ls(streamId?: StreamID): Promise<string[]> {
        return this.stateStore.list(streamId)
    }

    protected async pointsOfInterest(state: StreamState): Promise<Array<CID>> {
        const log = state.log as Array<LogEntry>

        const points: CID[] = []
        for (const { cid } of log) {
            points.push(cid)

            const record = await this.retrieve(cid)
            if (record && record.proof) {
                points.push(record.proof)

                const path = record.path ? "root/" + record.path : "root"
                const subPaths = path.split('/').filter(p => !!p)

                let currentPath = ""
                for (const subPath of subPaths) {
                    currentPath += "/" + subPath
                    const subPathResolved = await this.resolve(record.proof.toString() + currentPath)
                    points.push(subPathResolved)
                }
            }
        }
        return points
    }
}
