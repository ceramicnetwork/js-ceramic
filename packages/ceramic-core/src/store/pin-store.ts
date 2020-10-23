import { StateStore } from "./state-store";
import { Pinning } from "../pinning/pinning";
import { Doctype, DocState } from "@ceramicnetwork/ceramic-common"
import CID from "cids"
import DocID from '@ceramicnetwork/docid'

/**
 * Encapsulates logic for pinning documents
 */
export class PinStore {
    constructor(
      readonly stateStore: StateStore,
      readonly pinning: Pinning,
      readonly retrieve: (cid: CID) => Promise<any | null>,
      readonly resolve: (path: string) => Promise<CID>
    ) {}

    async open(): Promise<void> {
        await this.stateStore.open()
        await this.pinning.open()
    }

    async close(): Promise<void> {
        await this.stateStore.close()
        await this.pinning.close()
    }

    async add(document: Doctype): Promise<void> {
        await this.stateStore.save(document)
        const points = await this.pointsOfInterest(document.state)
        await Promise.all(points.map(point => this.pinning.pin(point)))
    }

    async rm(docId: DocID): Promise<void> {
        const state = await this.stateStore.load(docId)
        if (state) {
            const points = await this.pointsOfInterest(state)
            Promise.all(points.map(point => this.pinning.unpin(point))).catch(() => {
                // Do Nothing
            })
            await this.stateStore.remove(docId)
        }
    }

    async ls(docId?: DocID): Promise<string[]> {
        return this.stateStore.list(docId)
    }

    protected async pointsOfInterest(state: DocState): Promise<Array<CID>> {
        const log = state.log as Array<CID>

        const points: CID[] = []
        for (const cid of log) {
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
