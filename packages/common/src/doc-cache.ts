import { LRUMap } from 'lru_map'
import DocID from "@ceramicnetwork/docid"

import { DocStateHolder } from "./doctype"

/**
 * Encapsulates document caching (base, commits)
 */
export class DocCache {
    private readonly _cacheCommits: boolean
    private readonly _baseCache: LRUMap<string, DocStateHolder>
    private readonly _commitCache: LRUMap<string, DocStateHolder>

    constructor(limit, cacheCommits = true) {
        this._cacheCommits = cacheCommits
        this._baseCache = new LRUMap(limit)
        this._commitCache = new LRUMap(limit)
    }

    /**
     * Sets to cache
     * @param doc - DocStateHolder instance
     */
    set(doc: DocStateHolder): void {
        this._baseCache.set(doc.id.baseID.toString(), doc)
        if (this._cacheCommits && doc.id.commit) {
            this._commitCache.set(doc.id.toString(), doc)
        }
    }

    /**
     * Gets from cache
     * @param docId - DocId instance
     */
    get(docId: DocID): DocStateHolder {
        const doc = this._baseCache.get(docId.toString())
        if (doc) {
            return doc
        }
        return this._cacheCommits? this._commitCache.get(docId.toString()): null
    }

    /**
     * Doc exists?
     * @param docId - DocId instance
     */
    has(docId: DocID): boolean {
        return this.get(docId) != null
    }
}
