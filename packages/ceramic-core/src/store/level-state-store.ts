import Level from "level-ts";
import {DocState, Doctype, DoctypeUtils} from "@ceramicnetwork/ceramic-common"
import {StateStore} from "./state-store";

/**
 * Ceramic store for saving documents locally
 */
export class LevelStateStore implements StateStore {
    #store: Level

    constructor(private storePath: string) {
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
    async open(): Promise<void> {
        this.#store = new Level(this.storePath);
    }

    /**
     * Pin document
     * @param document - Document instance
     */
    async save(document: Doctype): Promise<void> {
        const normalized = DoctypeUtils.getBaseDocId(DoctypeUtils.normalizeDocId(document.id))
        await this.#store.put(normalized, DoctypeUtils.serializeState(document.state))
    }

    /**
     * Load document
     * @param docId - Document ID
     */
    async load(docId: string): Promise<DocState> {
        try {
            const normalized = DoctypeUtils.getBaseDocId(DoctypeUtils.normalizeDocId(docId))
            const state = await this.#store.get(normalized)
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
     * Is document pinned locally?
     * @param docId - Document ID
     */
    async exists(docId: string): Promise<boolean> {
        const state = await this.load(docId);
        return Boolean(state)
    }

    /**
     * Unpin document
     * @param docId - Document ID
     */
    async remove(docId: string): Promise<void> {
        const isPresent = await this.exists(docId)
        if (isPresent) {
            await this.#store.del(docId)
        }
    }

    /**
     * List pinned document
     * @param docId - Document ID
     */
    async list(docId?: string): Promise<string[]> {
        let docIds: string[]
        if (docId == null) {
            return this.#store.stream({keys: true, values: false})
        } else {
            const exists = await this.exists(docId)
            docIds = exists ? [docId] : []
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
