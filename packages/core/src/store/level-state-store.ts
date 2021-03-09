import Level from "level-ts";
import { DocState, Doctype, DoctypeUtils } from "@ceramicnetwork/common"
import { StateStore } from "./state-store"
import DocID from '@ceramicnetwork/docid'
import * as fs from 'fs'
import path from "path";

/**
 * Ceramic store for saving document state to a local leveldb instance
 */
export class LevelStateStore implements StateStore {
    #store: Level

    constructor(private storeRoot: string) {
    }

    /**
     * Gets internal db
     */
    get store(): Level {
        return this.#store
    }

    /**
     * Open pinning service
     */
    open(networkName: string): void {
        // Always store the pinning state in a network-specific directory
        const storePath = path.join(this.storeRoot, networkName)
        fs.mkdirSync(storePath, { recursive: true }) // create dir if it doesn't exist
        this.#store = new Level(storePath);
    }

    /**
     * Pin document
     * @param document - Document instance
     */
    async save(document: Doctype): Promise<void> {
        await this.#store.put(document.id.baseID.toString(), DoctypeUtils.serializeState(document.state))
    }

    /**
     * Load document state
     * @param docId - Document ID
     */
    async load(docId: DocID): Promise<DocState> {
        try {
            const state = await this.#store.get(docId.baseID.toString())
            if (state) {
                return DoctypeUtils.deserializeState(state);
            } else {
                return null;
            }
        } catch (err) {
            if (err.notFound) {
                return null; // return null for non-existent entry
            }
            throw err;
        }
    }

    /**
     * Unpin document
     * @param docId - Document ID
     */
    async remove(docId: DocID): Promise<void> {
        await this.#store.del(docId.baseID.toString())
    }

    /**
     * List pinned document
     * @param docId - Document ID
     */
    async list(docId?: DocID): Promise<string[]> {
        let docIds: string[]
        if (docId == null) {
            return this.#store.stream({ keys: true, values: false })
        } else {
            const exists = Boolean(await this.load(docId.baseID))
            docIds = exists ? [docId.toString()] : []
        }
        return docIds
    }

    /**
     * Close pinning service
     */
    async close(): Promise<void> {
        // Do Nothing
    }
}
