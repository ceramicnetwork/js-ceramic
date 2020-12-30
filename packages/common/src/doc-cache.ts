import { LRUMap } from 'lru_map'
import DocID from "@ceramicnetwork/docid"

import { DocStateHolder } from "./doctype"

/**
 * Encapsulates document caching (base, commits)
 */
export class DocCache {
    private readonly _cacheCommits: boolean

    private readonly _baseDocCache: LRUMap<string, DocStateHolder>
    private readonly _commitDocCache: LRUMap<string, DocStateHolder>
    private readonly _pinnedDocCache: Record<string, DocStateHolder>

    constructor(limit, cacheCommits = true) {
        this._cacheCommits = cacheCommits
        this._baseDocCache = new LRUMap(limit)
        this._pinnedDocCache = {}

        // use the same 'limit' if cacheCommits is enabled
        this._commitDocCache = this._cacheCommits? new LRUMap(limit) : new LRUMap(0)
    }

    /**
     * Sets to cache
     * @param doc - DocStateHolder instance
     * @param isPinned - Is document pinned?
     */
    set(doc: DocStateHolder, isPinned = false): void {
        if (isPinned) {
            this._pinnedDocCache[doc.id.toString()] = doc;
            this._baseDocCache.delete(doc.id.baseID.toString())
            this._commitDocCache.delete(doc.id.baseID.toString())
            return;
        }

        if (doc.id.commit == null) {
            this._baseDocCache.set(doc.id.baseID.toString(), doc)
            return;
        }

        if (this._cacheCommits) {
            this._commitDocCache.set(doc.id.toString(), doc)
        }
    }

    /**
     * Gets from cache
     * @param docId - DocId instance
     */
    get(docId: DocID): DocStateHolder {
        let doc = this._pinnedDocCache[docId.toString()]
        if (doc) {
            return doc
        }

        doc = this._baseDocCache.get(docId.toString())
        if (doc) {
            return doc
        }

        return this._cacheCommits? this._commitDocCache.get(docId.toString()): null
    }

    /**
     * Delete from cache
     * @param docId - DocId instance
     * @param pinnedOnly - Delete from pinned only cache
     */
    del(docId: DocID, pinnedOnly = false): void {
        if (pinnedOnly) {
            const doc = this._pinnedDocCache[docId.baseID.toString()]
            delete this._pinnedDocCache[docId.baseID.toString()]
            this.set(doc, false)
            return
        }
        this._baseDocCache.delete(docId.baseID.toString())
        this._commitDocCache.delete(docId.baseID.toString())

    }

    /**
     * Doc exists?
     * @param docId - DocId instance
     */
    has(docId: DocID): boolean {
        return this.get(docId) != null
    }

    /**
     * Applies function to all entries
     * @param applyFn - Function to apply
     */
    applyToAll(applyFn: (d: DocStateHolder) => void): void {
        this._baseDocCache.forEach((d) => applyFn(d))
        this._commitDocCache.forEach((d) => applyFn(d))

        Object.entries(this._pinnedDocCache).forEach(([, d]) => applyFn(d))
    }

    /**
     * Clears cache
     */
    clear(): void {
        this._baseDocCache.clear();
        this._commitDocCache.clear();
    }
}
