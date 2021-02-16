import { LRUMap } from 'lru_map'
import { DocID } from "@ceramicnetwork/docid"

import { DocStateHolder } from "./doctype"

/**
 * Encapsulates document caching (base, commits)
 */
export class DocCache {
    private readonly _cacheCommits: boolean

    private _pinnedDocCache: Record<string, DocStateHolder>
    private readonly _baseDocCache: LRUMap<string, DocStateHolder>
    private readonly _commitDocCache: LRUMap<string, DocStateHolder>

    constructor(limit, cacheCommits = true) {
        this._cacheCommits = cacheCommits
        this._baseDocCache = new LRUMap<string, DocStateHolder>(limit)
        this._pinnedDocCache = {}

        // use the same 'limit' if cacheCommits is enabled
        this._commitDocCache = this._cacheCommits? new LRUMap<string, DocStateHolder>(limit) : null
    }

    /**
     * Puts to cache
     * @param doc - DocStateHolder instance
     */
    put(doc: DocStateHolder): void {
        this._baseDocCache.set(doc.id.baseID.toString(), doc)
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
     * Puts to pinned
     */
    pin(doc: DocStateHolder) {
        this._pinnedDocCache[doc.id.toString()] = doc;
        this._baseDocCache.delete(doc.id.toString())
    }

    /**
     * Deletes from pinned and puts it to a regular cache
     */
    unpin(docId: DocID) {
        const doc = this._pinnedDocCache[docId.baseID.toString()]
        delete this._pinnedDocCache[docId.baseID.toString()]
        if (doc) {
            this.put(doc)
        }
        return
    }

    /**
     * Delete from cache
     * @param docId - DocId instance
     */
    del(docId: DocID): void {
        this._baseDocCache.delete(docId.baseID.toString())

        if (this._cacheCommits) {
            this._commitDocCache.delete(docId.toString())
        }
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

        if (this._cacheCommits) {
            this._commitDocCache.forEach((d) => applyFn(d))
        }
        Object.entries(this._pinnedDocCache).forEach(([, d]) => applyFn(d))
    }

    /**
     * Clears cache
     */
    clear(): void {
        this._pinnedDocCache = {}
        this._baseDocCache.clear();

        if (this._cacheCommits) {
            this._commitDocCache.clear();
        }
    }
}
